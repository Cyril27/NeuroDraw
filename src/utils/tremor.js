// tremor.js
let startBtn, tremorMagEl;
let countdownEl, plotCanvas, plotCtx;
let recording = false;
let tremorData = [];
let recordStartTime = null;

const RECORD_DURATION = 5000; // 5 seconds

// ---------- PUBLIC API ----------
export function initTremor({
  startBtnId,
  magElId,
  countdownId,
  plotCanvasId
}) {
  startBtn = document.getElementById(startBtnId);
  tremorMagEl = document.getElementById(magElId);

  countdownEl = document.getElementById(countdownId);
  plotCanvas = document.getElementById(plotCanvasId);
  plotCtx = plotCanvas.getContext("2d");

  startBtn.addEventListener("click", startTremorSequence);
}

// ---------- INTERNALS ----------
function onMotion(e) {
  if (!recording) return;

  const a = e.accelerationIncludingGravity;
  if (!a) return;

  const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const t = (performance.now() - recordStartTime) / 1000;

  tremorData.push({ t, mag });
  tremorMagEl.textContent = mag.toFixed(2);
}

async function startTremorSequence() {
  // iOS permission
  if (typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function") {
    const response = await DeviceMotionEvent.requestPermission();
    if (response !== "granted") {
      tremorMagEl.textContent = "Motion permission denied";
      return;
    }
  }

  // 3-second countdown
  for (let i = 3; i > 0; i--) {
    countdownEl.textContent = `Starting in ${i}...`;
    await new Promise(r => setTimeout(r, 1000));
  }

  countdownEl.textContent = "Recording...";
  startTremor();

  setTimeout(() => {
    stopTremor();
    countdownEl.textContent = "Done";
  }, RECORD_DURATION);
}

function startTremor() {
  tremorData = [];
  recording = true;
  recordStartTime = performance.now();
  startBtn.disabled = true;

  window.addEventListener("devicemotion", onMotion);
}

function stopTremor() {
  recording = false;
  startBtn.disabled = false;
  window.removeEventListener("devicemotion", onMotion);

  if (tremorData.length < 2) return;

  plotTremor();
}

function plotTremor() {
  plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);

  const padding = 50;
  const W = plotCanvas.width;
  const H = plotCanvas.height;

  const tMin = 0;
  const tMax = RECORD_DURATION / 1000; // 5s

  const mags = tremorData.map(d => d.mag);
  const magMin = Math.min(...mags);
  const magMax = Math.max(...mags);
  const magRange = magMax - magMin || 1;

  const plotW = W - 2 * padding;
  const plotH = H - 2 * padding;

  plotCtx.font = "12px sans-serif";
  plotCtx.fillStyle = "#000";
  plotCtx.strokeStyle = "#000";
  plotCtx.lineWidth = 1;

  // ---- Axes ----
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

    plotCtx.fillText(t.toFixed(0), x - 4, H - padding + 20);
  }

  // ---- Y axis ticks (magnitude) ----
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const m = magMin + i * magRange / yTicks;
    const y = padding + (1 - (m - magMin) / magRange) * plotH;

    plotCtx.beginPath();
    plotCtx.moveTo(padding - 6, y);
    plotCtx.lineTo(padding, y);
    plotCtx.stroke();

    plotCtx.fillText(m.toFixed(2), 5, y + 4);
  }

  // ---- Signal ----
  plotCtx.beginPath();
  tremorData.forEach((p, i) => {
    const x = padding + (p.t - tMin) / (tMax - tMin) * plotW;
    const y = padding + (1 - (p.mag - magMin) / magRange) * plotH;

    if (i === 0) plotCtx.moveTo(x, y);
    else plotCtx.lineTo(x, y);
  });

  plotCtx.strokeStyle = "#007bff";
  plotCtx.lineWidth = 2;
  plotCtx.stroke();

  // ---- Axis labels ----
  plotCtx.fillText("Time (s)", W / 2 - 25, H - 10);

  plotCtx.save();
  plotCtx.translate(5, H / 2);
  plotCtx.rotate(-Math.PI / 2);
  plotCtx.fillText("Acceleration (m/s²)", 0, 0);
  plotCtx.restore();
}
