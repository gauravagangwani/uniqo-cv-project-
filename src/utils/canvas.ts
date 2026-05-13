export function saveAsPng(
  drawCanvas: HTMLCanvasElement,
  webcamCanvas: HTMLCanvasElement | null,
  filename = "airdraw.png"
): void {
  const composite = compositeCanvases(drawCanvas, webcamCanvas);
  const url = composite.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function compositeCanvases(
  drawCanvas: HTMLCanvasElement,
  webcamCanvas: HTMLCanvasElement | null
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = drawCanvas.width;
  out.height = drawCanvas.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, out.width, out.height);
  if (webcamCanvas) {
    ctx.globalAlpha = 0.5;
    ctx.drawImage(webcamCanvas, 0, 0, out.width, out.height);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(drawCanvas, 0, 0, out.width, out.height);
  return out;
}
