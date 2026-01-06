export function loadTemplate(canvasId, imageName) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = `../src/assets/templates/${imageName}`;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}