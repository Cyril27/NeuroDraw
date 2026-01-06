export function updateSaveButton() {
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = !canSave();
}
