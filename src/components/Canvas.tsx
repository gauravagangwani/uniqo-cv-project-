import { forwardRef } from "react";
import styles from "../styles/app.module.css";

export interface CanvasRefs {
  webcam: HTMLCanvasElement | null;
  draw: HTMLCanvasElement | null;
  overlay: HTMLCanvasElement | null;
  video: HTMLVideoElement | null;
}

interface Props {
  width?: number;
  height?: number;
  setRefs: (r: CanvasRefs) => void;
  errorMessage?: string | null;
}

const Canvas = forwardRef<HTMLDivElement, Props>(function Canvas(
  { width = 640, height = 480, setRefs, errorMessage },
  ref,
) {
  return (
    <div className={styles.canvasShell} ref={ref}>
      <div className={styles.canvasFrame} style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          className={styles.hiddenVideo}
          playsInline
          muted
          ref={(el) =>
            setRefs({
              webcam: document.getElementById("__webcam") as HTMLCanvasElement | null,
              draw: document.getElementById("__draw") as HTMLCanvasElement | null,
              overlay: document.getElementById("__overlay") as HTMLCanvasElement | null,
              video: el,
            })
          }
        />
        <canvas id="__webcam" className={styles.layer} width={width} height={height} />
        <canvas id="__draw" className={styles.layer} width={width} height={height} />
        <canvas id="__overlay" className={styles.layer} width={width} height={height} />
        {errorMessage && (
          <div className={styles.errorOverlay}>{errorMessage}</div>
        )}
      </div>
    </div>
  );
});

export default Canvas;
