import WatchSession from "../models/WatchSession.js";
import {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  BlobServiceClient,
} from "@azure/storage-blob";
import { Router } from "express";
import dotenv from "dotenv";
import verifyToken from "../middlewares/auth.js";

dotenv.config();
const router = Router();

const accountName = process.env.AZURE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_ACCOUNT_KEY;
const containerName = "videos";

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

// Azure Blob Service client
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

// Generate short-lived SAS URL for a blob (2 minutes default)

const generateSASurl = (blobName, expiresMinutes = 2) => {
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 1 * 60 * 1000), // allow slight clock skew
      expiresOn: new Date(Date.now() + expiresMinutes * 60 * 1000),
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
};

// Helper: convert readable stream to string
const streamToString = async (readableStream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
};

// Handle preflight requests for segments
router.options("/:id/segment/:filename", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.status(200).end();
});

// Serve individual segments with fresh SAS URLs
router.get("/:id/segment/:filename", verifyToken, async (req, res) => {
  try {
    const { id: videoId, filename } = req.params;
    const userId = req.user.id;

    if (!videoId || !filename) {
      return res.status(400).json({ msg: "Video ID or filename missing" });
    }

    // Verify user has access to this video
    const session = await WatchSession.findOne({ userId, videoId });
    if (!session) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Generate fresh SAS URL and fetch the segment content
    const blobName = `videos/social/${filename}`;

    // Use Azure Blob Service client directly
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Download the blob content
    const downloadResponse = await blobClient.download(0);

    // Set appropriate headers for video segment
    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Cache-Control", "public, max-age=120"); // Cache for 2 minutes
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Stream the content to the client
    downloadResponse.readableStreamBody.pipe(res);
  } catch (err) {
    console.error("Segment proxy error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      videoId,
      filename,
    });
    res.status(500).json({
      msg: "Segment access failed",
      error: err.message,
      details: "Check server logs for more information",
    });
  }
});

// Handle preflight requests for key
router.options("/:id/key", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.status(200).end();
});

// Serve encryption key with fresh SAS URL
router.get("/:id/key", verifyToken, async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;

    if (!videoId) {
      return res.status(400).json({ msg: "Video ID missing" });
    }

    // Verify user has access to this video
    const session = await WatchSession.findOne({ userId, videoId });
    if (!session) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Generate fresh SAS URL and fetch the key content
    const blobName = "videos/social/enc.key";

    // Use Azure Blob Service client directly
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Download the blob content
    const downloadResponse = await blobClient.download(0);

    // Set appropriate headers for encryption key
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=120"); // Cache for 2 minutes
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Stream the content to the client
    downloadResponse.readableStreamBody.pipe(res);
  } catch (err) {
    console.error("Key proxy error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      videoId,
    });
    res.status(500).json({
      msg: "Key access failed",
      error: err.message,
      details: "Check server logs for more information",
    });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const userId = req.user.id;

    if (!videoId) return res.status(400).json({ msg: "Video ID missing" });

    // Track user session (no hard cutoff - supports full video duration)
    let session = await WatchSession.findOne({ userId, videoId });
    if (!session) {
      session = await WatchSession.create({ userId, videoId });
    }

    // Read existing .m3u8 from Azure
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(
      "videos/social/output.m3u8"
    );
    const downloadResponse = await blobClient.download(0);
    let m3u8Content = await streamToString(downloadResponse.readableStreamBody);

    // Replace URLs to point to our backend proxy endpoints with absolute URLs
    // This ensures fresh SAS URLs are generated for each request

    // Get the base URL for absolute URLs
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Replace AES key URL with absolute backend proxy URL
    m3u8Content = m3u8Content.replace(
      /URI=".*enc.key"/,
      `URI="${baseUrl}/api/stream/${videoId}/key"`
    );

    // Replace all .ts segment URLs with absolute backend proxy URLs
    m3u8Content = m3u8Content.replace(
      /output(\d+).ts/g,
      (match) => `${baseUrl}/api/stream/${videoId}/segment/${match}`
    );

    // Set appropriate headers for HLS streaming
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.send(m3u8Content);
  } catch (err) {
    console.error("Streaming error:", err);
    res.status(500).json({ msg: "Streaming Failed" });
  }
});

export default router;
