export type GestureType = "draw" | "erase" | "pan" | "idle";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

/**
 * MediaPipe hand landmark connection pairs.
 * Used to render the skeleton overlay.
 */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],            // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],            // index
  [5, 9], [9, 10], [10, 11], [11, 12],       // middle
  [9, 13], [13, 14], [14, 15], [15, 16],     // ring
  [13, 17], [17, 18], [18, 19], [19, 20],    // pinky
  [0, 17],                                    // palm base
];

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Landmark indices:
 *   4  thumb tip
 *   8  index tip,  6  index PIP
 *   12 middle tip, 10 middle PIP
 *   16 ring tip,   14 ring PIP
 *   20 pinky tip,  18 pinky PIP
 */
export function classifyGesture(lm: NormalizedLandmark[]): GestureType {
  if (!lm || lm.length < 21) return "idle";

  // Pinch (thumb–index)
  if (dist(lm[4], lm[8]) < 0.06) return "pan";

  const indexExt = lm[8].y < lm[6].y;
  const middleExt = lm[12].y < lm[10].y;
  const ringExt = lm[16].y < lm[14].y;
  const pinkyExt = lm[20].y < lm[18].y;

  // Erase: all four fingers extended
  if (indexExt && middleExt && ringExt && pinkyExt) return "erase";

  // Draw: index extended, middle + ring folded
  if (indexExt && !middleExt && !ringExt) return "draw";

  return "idle";
}
