import styles from "../styles/toolbar.module.css";

export type Mode = "draw" | "magic";

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
}

export default function ModeSwitcher({ mode, onChange }: Props) {
  return (
    <div className={styles.modeTabs}>
      <button
        className={
          styles.modeTab +
          (mode === "draw" ? " " + styles.modeTabActiveDraw : "")
        }
        onClick={() => onChange("draw")}
      >
        DRAW
      </button>
      <button
        className={
          styles.modeTab +
          (mode === "magic" ? " " + styles.modeTabActiveMagic : "")
        }
        onClick={() => onChange("magic")}
      >
        MAGIC
      </button>
    </div>
  );
}
