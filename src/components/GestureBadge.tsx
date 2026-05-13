import type { GestureType } from "../utils/gestures";
import styles from "../styles/toolbar.module.css";

interface Props {
  gesture: GestureType | "magic";
}

const MAP: Record<string, { text: string; color: string }> = {
  draw: { text: "— DRAW", color: "#b8ff57" },
  erase: { text: "— ERASE", color: "#ff4d4d" },
  pan: { text: "— PAN", color: "#60a5fa" },
  idle: { text: "— IDLE", color: "#444444" },
  magic: { text: "— MAGIC ✦", color: "#e040fb" },
};

export default function GestureBadge({ gesture }: Props) {
  const { text, color } = MAP[gesture] ?? MAP.idle;
  return (
    <span className={styles.badge} style={{ color }}>
      {text}
    </span>
  );
}
