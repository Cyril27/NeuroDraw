// hand_video.js

let video, hand_canvas, hand_ctx;
let countdownEl, plotCanvas, plotCtx;
let recording = false;
let handData = [];
let recordStartTime = null;

let hands;

// ---------- PUBLIC API ----------

export function initHandVideo({
  videoId,
  canvasId,
  countdownId,
  plotCanvasId
}) {
  video = document.getElementById(videoId);
  hand_canvas = document.getElementById(canvasId);
  hand_ctx = hand_canvas.getContext("2d");

  countdownEl = document.getElementById(countdownId);
  plotCanvas = document.getElementById(plotCanvasId);
  plotCtx = plotCanvas.getContext("2d");

  setupMediaPipe();
  startCamera();
}

export async function startHandRecording() {
  handData = [];
  recording = false;

  // 3s countdown
  for (let i = 3; i > 0; i--) {
    countdownEl.textContent = `Starting in ${i}...`;
    await new Promise(r => setTimeout(r, 1000));
  }

  countdownEl.textContent = "Recording...";
  recording = true;
  recordStartTime = performance.now();

  setTimeout(() => {
    recording = false;
    countdownEl.textContent = "Done";
    plotHandDistance();
  }, 5000);
}

// ---------- INTERNALS ----------

function setupMediaPipe() {
  hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onHandResults);
}

function onHandResults(results) {
  hand_ctx.clearRect(0, 0, hand_canvas.width, hand_canvas.height);

  if (!recording || !results.multiHandLandmarks) return;

  const landmarks = results.multiHandLandmarks[0];

  drawConnectors(hand_ctx, landmarks, HAND_CONNECTIONS,
    { color: "#00ff00", lineWidth: 3 });
  drawLandmarks(hand_ctx, landmarks,
    { color: "#ff0000", radius: 4 });

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const dx = (thumbTip.x - indexTip.x) * hand_canvas.width;
  const dy = (thumbTip.y - indexTip.y) * hand_canvas.height;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const t = (performance.now() - recordStartTime) / 1000;
  handData.push({ t, d: distance });

  // Draw pinch line
  hand_ctx.beginPath();
  hand_ctx.moveTo(
    thumbTip.x * hand_canvas.width,
    thumbTip.y * hand_canvas.height
  );
  hand_ctx.lineTo(
    indexTip.x * hand_canvas.width,
    indexTip.y * hand_canvas.height
  );
  hand_ctx.strokeStyle = "#00ffff";
  hand_ctx.lineWidth = 4;
  hand_ctx.stroke();
}

function startCamera() {
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 600,
    height: 400,
  });

  camera.start();
}

function plotHandDistance() {
  plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
  if (handData.length < 2) return;

  const padding = 50;
  const W = plotCanvas.width;
  const H = plotCanvas.height;

  const tMin = 0;
  const tMax = 5;

  const dMin = Math.min(...handData.map(p => p.d));
  const dMax = Math.max(...handData.map(p => p.d));
  const dRange = dMax - dMin || 1;

  const plotW = W - 2 * padding;
  const plotH = H - 2 * padding;

  plotCtx.font = "12px sans-serif";
  plotCtx.fillStyle = "#000";
  plotCtx.strokeStyle = "#000";
  plotCtx.lineWidth = 1;

  // Axes
  plotCtx.beginPath();
  plotCtx.moveTo(padding, padding);
  plotCtx.lineTo(padding, H - padding);
  plotCtx.lineTo(W - padding, H - padding);
  plotCtx.stroke();

  // ---- X axis ticks (time) ----
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const t = tMin + i * (tMax - tMin) / xTicks;
    const x = padding + (t - tMin) / (tMax - tMin) * plotW;

    plotCtx.beginPath();
    plotCtx.moveTo(x, H - padding);
    plotCtx.lineTo(x, H - padding + 6);
    plotCtx.stroke();

    plotCtx.fillText(
      t.toFixed(0),
      x - 4,
      H - padding + 20
    );
  }

  // ---- Y axis ticks (distance) ----
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const d = dMin + i * dRange / yTicks;
    const y = padding + (1 - (d - dMin) / dRange) * plotH;

    plotCtx.beginPath();
    plotCtx.moveTo(padding - 6, y);
    plotCtx.lineTo(padding, y);
    plotCtx.stroke();

    plotCtx.fillText(
      d.toFixed(1),
      5,
      y + 4
    );
  }

  // ---- Signal ----
  plotCtx.beginPath();
  handData.forEach((p, i) => {
    const x = padding + (p.t - tMin) / (tMax - tMin) * plotW;
    const y = padding + (1 - (p.d - dMin) / dRange) * plotH;

    if (i === 0) plotCtx.moveTo(x, y);
    else plotCtx.lineTo(x, y);
  });

  plotCtx.strokeStyle = "#0077ff";
  plotCtx.lineWidth = 2;
  plotCtx.stroke();

  // Axis labels
  plotCtx.fillText("Time (s)", W / 2 - 25, H - 8);

  plotCtx.save();
  plotCtx.translate(5, H / 2 + 20);
  plotCtx.rotate(-Math.PI / 2);
  // plotCtx.fillText("Distance (px)", 0, 0);
  plotCtx.restore();
}
