import styles from "../styles/toolbar.module.css";

interface Props {
  swatches: string[];
  value: string;
  onChange: (c: string) => void;
}

export default function ColorPicker({ swatches, value, onChange }: Props) {
  return (
    <div className={styles.swatches}>
      {swatches.map((c) => (
        <button
          key={c}
          className={styles.swatch + (c === value ? " " + styles.swatchActive : "")}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`color ${c}`}
        />
      ))}
    </div>
  );
}
