import { showToast } from "./router.js";
import { Auth } from "./auth.js";

// Check authentication on page load
async function initUpload() {
  try {
    const user = await Auth.getCurrentUser();
    if (!user) {
      window.location.href = "index.html#login-required";
      return;
    }
    console.log("Upload page authorized for user:", user.username);
  } catch (error) {
    console.error("Upload auth check failed:", error);
    window.location.href = "index.html#login-required";
  }
}

initUpload();

const drop = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const statusEl = document.getElementById("status");
const completeEl = document.getElementById("complete-actions");

function startSimulation(fileName = "video.mp4") {
  drop.classList.add("pointer-events-none", "opacity-50");
  statusEl.textContent = "Uploading...";
  completeEl.classList.add("hidden");
  progress.classList.remove("hidden");
  progressBar.style.width = "0%";

  let pct = 0;
  const stagePoints = { upload: 60, encrypt: 90, complete: 100 };

  const tick = () => {
    pct += Math.random() * 7;
    if (pct >= stagePoints.upload && statusEl.textContent === "Uploading...") {
      statusEl.textContent = "Encrypting...";
    } else if (
      pct >= stagePoints.encrypt &&
      statusEl.textContent === "Encrypting..."
    ) {
      statusEl.textContent = "Finalizing...";
    }
    if (pct >= 100) {
      pct = 100;
      progressBar.style.width = pct + "%";
      clearInterval(timer);
      statusEl.textContent = "Complete!";
      completeEl.classList.remove("hidden");
      drop.classList.remove("pointer-events-none", "opacity-50");
      showToast(`"${fileName}" protected successfully`);
      const demoBtn = document.getElementById("view-player");
      demoBtn.href = "player.html?id=social";
    } else {
      progressBar.style.width = Math.floor(pct) + "%";
    }
  };
  const timer = setInterval(tick, 150);
}

// Drag and drop events
["dragover", "dragleave", "drop"].forEach((evt) => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === "dragover")
      drop.classList.add("ring-2", "ring-blue-500", "bg-blue-50");
    if (evt === "dragleave")
      drop.classList.remove("ring-2", "ring-blue-500", "bg-blue-50");
    if (evt === "drop") {
      drop.classList.remove("ring-2", "ring-blue-500", "bg-blue-50");
      const f = e.dataTransfer.files[0];
      startSimulation(f ? f.name : undefined);
    }
  });
});

drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) startSimulation(f.name);
});
