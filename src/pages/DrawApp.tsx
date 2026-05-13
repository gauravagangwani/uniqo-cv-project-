import { useEffect, useRef, useState } from "react";
import Canvas, { type CanvasRefs } from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import { useHandTracking } from "../hooks/useHandTracking";
import { useDrawing } from "../hooks/useDrawing";
import {
  classifyGesture,
  HAND_CONNECTIONS,
  type GestureType,
} from "../utils/gestures";
import { saveAsPng } from "../utils/canvas";
import { navigate } from "../router";
import styles from "../styles/app.module.css";

const W = 640;
const H = 480;

export default function DrawApp() {
  const [refs, setRefs] = useState<CanvasRefs>({
    webcam: null, draw: null, overlay: null, video: null,
  });
  const [gesture, setGesture] = useState<GestureType>("idle");
  const draw = useDrawing();
  const tracking = useHandTracking(refs.video);
  const rafRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    let stopped = false;

    function loop() {
      if (stopped) return;
      const { webcam, draw: drawCv, overlay, video } = refs;
      if (webcam && drawCv && overlay && video) {
        // 1. webcam (flipped)
        const wctx = webcam.getContext("2d");
        if (wctx && video.readyState >= 2) {
          wctx.save();
          wctx.scale(-1, 1);
          wctx.drawImage(video, -W, 0, W, H);
          wctx.restore();
        }

        // 2. overlay clear each frame
        const octx = overlay.getContext("2d");
        if (octx) octx.clearRect(0, 0, W, H);

        // 3. send to mediapipe
        tracking.sendFrame(video);

        const lm = tracking.frameRef.current.hands[0] ?? null;
        const g = lm ? classifyGesture(lm) : "idle";
        if (g !== gesture) setGesture(g);

        if (octx && lm) {
          // hand skeleton
          octx.save();
          octx.strokeStyle = "rgba(255,255,255,0.18)";
          octx.lineWidth = 1;
          octx.beginPath();
          for (const [a, b] of HAND_CONNECTIONS) {
            const pa = lm[a]; const pb = lm[b];
            octx.moveTo((1 - pa.x) * W, pa.y * H);
            octx.lineTo((1 - pb.x) * W, pb.y * H);
          }
          octx.stroke();
          octx.restore();

          const ix = (1 - lm[8].x) * W;
          const iy = lm[8].y * H;
          const px = (1 - lm[9].x) * W;
          const py = lm[9].y * H;

          if (g === "draw") {
            if (!isDrawingRef.current) {
              isDrawingRef.current = true;
              draw.beginStroke(drawCv, ix, iy);
            } else {
              draw.extendStroke(drawCv, ix, iy);
            }
            // cursor ring
            octx.save();
            octx.strokeStyle = draw.brushColor;
            octx.lineWidth = 1.5;
            octx.beginPath();
            octx.arc(ix, iy, draw.brushSize / 2 + 4, 0, Math.PI * 2);
            octx.stroke();
            octx.restore();
          } else if (g === "erase") {
            draw.erase(drawCv, px, py);
            // dashed red eraser ring
            const r = Math.max(draw.brushSize * 2.5, 35);
            octx.save();
            octx.strokeStyle = "#ff4d4d";
            octx.lineWidth = 1.5;
            octx.setLineDash([4, 4]);
            octx.beginPath();
            octx.arc(px, py, r, 0, Math.PI * 2);
            octx.stroke();
            octx.restore();
            isDrawingRef.current = false;
            draw.endStroke();
          } else {
            isDrawingRef.current = false;
            draw.endStroke();
          }
        } else {
          isDrawingRef.current = false;
          draw.endStroke();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [refs, tracking, draw, gesture]);

  const errorMessage =
    tracking.status === "camera-denied"
      ? "camera access denied. check your browser permissions."
      : tracking.status === "load-failed"
      ? "hand tracking unavailable. check your connection."
      : null;

  return (
    <div className={styles.appShell}>
      <Toolbar
        mode="draw"
        onMode={(m) => { if (m === "magic") navigate("/magic"); }}
        gesture={gesture}
        brushColor={draw.brushColor}
        setBrushColor={draw.setBrushColor}
        brushSize={draw.brushSize}
        setBrushSize={draw.setBrushSize}
        onUndo={() => refs.draw && draw.undo(refs.draw)}
        particleColor="#e040fb"
        setParticleColor={() => undefined}
        particleShape="star"
        setParticleShape={() => undefined}
        onClear={() => refs.draw && draw.clear(refs.draw)}
        onSave={() =>
          refs.draw && saveAsPng(refs.draw, refs.webcam, "airdraw-draw.png")
        }
      />
      <Canvas setRefs={setRefs} errorMessage={errorMessage} />
    </div>
  );
}
