import { canvasDrawn } from "../canvas/state.js";

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


export function updateSaveButton() {
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = !canSave();
}