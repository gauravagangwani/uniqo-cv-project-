import styles from "../styles/toolbar.module.css";

interface Props {
  size: number;
  onSize: (n: number) => void;
}

export default function BrushControls({ size, onSize }: Props) {
  return (
    <div className={styles.brushControls}>
      <input
        type="range"
        min={1}
        max={40}
        value={size}
        className={styles.range}
        onChange={(e) => onSize(parseInt(e.target.value, 10))}
      />
      <span className={styles.weight}>{size.toString().padStart(2, "0")}</span>
    </div>
  );
}
