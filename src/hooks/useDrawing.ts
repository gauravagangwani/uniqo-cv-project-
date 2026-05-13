import { useCallback, useRef, useState } from "react";

const MAX_UNDO = 20;

export interface UseDrawing {
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  beginStroke: (canvas: HTMLCanvasElement, x: number, y: number) => void;
  extendStroke: (canvas: HTMLCanvasElement, x: number, y: number) => void;
  endStroke: () => void;
  erase: (canvas: HTMLCanvasElement, x: number, y: number) => void;
  undo: (canvas: HTMLCanvasElement) => void;
  clear: (canvas: HTMLCanvasElement) => void;
}

export function useDrawing(): UseDrawing {
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(6);
  const prevPoint = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const inStroke = useRef(false);

  const pushSnapshot = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(snap);
    if (undoStack.current.length > MAX_UNDO) {
      undoStack.current.shift();
    }
  };

  const beginStroke = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number) => {
      if (!inStroke.current) {
        pushSnapshot(canvas);
        inStroke.current = true;
      }
      prevPoint.current = { x, y };
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushColor, brushSize]
  );

  const extendStroke = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const prev = prevPoint.current;
      if (!prev) {
        prevPoint.current = { x, y };
        return;
      }
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      prevPoint.current = { x, y };
    },
    [brushColor, brushSize]
  );

  const endStroke = useCallback(() => {
    prevPoint.current = null;
    inStroke.current = false;
  }, []);

  const erase = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const r = brushSize * 2 + 20;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    [brushSize]
  );

  const undo = useCallback((canvas: HTMLCanvasElement) => {
    const snap = undoStack.current.pop();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (snap) {
      ctx.putImageData(snap, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const clear = useCallback((canvas: HTMLCanvasElement) => {
    pushSnapshot(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return {
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    beginStroke,
    extendStroke,
    endStroke,
    erase,
    undo,
    clear,
  };
}
