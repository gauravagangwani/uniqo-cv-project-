import { useCallback, useRef, useState } from "react";
import type { Particle, ParticleShape } from "../utils/particles";
import { spawnFromTip, stepParticles, renderParticles } from "../utils/particles";

const TIP_INDICES = [4, 8, 12, 16, 20];

export function useParticles() {
  const particles = useRef<Particle[]>([]);
  const [color, setColor] = useState<string>("#e040fb");
  const [shape, setShape] = useState<ParticleShape>("star");

  const tick = useCallback(
    (overlayCtx: CanvasRenderingContext2D, hands: any[][], W: number, H: number) => {
      const now = performance.now();

      // Spawn from each detected fingertip
      for (let h = 0; h < hands.length; h++) {
        const lm = hands[h];
        if (!lm || lm.length < 21) continue;
        for (let t = 0; t < TIP_INDICES.length; t++) {
          const idx = TIP_INDICES[t];
          const x = (1 - lm[idx].x) * W;
          const y = lm[idx].y * H;
          spawnFromTip(particles.current, x, y, color, shape, now);
        }
      }

      stepParticles(particles.current, now);
      renderParticles(overlayCtx, particles.current);

      // Fingertip rings
      if (hands.length > 0) {
        overlayCtx.save();
        overlayCtx.strokeStyle = color;
        overlayCtx.globalAlpha = 0.5;
        overlayCtx.lineWidth = 1;
        for (let h = 0; h < hands.length; h++) {
          const lm = hands[h];
          if (!lm || lm.length < 21) continue;
          for (let t = 0; t < TIP_INDICES.length; t++) {
            const idx = TIP_INDICES[t];
            const x = (1 - lm[idx].x) * W;
            const y = lm[idx].y * H;
            overlayCtx.beginPath();
            overlayCtx.arc(x, y, 4, 0, Math.PI * 2);
            overlayCtx.stroke();
          }
        }
        overlayCtx.restore();
      }
    },
    [color, shape],
  );

  const clear = useCallback(() => {
    particles.current.length = 0;
  }, []);

  return { particles, color, setColor, shape, setShape, tick, clear };
}
