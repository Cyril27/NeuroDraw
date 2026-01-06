import { supabaseClient } from "./setup/supabase.js";

import { openTab } from "./ui/tabs.js"; 

import { getPressure } from "./utils/pressure.js";

import { mean, std } from "./utils/math.js";


import { setupCanvas, clearCanvas } from "./canvas/drawing.js";



import { canvasDrawn, canvasDirty } from "./setup/canvasState.js";


import { loadTemplate } from "./canvas/templates.js";

import { updateSaveButton } from "./ui/saveButton.js";

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
  loadTemplate("template_spiral1", "spiral_template.png");
  loadTemplate("template_spiral2", "spiral_template.png");
  loadTemplate("template_wave1", "wave_template.png");
  loadTemplate("template_wave2", "wave_template.png");

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