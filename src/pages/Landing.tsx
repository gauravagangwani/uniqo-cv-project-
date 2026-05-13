import { useEffect, useRef, useState } from "react";
import { navigate } from "../router";
import styles from "../styles/landing.module.css";

const MAGIC_STAR_COUNT = 60;

function MagicPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    type S = { x: number; y: number; r: number; phase: number; speed: number };
    const stars: S[] = Array.from({ length: MAGIC_STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
    let rafId = 0;
    function frame(t: number) {
      ctx!.clearRect(0, 0, W, H);
      ctx!.fillStyle = "#0a0a0a";
      ctx!.fillRect(0, 0, W, H);
      for (const s of stars) {
        const a = 0.4 + 0.6 * Math.abs(Math.sin(s.phase + (t / 1000) * s.speed));
        ctx!.save();
        ctx!.translate(s.x, s.y);
        ctx!.rotate((t / 1000) * 0.3);
        ctx!.globalAlpha = a;
        ctx!.fillStyle = "#e040fb";
        ctx!.beginPath();
        for (let i = 0; i < 5; i++) {
          const oa = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const ox = Math.cos(oa) * s.r;
          const oy = Math.sin(oa) * s.r;
          if (i === 0) ctx!.moveTo(ox, oy);
          else ctx!.lineTo(ox, oy);
          const ia = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
          ctx!.lineTo(Math.cos(ia) * s.r * 0.4, Math.sin(ia) * s.r * 0.4);
        }
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return <canvas ref={canvasRef} width={520} height={300} className={styles.previewCanvas} />;
}

function DrawPreview() {
  return (
    <svg viewBox="0 0 520 300" className={styles.previewSvg}>
      <rect width="520" height="300" fill="#0a0a0a" />
      <path d="M40 230 C 120 120, 220 280, 320 140" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M60 180 C 180 200, 240 80, 380 110" stroke="#b8ff57" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M120 90 C 200 60, 280 130, 420 60" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="420" cy="60" r="9" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="420" cy="60" r="2" fill="#ffffff" />
    </svg>
  );
}

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.wordmark}>AIRDRAW</div>
        <div className={styles.navRight}>
          <a className={styles.navLink} href="#">GitHub</a>
        </div>
      </nav>

      <section className={styles.hero + (mounted ? " " + styles.heroIn : "")}>
        <div className={styles.heroHalf}>
          <h1 className={styles.heroTitle}>DRAW.</h1>
          <p className={styles.heroSub}>gesture canvas. paint in the air.</p>
          <button
            className={styles.ctaWhite}
            onClick={() => navigate("/draw")}
          >
            OPEN DRAW →
          </button>
        </div>
        <div className={styles.heroDivider} />
        <div className={styles.heroHalf}>
          <h1 className={styles.heroTitle + " " + styles.heroTitleMagic}>MAGIC.</h1>
          <p className={styles.heroSub}>stars explode from your fingertips.</p>
          <button
            className={styles.ctaMagic}
            onClick={() => navigate("/magic")}
          >
            OPEN MAGIC →
          </button>
        </div>
      </section>

      <section className={styles.previews}>
        <div className={styles.previewCard}>
          <div className={styles.previewLabel}>01 / DRAW</div>
          <DrawPreview />
        </div>
        <div className={styles.previewCard}>
          <div className={styles.previewLabel}>02 / MAGIC</div>
          <MagicPreview />
        </div>
      </section>

      <section className={styles.features}>
        <Feature n="01" label="zero setup" desc="any browser, any webcam. no download." />
        <Feature n="02" label="two modes" desc="gesture painting and particle magic in one tab." />
        <Feature n="03" label="real-time" desc="mediapipe hand tracking at 30fps+." />
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerSide}>built on mediapipe hands</div>
        <div className={styles.footerCenter}>AIRDRAW</div>
        <div className={styles.footerSide + " " + styles.footerRight}>2025</div>
      </footer>
    </div>
  );
}

function Feature({ n, label, desc }: { n: string; label: string; desc: string }) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureNum}>{n}</div>
      <div className={styles.featureLabel}>{label}</div>
      <div className={styles.featureDesc}>{desc}</div>
    </div>
  );
}
