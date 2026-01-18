// Supabase client
const SUPABASE_URL = "https://fzgljqihruhafuqxvduy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Z2xqcWlocnVoYWZ1cXh2ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzkyNjMsImV4cCI6MjA4MjUxNTI2M30.Wz0f7Ss7rosusVAumaa1e1LenvNc4d5a6DGVfYQlTm0";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------- Tabs ---------- */
function openTab(id) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  document.querySelector(`[data-tab="${id}"]`).classList.add("active");
}


import { getPressure } from "./math/pressure.js";


function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(
    arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length
  );
}


/* ---------- Drawing ---------- */
function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  let drawing = false;
  let start_time = 0;
  let reset_draw = false;
  
  canvas.drawingData = {
    positions: [],
    times: [],
    pressures: []
  };



  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function getVelocity(e, lastPos, lastTime) {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    console.log("Delta Time:", deltaTime);

    const { x, y } = getPos(e);
    const deltaX = x - lastPos.x;
    const deltaY = y - lastPos.y;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    const velocity = distance / (deltaTime || 1); // pixels per ms

    return { velocity, currentTime, currentPos: { x, y } };
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

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawing) return;

    const pos = getPos(e);
    const t = Date.now() - start_time;
    const p = getPressure(e);

    canvas.drawingData.positions.push(pos);
    canvas.drawingData.times.push(t);
    canvas.drawingData.pressures.push(p);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }


  function endDraw() {

    if (!drawing) return;

    canvasDrawn[canvas.id] = true;
    canvasDirty[canvas.id] = true;
    updateSaveButton();

    drawing = false;
    reset_draw = true;

    const end_time = Date.now();
    const duration = end_time - start_time;

   

    console.log(`Drawing duration: ${duration} ms`);
    console.log('time list:', canvas.drawingData.times);
    console.log('position list:', canvas.drawingData.positions);
    
  }

  // Mouse
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  // Touch
  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchmove", e => {
    draw(e);
    e.preventDefault();
  });
  canvas.addEventListener("touchend", endDraw);
  
}



function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  canvasDrawn[canvasId] = false;
  updateSaveButton();
}


const canvasDrawn = {
  canvas_spiral1: false,
  canvas_spiral2: false,
  canvas_wave1: false,
  canvas_wave2: false
};

const canvasDirty = {
  canvas_spiral1: false,
  canvas_spiral2: false,
  canvas_wave1: false,
  canvas_wave2: false
};

function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return !pixels.some(value => value !== 0);
}

function markCanvasUsed() {
  updateSaveButton();
}

function loadTemplate(canvasId, imagePath) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = imagePath;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}

/* ---------- Save ---------- */
function downloadImage(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function savePatientMetadata(first_name, last_name, age, sex, stage, smoker, writing_hand, timestamp) {
  try {
    // Convert timestamp format to ISO 8601
    const [date, time] = timestamp.split("-");
    const [year, month, day] = date.split("_");
    const [hours, minutes, seconds] = time.split("_");
    const isoTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    const { data, error } = await supabaseClient
      .from("patients")
      .insert([
        {
          first_name: first_name,
          last_name: last_name,
          age: parseInt(age),
          sex: sex,
          stage: parseInt(stage),
          smoker: smoker,
          writing_hand: writing_hand,
          timestamp: isoTimestamp
        }
      ])
      .select();

    if (error) throw error;
    alert("Metadata saved to Supabase!");
    return data[0].id; // Extract and return the patient ID
  } catch (error) {
    console.error("Error saving to Supabase:", error.message);
    alert("Error saving metadata: " + error.message);
    return null;
  }
}

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(blob);
    }, "image/png");
  });
}


async function saveDrawingRow(patientId, canvas, drawingType) {
  const { data, error } = await supabaseClient
    .from(drawingType + "s")
    .insert({
      patient_id: patientId,
      canvas_id: canvas.id,
      positions: canvas.drawingData.positions,
      times: canvas.drawingData.times,
      pressures: canvas.drawingData.pressures
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}



async function uploadDrawingImage(drawingId, canvas, drawingType) {
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/png")
  );

  const filePath = `${drawingType}/${drawingType}_${drawingId}.png`;

  const { error } = await supabaseClient
    .storage
    .from("images")
    .upload(filePath, blob, {
      upsert: false,
      contentType: "image/png"
    });

  if (error) throw error;
}



function canSave() {
  return (
    document.getElementById("first-name").value.trim() &&
    document.getElementById("last-name").value.trim() &&
    document.getElementById("age").value &&
    document.querySelector('input[name="sex"]:checked') &&
    document.querySelector('input[name="stage"]:checked') &&
    document.querySelector('input[name="smoker"]:checked') &&
    document.querySelector('input[name="writing-hand"]:checked') &&
    Object.values(canvasDrawn).every(Boolean)
  );
}


function updateSaveButton() {
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = !canSave();
}



async function getOrCreatePatient(first_name, last_name, age, sex, stage, smoker, writing_hand) {
  // 1️⃣ Try to find existing patient
  const { data: existing, error: fetchError } = await supabaseClient
    .from("patients")
    .select("id")
    .eq("first_name", first_name)
    .eq("last_name", last_name)
    .eq("age", parseInt(age))
    .eq("sex", sex)
    .eq("writing_hand", writing_hand)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    console.log("Patient already exists:", existing.id);
    return existing.id;
  }

  // 2️⃣ Create patient if not found

  const { data: inserted, error: insertError } = await supabaseClient
    .from("patients")
    .insert({
      first_name,
      last_name,
      age: parseInt(age),
      sex,
      stage: parseInt(stage),
      smoker,
      writing_hand
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  console.log("New patient created:", inserted.id);
  return inserted.id;
}



async function saveAll() {
  
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn.disabled) return;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {

    const now = new Date();
    const timestamp = now.getFullYear() + "_" +
                      String(now.getMonth() + 1).padStart(2, "0") + "_" +
                      String(now.getDate()).padStart(2, "0") + "-" +
                      String(now.getHours()).padStart(2, "0") + "_" +
                      String(now.getMinutes()).padStart(2, "0") + "_" +
                      String(now.getSeconds()).padStart(2, "0");

    const first_name = document.getElementById("first-name").value;
    const last_name = document.getElementById("last-name").value;
    const age = document.getElementById("age").value ? document.getElementById("age").value : "";
    const sex = document.querySelector('input[name="sex"]:checked') ? document.querySelector('input[name="sex"]:checked').value : "";
    const stage = document.querySelector('input[name="stage"]:checked') ? document.querySelector('input[name="stage"]:checked').value : "";
    const smoker = document.querySelector('input[name="smoker"]:checked') ? document.querySelector('input[name="smoker"]:checked').value === "true": null;
    const writing_hand = document.querySelector('input[name="writing-hand"]:checked') ? document.querySelector('input[name="writing-hand"]:checked').value : "";


    const patientId = await getOrCreatePatient(
      first_name, last_name, age, sex, stage, smoker, writing_hand
    );

    const drawings = [
      { canvasId: "canvas_spiral1", type: "spiral" },
      { canvasId: "canvas_spiral2", type: "spiral" },
      { canvasId: "canvas_wave1", type: "wave" },
      { canvasId: "canvas_wave2", type: "wave" }
    ];

    for (const d of drawings) {
      if (!canvasDirty[d.canvasId]) continue;

      const canvas = document.getElementById(d.canvasId);

      const drawingId = await saveDrawingRow(
        patientId,
        canvas,
        d.type
      );

      await uploadDrawingImage(drawingId, canvas, d.type);

      canvasDirty[d.canvasId] = false;


    }

    alert("Saved successfully!");
    saveBtn.textContent = "Save";
  } catch (err) {
    alert("Error during save process: " + err.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
}

/* ---------- Initialize ---------- */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
  // Setup canvas drawing
  setupCanvas(document.getElementById("canvas_spiral1"));
  setupCanvas(document.getElementById("canvas_spiral2"));
  setupCanvas(document.getElementById("canvas_wave1"));
  setupCanvas(document.getElementById("canvas_wave2"));

  // Load templates
  loadTemplate("template_spiral1", "./templates/spiral_template.png");
  loadTemplate("template_spiral2", "./templates/spiral_template.png");
  loadTemplate("template_wave1", "./templates/wave_template.png");
  loadTemplate("template_wave2", "./templates/wave_template.png");

  // Setup tab switching
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      openTab(tabId);
    });
  });

  // Setup clear buttons
  document.querySelectorAll(".clear-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const canvasId = btn.getAttribute("data-canvas");
      clearCanvas(canvasId);
    });
  });

  document.querySelectorAll(".previous-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextTabId = btn.getAttribute("data-next");
      if (nextTabId) openTab(nextTabId);
    });
  });

  document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const nextTabId = btn.getAttribute("data-next");
      if (nextTabId) openTab(nextTabId);
    });
  });

  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", updateSaveButton);
    input.addEventListener("input", updateSaveButton);
  });

  // Setup save button
  document.getElementById("saveBtn").addEventListener("click", saveAll);
  });