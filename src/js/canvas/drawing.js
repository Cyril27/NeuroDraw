import { getPressure } from "../utils/pressure.js";
import { canvasDrawn, canvasDirty } from "../setup/canvasState.js";
import { updateSaveButton } from "../ui/saveButton.js";

export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  let drawing = false;
  let start_time = 0;
  let reset_draw = false;

  canvas.drawingData = {
    positions: [],
    times: [],
    pressures: []
  };

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return e.touches
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDraw(e) {
    if (reset_draw) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      reset_draw = false;
    }

    drawing = true;
    start_time = Date.now();
    canvas.drawingData.positions = [];
    canvas.drawingData.times = [];
    canvas.drawingData.pressures = [];

    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing) return;

    const p = getPos(e);
    canvas.drawingData.positions.push(p);
    canvas.drawingData.times.push(Date.now() - start_time);
    canvas.drawingData.pressures.push(getPressure(e));

    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() {
    if (!drawing) return;

    drawing = false;
    reset_draw = true;
    canvasDrawn[canvas.id] = true;
    canvasDirty[canvas.id] = true;
    updateSaveButton();
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchmove", e => {
    draw(e);
    e.preventDefault();
  });
  canvas.addEventListener("touchend", endDraw);
}


export function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  canvasDrawn[canvasId] = false;
  updateSaveButton();
}