🛡️ ShieldStream – Secure Video Streaming Platform

ShieldStream is a piracy-proof video streaming backend that protects premium content with enterprise-grade security.
Built for hackathons but designed with real-world DRM challenges in mind.

🌍 Why ShieldStream?

Digital piracy costs billions every year.

$75B – Global annual revenue lost to digital piracy (Motion Picture Association)

₹2,000 Cr – Revenue lost by Indian EdTech in 2024 alone (EY–IAMAI Report)

62% – Courses experience unauthorized sharing within weeks of launch (VdoCipher Research)

ShieldStream tackles this by combining AES-128 encryption, short-lived SAS URLs, JWT authentication, and secure backend proxying.

🔐 Key Features
🚀 Production-Ready Backend Security

Secure Upload → Videos uploaded to Azure Blob Storage with automatic HLS segmentation and AES-128 encryption

Rotating JWT Authentication → Short-lived access tokens + one-time refresh tokens (prevents replay attacks)

Time-Limited Access → Dynamic SAS URLs (2 min expiry), HTTPS enforced, prevents link sharing

Proxy Access → Clients never hit Azure directly. All .ts segments and .key files are proxied via backend

Session Validation → Each request validated against MongoDB WatchSession (blocks unauthorized playback)

🎥 Streaming Technology

HLS Streaming → Adaptive bitrate for smooth playback

AES-128 Encrypted Segments → Protects against raw file downloads

No Direct Blob Access → Azure Blob URLs are hidden, only backend serves media

Demo Mode → Falls back to sample video if Azure credentials are missing

🛠️ Tech Stack

Backend → Node.js + Express

Database → MongoDB (User & Session Management)

Storage → Azure Blob Storage

Encryption → AES-128 + short-lived SAS tokens

Streaming → HLS (HTTP Live Streaming)

⚙️ How It Works

Upload → Content uploaded to Azure → converted into .m3u8 + .ts segments with AES-128 key

Backend Proxy → All segment & key requests routed through /api/stream/:id/...

Authentication → JWT + MongoDB sessions validate every playback request

Time-Limited Access → SAS URLs expire in 2 minutes, forcing secure revalidation

Playback → Frontend HLS player streams content seamlessly

📊 Security Highlights

🔑 AES-128 Encrypted Segments & Keys

🔒 Rotating SAS URLs (2 min expiry)

🚫 No Direct Blob Access (all requests proxied via backend)

🧾 JWT + Session Validation in MongoDB

🌐 HTTPS Enforced for all traffic

📂 Backend Status

Authentication → ✅ Active

Encryption → ✅ AES-128

Storage → ✅ Azure Blob

Streaming → ✅ HLS + Proxy

👨‍💻 Hackathon Ready

✅ Fully working prototype

✅ Real-world inspired DRM security

✅ Clear problem statement & global impact

✅ Scalable architecture

© 2025 ShieldStream. All rights reserved.
