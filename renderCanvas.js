//

export default function renderCanvas() {
  // Add the canvas to the page, so we get debugging support with three.js extension in Chrome
  const renderContainer = document.getElementById('webglContainer');
  const renderCanvas = document.getElementById('webglCanvas');
  renderCanvas.style.position = 'fixed';
  return renderCanvas;
}