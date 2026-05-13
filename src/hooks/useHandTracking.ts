import { useEffect, useRef, useState } from "react";
import type { NormalizedLandmark } from "../utils/gestures";

declare global {
  interface Window {
    Hands?: any;
  }
}

export type HandStatus = "loading" | "ready" | "camera-denied" | "load-failed";

export interface HandFrame {
  hands: NormalizedLandmark[][]; // up to 2 hands
}

const FRAME_BUDGET_MS = 16;

export function useHandTracking(video: HTMLVideoElement | null) {
  const [status, setStatus] = useState<HandStatus>("loading");
  const frameRef = useRef<HandFrame>({ hands: [] });
  const handsRef = useRef<any>(null);
  const lastSent = useRef<number>(0);
  const sending = useRef<boolean>(false);

  useEffect(() => {
    if (!video) return;
    let cancelled = false;

    async function init() {
      const HandsCtor = window.Hands;
      if (!HandsCtor) {
        setStatus("load-failed");
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
      } catch {
        setStatus("camera-denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video!.srcObject = stream;
      video!.setAttribute("playsinline", "true");
      try {
        await video!.play();
      } catch {
        /* user-gesture issues handled upstream */
      }

      try {
        const hands = new HandsCtor({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.6,
        });
        hands.onResults((results: any) => {
          frameRef.current.hands = results.multiHandLandmarks ?? [];
        });
        handsRef.current = hands;
        setStatus("ready");
      } catch {
        setStatus("load-failed");
      }
    }

    init();
    return () => {
      cancelled = true;
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      handsRef.current?.close?.();
    };
  }, [video]);

  const sendFrame = async (v: HTMLVideoElement) => {
    if (!handsRef.current || v.readyState < 2 || sending.current) return;
    const now = performance.now();
    if (now - lastSent.current < FRAME_BUDGET_MS) return; // throttle
    lastSent.current = now;
    sending.current = true;
    try {
      await handsRef.current.send({ image: v });
    } finally {
      sending.current = false;
    }
  };

  return { status, frameRef, sendFrame };
}
