import { useEffect, useRef, useState } from "react";
import Canvas, { type CanvasRefs } from "../components/Canvas";
import Toolbar from "../components/Toolbar";
import { useHandTracking } from "../hooks/useHandTracking";
import { useParticles } from "../hooks/useParticles";
import { saveAsPng } from "../utils/canvas";
import { navigate } from "../router";
import styles from "../styles/app.module.css";

const W = 640;
const H = 480;

export default function MagicApp() {
  const [refs, setRefs] = useState<CanvasRefs>({
    webcam: null, draw: null, overlay: null, video: null,
  });
  const tracking = useHandTracking(refs.video);
  const particles = useParticles();
  const rafRef = useRef<number | null>(null);
  const [hasHands, setHasHands] = useState(false);

  useEffect(() => {
    let stopped = false;
    function loop() {
      if (stopped) return;
      const { webcam, overlay, video } = refs;
      if (webcam && overlay && video) {
        const wctx = webcam.getContext("2d");
        if (wctx && video.readyState >= 2) {
          wctx.save();
          wctx.scale(-1, 1);
          wctx.drawImage(video, -W, 0, W, H);
          wctx.restore();
        }
        const octx = overlay.getContext("2d");
        if (octx) octx.clearRect(0, 0, W, H);

        tracking.sendFrame(video);
        const hands = tracking.frameRef.current.hands;
        if ((hands.length > 0) !== hasHands) setHasHands(hands.length > 0);

        if (octx) particles.tick(octx, hands, W, H);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [refs, tracking, particles, hasHands]);

  const errorMessage =
    tracking.status === "camera-denied"
      ? "camera access denied. check your browser permissions."
      : tracking.status === "load-failed"
      ? "hand tracking unavailable. check your connection."
      : null;

  return (
    <div className={styles.appShell}>
      <Toolbar
        mode="magic"
        onMode={(m) => { if (m === "draw") navigate("/draw"); }}
        gesture={hasHands ? "magic" : "idle"}
        brushColor="#ffffff"
        setBrushColor={() => undefined}
        brushSize={6}
        setBrushSize={() => undefined}
        onUndo={() => undefined}
        particleColor={particles.color}
        setParticleColor={particles.setColor}
        particleShape={particles.shape}
        setParticleShape={particles.setShape}
        onClear={() => {
          particles.clear();
          if (refs.overlay) {
            const ctx = refs.overlay.getContext("2d");
            ctx?.clearRect(0, 0, W, H);
          }
        }}
        onSave={() =>
          refs.overlay && saveAsPng(refs.overlay, refs.webcam, "airdraw-magic.png")
        }
      />
      <Canvas setRefs={setRefs} errorMessage={errorMessage} />
    </div>
  );
}
