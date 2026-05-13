import type { ParticleShape } from "../utils/particles";
import ColorPicker from "./ColorPicker";
import BrushControls from "./BrushControls";
import GestureBadge from "./GestureBadge";
import ModeSwitcher, { type Mode } from "./ModeSwitcher";
import type { GestureType } from "../utils/gestures";
import styles from "../styles/toolbar.module.css";

const DRAW_SWATCHES = ["#ffffff", "#b8ff57", "#ff4d4d", "#60a5fa", "#f97316"];
const MAGIC_SWATCHES = ["#e040fb", "#00e5ff", "#ffd600", "#ffffff", "#ff4081"];

interface Props {
  mode: Mode;
  onMode: (m: Mode) => void;

  gesture: GestureType | "magic";

  // DRAW
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  onUndo: () => void;

  // MAGIC
  particleColor: string;
  setParticleColor: (c: string) => void;
  particleShape: ParticleShape;
  setParticleShape: (s: ParticleShape) => void;

  // Shared
  onClear: () => void;
  onSave: () => void;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function Toolbar(props: Props) {
  const {
    mode, onMode,
    gesture,
    brushColor, setBrushColor, brushSize, setBrushSize, onUndo,
    particleColor, setParticleColor, particleShape, setParticleShape,
    onClear, onSave,
  } = props;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <ModeSwitcher mode={mode} onChange={onMode} />
      </div>

      <div className={styles.center}>
        {mode === "draw" ? (
          <>
            <BrushControls size={brushSize} onSize={setBrushSize} />
            <ColorPicker
              swatches={DRAW_SWATCHES}
              value={brushColor}
              onChange={setBrushColor}
            />
          </>
        ) : (
          <>
            <div className={styles.shapeButtons}>
              {(["star", "dot", "sparkle"] as const).map((s) => (
                <button
                  key={s}
                  className={
                    styles.shapeBtn +
                    (s === particleShape ? " " + styles.shapeBtnActive : "")
                  }
                  onClick={() => setParticleShape(s)}
                >
                  {s === "star" ? "★ stars" : s === "dot" ? "• dots" : "✦ sparkle"}
                </button>
              ))}
            </div>
            <ColorPicker
              swatches={MAGIC_SWATCHES}
              value={particleColor}
              onChange={setParticleColor}
            />
          </>
        )}
      </div>

      <div className={styles.right}>
        <GestureBadge gesture={gesture} />
        <div className={styles.iconRow}>
          {mode === "draw" && (
            <button className={styles.iconBtn} title="Undo" onClick={onUndo}>
              <Icon>
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
              </Icon>
            </button>
          )}
          <button className={styles.iconBtn} title="Clear" onClick={onClear}>
            <Icon>
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
            </Icon>
          </button>
          <button className={styles.iconBtn} title="Save PNG" onClick={onSave}>
            <Icon>
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </Icon>
          </button>
        </div>
      </div>
    </div>
  );
}
