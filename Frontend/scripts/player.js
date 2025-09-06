import { BASE_URL } from "../config.js";
import { Auth } from "./auth.js";

class SecurePlayer {
  static async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("id") || "social";
    const isDemo = urlParams.get("demo") === "true";

    // Start countdown timer
    this.startCountdown();

    // Initialize video player
    if (isDemo) {
      // For demo, show a placeholder
      this.initDemoPlayer();
    } else {
      await this.initVideoPlayer(videoId);
    }
  }

  static startCountdown() {
    let timeLeft = 600; // 10 minutes in seconds
    const countdownElement = document.getElementById("countdown");

    // Only start countdown if the element exists
    if (!countdownElement) {
      console.log("Countdown element not found, skipping countdown timer");
      return;
    }

    const timer = setInterval(() => {
      timeLeft--;

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      countdownElement.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;

      if (timeLeft <= 30) {
        countdownElement.classList.add("timer-urgent");
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        const expiryOverlay = document.getElementById("expiry-overlay");
        if (expiryOverlay) {
          expiryOverlay.classList.remove("hidden");
        }
        // Pause video if it's playing
        const video = document.getElementById("video");
        if (video) {
          video.pause();
        }
      }
    }, 1000);
  }

  static initDemoPlayer() {
    const video = document.getElementById("video");
    video.src =
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    video.poster =
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg";
  }

  static async initVideoPlayer(videoId) {
    try {
      console.log(`Loading stream for video ID: ${videoId}`);

      // Try to refresh token first to ensure we have valid cookies
      await Auth.refreshToken();

      const response = await fetch(`${BASE_URL}/api/stream/${videoId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/vnd.apple.mpegurl,*/*",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        console.log("Authentication failed, redirecting to login");
        window.location.href = "index.html#login-required";
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Stream response error:", errorData);
        throw new Error(
          `Failed to load stream: ${response.status} - ${errorData}`
        );
      }

      const m3u8Content = await response.text();
      console.log(
        "M3U8 Content received:",
        m3u8Content.substring(0, 200) + "..."
      );

      const video = document.getElementById("video");

      if (Hls.isSupported()) {
        console.log("Using HLS.js for playback");
        const hls = new Hls({
          debug: true,
          xhrSetup: function (xhr, url) {
            // Include credentials for all backend requests
            xhr.withCredentials = true;
          },
        });

        // Create blob URL for the playlist
        const blob = new Blob([m3u8Content], {
          type: "application/vnd.apple.mpegurl",
        });
        const playlistUrl = URL.createObjectURL(blob);

        hls.loadSource(playlistUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          console.log("Manifest parsed, ready to play");
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
          console.error("HLS Error:", event, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error, trying to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error, trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.log("Fatal error, destroying HLS instance");
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        console.log("Using native HLS support");
        const blob = new Blob([m3u8Content], {
          type: "application/vnd.apple.mpegurl",
        });
        video.src = URL.createObjectURL(blob);
      } else {
        throw new Error("HLS is not supported in this browser");
      }
    } catch (error) {
      console.error("Error initializing video player:", error);

      // Show user-friendly error
      const errorDiv = document.createElement("div");
      errorDiv.className = "text-center p-8 text-red-600";
      errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <h3 class="text-lg font-semibold mb-2">Unable to Load Video</h3>
        <p class="text-sm">${error.message}</p>
        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Try Again
        </button>
      `;

      const video = document.getElementById("video");
      video.parentNode.replaceChild(errorDiv, video);
    }
  }
}

// Initialize player when page loads
document.addEventListener("DOMContentLoaded", () => {
  SecurePlayer.init();

  // Add copy link functionality
  document.getElementById("copy-link").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show success message
      const btn = document.getElementById("copy-link");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btn.classList.add("text-green-600");

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove("text-green-600");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link copied to clipboard");
    }
  });
});
