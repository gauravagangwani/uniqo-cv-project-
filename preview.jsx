/* Airdraw — single-file preview */
/* eslint-disable react-hooks/exhaustive-deps */

const { useEffect, useRef, useState, useCallback } = React;

/* ═════════════════ router ═════════════════ */
function getRoute() {
  const h = window.location.hash.replace(/^#/, "");
  if (h === "/draw") return "/draw";
  if (h === "/magic") return "/magic";
  return "/";
}
function navigate(r) { window.location.hash = r; }

/* ═════════════════ gestures ═════════════════ */
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];
const TIPS = [4, 8, 12, 16, 20];

function classifyGesture(lm) {
  if (!lm || lm.length < 21) return "idle";
  const d = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  if (d < 0.06) return "pan";
  const ix = lm[8].y  < lm[6].y;
  const mx = lm[12].y < lm[10].y;
  const rx = lm[16].y < lm[14].y;
  const px = lm[20].y < lm[18].y;
  if (ix && mx && rx && px) return "erase";
  if (ix && !mx && !rx)     return "draw";
  return "idle";
}

/* ═════════════════ particles ═════════════════ */
const GRAVITY = 0.04;
const MAX_P = 1100;

function spawnAt(arr, x, y, color, shape, now, sizeMul = 1) {
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    arr.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 1.6,
      vy: -(0.4 + Math.random() * 1.6),
      size: (2.5 + Math.random() * 4.5) * sizeMul,
      color, shape, alpha: 1,
      lifetime: 700 + Math.random() * 600,
      born: now,
      rot: Math.random() * Math.PI * 2,
    });
  }
  if (arr.length > MAX_P) arr.splice(0, arr.length - MAX_P);
}

function stepParticles(arr, now) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx; p.y += p.vy; p.vy += GRAVITY;
    p.alpha = Math.max(0, 1 - (now - p.born) / p.lifetime);
    if (p.alpha <= 0) arr.splice(i, 1);
  }
}

function drawStar(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot + p.born * 0.002);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const oa = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ox = Math.cos(oa) * p.size, oy = Math.sin(oa) * p.size;
    if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
    const ia = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(ia) * p.size * 0.4, Math.sin(ia) * p.size * 0.4);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawDot(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
  ctx.shadowColor = p.color; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawSparkle(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot + p.born * 0.003);
  ctx.globalAlpha = p.alpha;
  ctx.strokeStyle = p.color;
  ctx.shadowColor = p.color; ctx.shadowBlur = 6;
  ctx.lineWidth = 1.2; ctx.lineCap = "round";
  const r = p.size;
  ctx.beginPath();
  ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
  ctx.moveTo(0, -r); ctx.lineTo(0, r);
  ctx.moveTo(-r*0.6,-r*0.6); ctx.lineTo(r*0.6, r*0.6);
  ctx.moveTo(-r*0.6, r*0.6); ctx.lineTo(r*0.6,-r*0.6);
  ctx.stroke(); ctx.restore();
}
function renderParticles(ctx, arr) {
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    if (p.shape === "star") drawStar(ctx, p);
    else if (p.shape === "dot") drawDot(ctx, p);
    else drawSparkle(ctx, p);
  }
}

/* ═════════════════ palette ═════════════════ */
const DRAW_SWATCHES  = ["#ece8df", "#ffd66b", "#6ad7c8", "#c8a8ff", "#ff3d8a"];
const MAGIC_SWATCHES = ["#ff3d8a", "#ffd66b", "#6ad7c8", "#c8a8ff", "#ece8df"];

const BADGE_MAP = {
  draw:  { text: "DRAW",    color: "#ffd66b" },
  erase: { text: "ERASE",   color: "#ff6b6b" },
  pan:   { text: "PAN",     color: "#6ad7c8" },
  idle:  { text: "IDLE",    color: "#807a6e" },
  magic: { text: "MAGIC ✦", color: "#ff3d8a" },
};

function GestureBadge({ gesture }) {
  const m = BADGE_MAP[gesture] || BADGE_MAP.idle;
  return <span className="badge" style={{ color: m.color }}>— {m.text}</span>;
}

/* ═════════════════ rail + top strip ═════════════════ */

function Rail({ active }) {
  const items = [
    { id: "draw",   label: "01 / DRAW",   to: "/draw"  },
    { id: "magic",  label: "02 / MAGIC",  to: "/magic" },
    { id: "docs",   label: "03 / DOCS",   to: "#"       },
    { id: "github", label: "04 / GITHUB", to: "#"       },
  ];
  return (
    <aside className="rail">
      <div className="railMark" onClick={() => navigate("/")}>Airdraw</div>
      <nav className="railNav">
        {items.map((it) => (
          <a
            key={it.id}
            className={"railLink" + (active === it.id ? " active" : "")}
            href={it.to.startsWith("#") ? it.to : ("#" + it.to)}
          >
            {it.label}
          </a>
        ))}
      </nav>
      <div className="railFoot">
        <div>v0.1</div>
        <div className="dot" />
        <div>2026</div>
      </div>
    </aside>
  );
}

function TopStrip({ left, right }) {
  return (
    <div className="topStrip">
      <div>{left}</div>
      <div className="crosshair">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
        <span>{right}</span>
      </div>
    </div>
  );
}

/* ═════════════════ Toolbar (app pages) ═════════════════ */

function ColorPicker({ swatches, value, onChange }) {
  return (
    <div className="swatches">
      {swatches.map((c) => (
        <button
          key={c}
          className={"swatch" + (c === value ? " active" : "")}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function BrushControls({ size, onSize }) {
  return (
    <div className="brushControls">
      <input
        type="range" min={1} max={40} value={size} className="range"
        onChange={(e) => onSize(parseInt(e.target.value, 10))}
      />
      <span className="weight">{size.toString().padStart(2, "0")}</span>
    </div>
  );
}

function I({ children }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
}

function Toolbar(props) {
  const {
    mode, onMode, gesture,
    brushColor, setBrushColor, brushSize, setBrushSize,
    particleColor, setParticleColor, particleShape, setParticleShape,
    onUndo, onClear, onSave,
  } = props;
  return (
    <div className="toolbar">
      <div className="tbL">
        <div className="tbMark" onClick={() => navigate("/")}>Airdraw</div>
        <div className="modeTabs">
          <button
            className={"modeTab" + (mode === "draw" ? " activeDraw" : "")}
            onClick={() => onMode("draw")}>DRAW</button>
          <button
            className={"modeTab" + (mode === "magic" ? " activeMagic" : "")}
            onClick={() => onMode("magic")}>MAGIC</button>
        </div>
      </div>

      <div className="tbC">
        {mode === "draw" ? (
          <React.Fragment>
            <BrushControls size={brushSize} onSize={setBrushSize} />
            <ColorPicker swatches={DRAW_SWATCHES} value={brushColor} onChange={setBrushColor} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="shapeButtons">
              {["star","dot","sparkle"].map((s) => (
                <button key={s}
                  className={"shapeBtn" + (s === particleShape ? " active" : "")}
                  onClick={() => setParticleShape(s)}>
                  {s === "star" ? "★ stars" : s === "dot" ? "• dots" : "✦ sparkle"}
                </button>
              ))}
            </div>
            <ColorPicker swatches={MAGIC_SWATCHES} value={particleColor} onChange={setParticleColor} />
          </React.Fragment>
        )}
      </div>

      <div className="tbR">
        <GestureBadge gesture={gesture} />
        <div className="iconRow">
          {mode === "draw" && (
            <button className="iconBtn" title="Undo" onClick={onUndo}>
              <I><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></I>
            </button>
          )}
          <button className="iconBtn" title="Clear" onClick={onClear}>
            <I><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></I>
          </button>
          <button className="iconBtn" title="Save PNG" onClick={onSave}>
            <I><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></I>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ Hero demo (constellation web) ═════════════════ */

function HeroDemoCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      cv.width  = cv.clientWidth  * dpr;
      cv.height = cv.clientHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    const ctx = cv.getContext("2d");
    const particles = [];
    const tStart = performance.now();
    let rafId = 0;

    function frame() {
      const now = performance.now();
      const t = (now - tStart) / 1000;
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);

      // Two phantom hand "blobs" — produce 21 synthetic landmarks each
      const hands = [
        { cx: W * 0.30, cy: H * 0.58, sc: 0.22 * H, ph: 0,   color: "#ff3d8a" },
        { cx: W * 0.70, cy: H * 0.42, sc: 0.22 * H, ph: 1.7, color: "#ffd66b" },
      ];

      // build landmarks per hand around its centre + slow drift
      const handsLm = hands.map((h, hi) => {
        const breathing = 1 + Math.sin(t * 0.6 + h.ph) * 0.08;
        const driftX = Math.sin(t * 0.5 + h.ph) * (W * 0.025);
        const driftY = Math.cos(t * 0.7 + h.ph) * (H * 0.02);

        const lm = [];
        // wrist
        lm.push({ x: h.cx + driftX, y: h.cy + driftY + h.sc * 0.6 });
        // 5 fingers x 4 joints
        for (let f = 0; f < 5; f++) {
          const ang = (-Math.PI/2) + (f - 2) * 0.38 + Math.sin(t*1.2 + f + h.ph)*0.08;
          for (let j = 1; j <= 4; j++) {
            const r = h.sc * breathing * (0.20 + j * 0.18);
            lm.push({
              x: h.cx + driftX + Math.cos(ang) * r,
              y: h.cy + driftY + Math.sin(ang) * r + h.sc * 0.6,
            });
          }
        }
        return { lm, color: h.color };
      });

      // ---- draw constellation lines ----
      ctx.save();
      ctx.lineWidth = 1 * dpr;
      for (const { lm, color } of handsLm) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.moveTo(lm[a].x, lm[a].y);
          ctx.lineTo(lm[b].x, lm[b].y);
        }
        ctx.stroke();
      }
      // cross-hand connection between tips for extra "web"
      if (handsLm.length === 2) {
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = 0.10;
        ctx.beginPath();
        for (const ti of TIPS) {
          ctx.moveTo(handsLm[0].lm[ti].x, handsLm[0].lm[ti].y);
          ctx.lineTo(handsLm[1].lm[ti].x, handsLm[1].lm[ti].y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // ---- spawn dense particles at every landmark ----
      for (const { lm, color } of handsLm) {
        for (let i = 0; i < lm.length; i++) {
          if (Math.random() < 0.45)
            spawnAt(particles, lm[i].x, lm[i].y, color, "star", now, 1.2);
        }
      }

      stepParticles(particles, now);
      renderParticles(ctx, particles);

      // ---- joint dots ----
      ctx.save();
      for (const { lm, color } of handsLm) {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * dpr;
        for (let i = 0; i < lm.length; i++) {
          ctx.beginPath();
          ctx.arc(lm[i].x, lm[i].y, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} />;
}

/* ═════════════════ Landing ═════════════════ */

function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <Rail active={null} />
      <div className="page">
        <TopStrip
          left={"INDEX · 01 / HOME"}
          right={"LOC 40.7°N 74.0°W"}
        />

        <section className={"hero" + (mounted ? " in" : "")}>
          <div>
            <div className="heroLabel"><span className="ln" /> A WEBCAM-FIRST DRAWING STUDIO</div>
            <h1 className="heroTitle">
              <span className="scriptWord">paint</span><br/>
              <span>the air<em>,</em></span><br/>
              <span>summon </span>
              <span className="scriptWord amber">light.</span>
            </h1>
            <p className="heroLead">
              Airdraw turns your webcam into a brush. Trace strokes with a single
              finger, sweep an open palm to erase, pinch to pan. Or flip to MAGIC
              and pull constellations from every fingertip.
            </p>
            <div className="ctaRow">
              <button className="cta ctaSolid" onClick={() => navigate("/draw")}>
                ENTER DRAW <span className="arr">→</span>
              </button>
              <button className="cta ctaMagic" onClick={() => navigate("/magic")}>
                CAST MAGIC ✦
              </button>
              <button className="cta ctaGhost" onClick={() => {
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}>HOW IT WORKS</button>
            </div>
            <div className="heroSpecs">
              <div className="spec"><div className="v">21</div><div className="l">LANDMARKS / HAND</div></div>
              <div className="spec"><div className="v">2</div><div className="l">HANDS TRACKED</div></div>
              <div className="spec"><div className="v">30+</div><div className="l">FPS REAL-TIME</div></div>
            </div>
          </div>

          <div className="heroRight">
            <div className="heroCard">
              <div className="tag"><span className="d" />REC · LIVE</div>
              <span className="corner c1" /><span className="corner c2" />
              <span className="corner c3" /><span className="corner c4" />
              <HeroDemoCanvas />
            </div>
            <div className="heroCardCaption">FIG. 01 — CONSTELLATION OVERLAY</div>
          </div>
        </section>

        <section className="notesRow">
          <div className="note">
            <div className="h">no install</div>
            <div className="b">runs in any chromium / firefox tab. one URL, one webcam.</div>
          </div>
          <div className="note">
            <div className="h">two minds</div>
            <div className="b">a precise canvas mode and a generous, expressive particle mode.</div>
          </div>
          <div className="note">
            <div className="h">offline-able</div>
            <div className="b">after first load the model is cached. air-paint without wi-fi.</div>
          </div>
          <div className="note">
            <div className="h">private</div>
            <div className="b">nothing leaves your tab. video is processed locally in-browser.</div>
          </div>
        </section>

        <section className="chapters">
          <div className="chapter draw">
            <div className="num">01.</div>
            <div className="name">Draw.</div>
            <div className="body">
              A persistent canvas you paint with your index finger. Tune brush
              weight and colour from the toolbar. Sweep an open palm to clear
              regions; pinch to pause and reposition without leaving a mark.
            </div>
            <div className="glist">
              <div className="r"><span className="g">☝</span><span>index extended — paint a line</span></div>
              <div className="r"><span className="g">✋</span><span>open palm — erase under your hand</span></div>
              <div className="r"><span className="g">👌</span><span>pinch — pan without drawing</span></div>
            </div>
            <button className="open" onClick={() => navigate("/draw")}>
              OPEN CHAPTER 01 <span className="arr">→</span>
            </button>
          </div>

          <div className="chapter magic">
            <div className="num">02.</div>
            <div className="name">Magic.</div>
            <div className="body">
              Every joint becomes a starpoint. Skeletons join with thin lines,
              fingertips bloom dense clusters of light, and stars decay with a
              soft gravity. Up to two hands at once.
            </div>
            <div className="glist">
              <div className="r"><span className="g">★</span><span>stars — chunky 5-point shapes</span></div>
              <div className="r"><span className="g">•</span><span>dots — soft glowing pellets</span></div>
              <div className="r"><span className="g">✦</span><span>sparkle — crossed line bursts</span></div>
            </div>
            <button className="open" onClick={() => navigate("/magic")}>
              OPEN CHAPTER 02 <span className="arr">→</span>
            </button>
          </div>
        </section>

        <section className="how" id="how">
          <div className="h">How it<br/>works.</div>
          <div className="steps">
            <div className="step">
              <div className="n">01 / PERMIT</div>
              <div className="t">Allow the camera</div>
              <div className="d">Airdraw asks once and never leaves the browser. Nothing is uploaded; the video stream stays on your machine.</div>
            </div>
            <div className="step">
              <div className="n">02 / TRACK</div>
              <div className="t">Mediapipe locks on</div>
              <div className="d">21 landmarks per hand are detected at 30 fps. We mirror the feed so the canvas behaves like a real mirror.</div>
            </div>
            <div className="step">
              <div className="n">03 / EXPRESS</div>
              <div className="t">Paint, sweep, sparkle</div>
              <div className="d">A tiny classifier maps your finger shapes to drawing actions. Toggle between modes mid-session.</div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div>BUILT ON MEDIAPIPE HANDS · V0.1</div>
          <div className="center">Airdraw</div>
          <div className="r">© 2026 · MADE WITH FIVE FINGERS</div>
        </footer>
      </div>
    </div>
  );
}

/* ═════════════════ Hand tracking hook ═════════════════ */

function useHandTracking() {
  const [status, setStatus] = useState("idle");
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const framesRef = useRef({ hands: [] });
  const lastSent = useRef(0);
  const sending = useRef(false);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("not-supported"); return;
    }
    if (!window.Hands) { setStatus("load-failed"); return; }
    if (!videoRef.current) {
      const v = document.createElement("video");
      v.setAttribute("playsinline", "true");
      v.muted = true; v.style.display = "none";
      document.body.appendChild(v);
      videoRef.current = v;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (e) {
      setStatus("denied"); return;
    }
    try {
      const hands = new window.Hands({
        locateFile: (file) =>
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/" + file,
      });
      hands.setOptions({
        maxNumHands: 2, modelComplexity: 1,
        minDetectionConfidence: 0.7, minTrackingConfidence: 0.55,
      });
      hands.onResults((results) => {
        framesRef.current.hands = results.multiHandLandmarks || [];
      });
      handsRef.current = hands;
      setStatus("ready");
    } catch (e) { setStatus("load-failed"); }
  }, []);

  const sendFrame = useCallback(async () => {
    const v = videoRef.current;
    if (!handsRef.current || !v || v.readyState < 2 || sending.current) return;
    const now = performance.now();
    if (now - lastSent.current < 33) return;
    lastSent.current = now;
    sending.current = true;
    try { await handsRef.current.send({ image: v }); }
    catch { /* ignore */ }
    finally { sending.current = false; }
  }, []);

  useEffect(() => () => {
    const v = videoRef.current;
    if (v?.srcObject) v.srcObject.getTracks().forEach((t) => t.stop());
    handsRef.current?.close?.();
  }, []);

  return { status, start, sendFrame, framesRef, videoRef };
}

/* ═════════════════ Camera gate ═════════════════ */

function CameraGate({ status, onStart }) {
  if (status === "ready") return null;
  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();

  if (status === "requesting") {
    return (
      <div className="gate">
        <div className="big">tuning in…</div>
        <div className="sub">asking your browser for the camera. allow it from the prompt.</div>
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="gate">
        <div className="big">camera blocked</div>
        <div className="sub">
          your browser refused the camera.
          {inIframe && <> previews inside another app commonly block <code>getUserMedia</code> —
          try opening this page in its own tab.</>}
        </div>
        <div className="acts">
          <button className="cta ctaSolid" onClick={onStart}>RETRY</button>
          <button className="cta ctaGhost"
            onClick={() => window.open(window.location.href, "_blank")}>OPEN IN NEW TAB</button>
        </div>
      </div>
    );
  }
  if (status === "load-failed") {
    return (
      <div className="gate">
        <div className="big">offline</div>
        <div className="sub">couldn't load the hand-tracking model. check your connection and retry.</div>
        <div className="acts">
          <button className="cta ctaSolid" onClick={onStart}>RETRY</button>
        </div>
      </div>
    );
  }
  if (status === "not-supported") {
    return (
      <div className="gate">
        <div className="big">unsupported</div>
        <div className="sub">this browser doesn't expose a camera API. try chrome, firefox, or safari.</div>
      </div>
    );
  }
  // idle
  return (
    <div className="gate">
      <div className="big">give airdraw a hand.</div>
      <div className="sub">
        tap below to share your camera. nothing leaves your device — the
        video stream is processed entirely in this tab.
        {inIframe && <><br/><br/>this preview is embedded — if the prompt
        is blocked, open this page in its own tab.</>}
      </div>
      <div className="acts">
        <button className="cta ctaMagic" onClick={onStart}>ENABLE CAMERA ✦</button>
        {inIframe && (
          <button className="cta ctaGhost"
            onClick={() => window.open(window.location.href, "_blank")}>
            OPEN IN NEW TAB
          </button>
        )}
      </div>
    </div>
  );
}

/* ═════════════════ DRAW app ═════════════════ */

const WCV = 640, HCV = 480;

function DrawApp() {
  const [brushColor, setBrushColor] = useState("#ffd66b");
  const [brushSize, setBrushSize] = useState(8);
  const [gesture, setGesture] = useState("idle");
  const tracking = useHandTracking();

  const webcamRef = useRef(null);
  const drawRef = useRef(null);
  const overlayRef = useRef(null);
  const prevRef = useRef(null);
  const undoStack = useRef([]);
  const inStroke = useRef(false);

  function snapshot(cv) {
    const ctx = cv.getContext("2d");
    undoStack.current.push(ctx.getImageData(0, 0, cv.width, cv.height));
    if (undoStack.current.length > 20) undoStack.current.shift();
  }

  useEffect(() => {
    let rafId = 0;
    function frame() {
      const wc = webcamRef.current, dc = drawRef.current, oc = overlayRef.current;
      const v = tracking.videoRef.current;
      if (wc && dc && oc) {
        const wctx = wc.getContext("2d");
        const octx = oc.getContext("2d");
        const dctx = dc.getContext("2d");

        if (v && v.readyState >= 2 && tracking.status === "ready") {
          wctx.save();
          wctx.scale(-1, 1);
          wctx.drawImage(v, -WCV, 0, WCV, HCV);
          wctx.restore();
          wctx.fillStyle = "rgba(29, 30, 34, 0.42)";
          wctx.fillRect(0, 0, WCV, HCV);
        }
        octx.clearRect(0, 0, WCV, HCV);

        if (tracking.status === "ready") {
          tracking.sendFrame();
          const lm = tracking.framesRef.current.hands[0] || null;
          const g = lm ? classifyGesture(lm) : "idle";
          if (g !== gesture) setGesture(g);

          if (lm) {
            // skeleton
            octx.save();
            octx.strokeStyle = "rgba(236, 232, 223, 0.22)";
            octx.lineWidth = 1.2;
            octx.beginPath();
            for (const [a, b] of HAND_CONNECTIONS) {
              octx.moveTo((1 - lm[a].x) * WCV, lm[a].y * HCV);
              octx.lineTo((1 - lm[b].x) * WCV, lm[b].y * HCV);
            }
            octx.stroke();
            octx.fillStyle = "rgba(236, 232, 223, 0.55)";
            for (let i = 0; i < lm.length; i++) {
              octx.beginPath();
              octx.arc((1 - lm[i].x) * WCV, lm[i].y * HCV, 2, 0, Math.PI * 2);
              octx.fill();
            }
            octx.restore();

            const ix = (1 - lm[8].x) * WCV, iy = lm[8].y * HCV;
            const px = (1 - lm[9].x) * WCV, py = lm[9].y * HCV;

            if (g === "draw") {
              if (!inStroke.current) {
                snapshot(dc);
                inStroke.current = true;
                prevRef.current = { x: ix, y: iy };
                dctx.fillStyle = brushColor;
                dctx.beginPath();
                dctx.arc(ix, iy, brushSize / 2, 0, Math.PI * 2);
                dctx.fill();
              } else {
                dctx.strokeStyle = brushColor;
                dctx.lineWidth = brushSize;
                dctx.lineCap = "round"; dctx.lineJoin = "round";
                dctx.shadowColor = brushColor; dctx.shadowBlur = 4;
                dctx.beginPath();
                dctx.moveTo(prevRef.current.x, prevRef.current.y);
                dctx.lineTo(ix, iy);
                dctx.stroke();
                dctx.shadowBlur = 0;
                prevRef.current = { x: ix, y: iy };
              }
              octx.save();
              octx.strokeStyle = brushColor; octx.lineWidth = 1.5;
              octx.beginPath();
              octx.arc(ix, iy, brushSize / 2 + 4, 0, Math.PI * 2);
              octx.stroke();
              octx.restore();
            } else if (g === "erase") {
              const r = Math.max(brushSize * 2.5, 35);
              dctx.save();
              dctx.globalCompositeOperation = "destination-out";
              dctx.beginPath(); dctx.arc(px, py, r, 0, Math.PI * 2); dctx.fill();
              dctx.restore();
              octx.save();
              octx.strokeStyle = "#ff6b6b"; octx.lineWidth = 1.6; octx.setLineDash([5, 5]);
              octx.beginPath(); octx.arc(px, py, r, 0, Math.PI * 2); octx.stroke();
              octx.restore();
              inStroke.current = false; prevRef.current = null;
            } else if (g === "pan") {
              octx.save();
              octx.strokeStyle = "#6ad7c8"; octx.lineWidth = 1.5;
              octx.beginPath(); octx.arc(ix, iy, 12, 0, Math.PI * 2); octx.stroke();
              octx.restore();
              inStroke.current = false; prevRef.current = null;
            } else {
              inStroke.current = false; prevRef.current = null;
            }
          } else {
            inStroke.current = false; prevRef.current = null;
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [tracking, brushColor, brushSize, gesture]);

  function undo() {
    const dc = drawRef.current; if (!dc) return;
    const snap = undoStack.current.pop();
    const ctx = dc.getContext("2d");
    if (snap) ctx.putImageData(snap, 0, 0);
    else ctx.clearRect(0, 0, dc.width, dc.height);
  }
  function clear() {
    const dc = drawRef.current; if (!dc) return;
    snapshot(dc);
    dc.getContext("2d").clearRect(0, 0, dc.width, dc.height);
  }
  function save() {
    const dc = drawRef.current, wc = webcamRef.current; if (!dc) return;
    const out = document.createElement("canvas");
    out.width = dc.width; out.height = dc.height;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#1d1e22"; ctx.fillRect(0, 0, out.width, out.height);
    if (wc) { ctx.globalAlpha = 0.55; ctx.drawImage(wc, 0, 0); ctx.globalAlpha = 1; }
    ctx.drawImage(dc, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "airdraw-draw.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  return (
    <div>
      <Rail active="draw" />
      <div className="page appShell">
        <Toolbar
          mode="draw"
          onMode={(m) => { if (m === "magic") navigate("/magic"); }}
          gesture={gesture}
          brushColor={brushColor} setBrushColor={setBrushColor}
          brushSize={brushSize} setBrushSize={setBrushSize}
          particleColor="#ff3d8a" setParticleColor={() => {}}
          particleShape="star"    setParticleShape={() => {}}
          onUndo={undo} onClear={clear} onSave={save}
        />
        <div className="canvasShell">
          <div className="canvasFrame">
            <canvas ref={webcamRef}  className="layer" width={WCV} height={HCV} />
            <canvas ref={drawRef}    className="layer" width={WCV} height={HCV} />
            <canvas ref={overlayRef} className="layer" width={WCV} height={HCV} />
            <span className="corner c1" /><span className="corner c2" />
            <span className="corner c3" /><span className="corner c4" />
            <CameraGate status={tracking.status} onStart={tracking.start} />
            {tracking.status === "ready" && (
              <div className="hint">
                <span className="l">☝ DRAW · ✋ ERASE · 👌 PAN</span>
                <span className="r">{gesture === "idle" ? "SHOW A HAND" : "✓ TRACKING"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ MAGIC app ═════════════════ */
/* Renders dense particles at ALL 21 landmarks + connecting constellation
   lines, matching the reference style. */

function MagicApp() {
  const [particleColor, setParticleColor] = useState("#ff3d8a");
  const [particleShape, setParticleShape] = useState("star");
  const tracking = useHandTracking();

  const webcamRef = useRef(null);
  const overlayRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    let rafId = 0;
    function frame() {
      const wc = webcamRef.current, oc = overlayRef.current;
      const v = tracking.videoRef.current;
      if (wc && oc) {
        const wctx = wc.getContext("2d");
        const octx = oc.getContext("2d");

        if (v && v.readyState >= 2 && tracking.status === "ready") {
          wctx.save();
          wctx.scale(-1, 1);
          wctx.drawImage(v, -WCV, 0, WCV, HCV);
          wctx.restore();
          wctx.fillStyle = "rgba(29, 30, 34, 0.32)";
          wctx.fillRect(0, 0, WCV, HCV);
        }
        octx.clearRect(0, 0, WCV, HCV);

        if (tracking.status === "ready") {
          tracking.sendFrame();
          const hands = tracking.framesRef.current.hands;
          const now = performance.now();

          // 1) skeleton connection lines (constellation)
          if (hands.length > 0) {
            octx.save();
            octx.strokeStyle = particleColor;
            octx.globalAlpha = 0.55;
            octx.lineWidth = 1.1;
            octx.shadowColor = particleColor;
            octx.shadowBlur = 4;
            octx.beginPath();
            for (let h = 0; h < hands.length; h++) {
              const lm = hands[h];
              for (const [a, b] of HAND_CONNECTIONS) {
                octx.moveTo((1 - lm[a].x) * WCV, lm[a].y * HCV);
                octx.lineTo((1 - lm[b].x) * WCV, lm[b].y * HCV);
              }
            }
            octx.stroke();
            octx.restore();
          }

          // 2) cross-hand fingertip web (subtle white)
          if (hands.length === 2) {
            octx.save();
            octx.strokeStyle = "#ffffff";
            octx.globalAlpha = 0.10;
            octx.lineWidth = 1;
            octx.beginPath();
            for (const ti of TIPS) {
              const a = hands[0][ti], b = hands[1][ti];
              octx.moveTo((1 - a.x) * WCV, a.y * HCV);
              octx.lineTo((1 - b.x) * WCV, b.y * HCV);
            }
            octx.stroke();
            octx.restore();
          }

          // 3) spawn dense particles at every landmark
          for (let h = 0; h < hands.length; h++) {
            const lm = hands[h];
            for (let i = 0; i < lm.length; i++) {
              const x = (1 - lm[i].x) * WCV;
              const y = lm[i].y * HCV;
              // tips get more particles
              const isTip = TIPS.includes(i);
              if (Math.random() < (isTip ? 0.85 : 0.5)) {
                spawnAt(particles.current, x, y, particleColor, particleShape, now, isTip ? 1.2 : 0.9);
              }
            }
          }

          // 4) step + render
          stepParticles(particles.current, now);
          renderParticles(octx, particles.current);

          // 5) bright landmark dots on top
          if (hands.length > 0) {
            octx.save();
            octx.fillStyle = particleColor;
            octx.shadowColor = particleColor;
            octx.shadowBlur = 8;
            for (let h = 0; h < hands.length; h++) {
              const lm = hands[h];
              for (let i = 0; i < lm.length; i++) {
                octx.beginPath();
                octx.arc((1 - lm[i].x) * WCV, lm[i].y * HCV, 2.5, 0, Math.PI * 2);
                octx.fill();
              }
            }
            octx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [tracking, particleColor, particleShape]);

  function clear() {
    particles.current.length = 0;
    if (overlayRef.current) {
      overlayRef.current.getContext("2d").clearRect(0, 0, WCV, HCV);
    }
  }
  function save() {
    const oc = overlayRef.current, wc = webcamRef.current; if (!oc) return;
    const out = document.createElement("canvas");
    out.width = oc.width; out.height = oc.height;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#1d1e22"; ctx.fillRect(0, 0, out.width, out.height);
    if (wc) { ctx.globalAlpha = 0.55; ctx.drawImage(wc, 0, 0); ctx.globalAlpha = 1; }
    ctx.drawImage(oc, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "airdraw-magic.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const hasHands = tracking.framesRef.current.hands.length > 0;

  return (
    <div>
      <Rail active="magic" />
      <div className="page appShell">
        <Toolbar
          mode="magic"
          onMode={(m) => { if (m === "draw") navigate("/draw"); }}
          gesture={tracking.status === "ready" && hasHands ? "magic" : "idle"}
          brushColor="#ece8df" setBrushColor={() => {}}
          brushSize={6}        setBrushSize={() => {}}
          particleColor={particleColor} setParticleColor={setParticleColor}
          particleShape={particleShape} setParticleShape={setParticleShape}
          onUndo={() => {}} onClear={clear} onSave={save}
        />
        <div className="canvasShell">
          <div className="canvasFrame">
            <canvas ref={webcamRef}  className="layer" width={WCV} height={HCV} />
            <canvas ref={overlayRef} className="layer" width={WCV} height={HCV} />
            <span className="corner c1" /><span className="corner c2" />
            <span className="corner c3" /><span className="corner c4" />
            <CameraGate status={tracking.status} onStart={tracking.start} />
            {tracking.status === "ready" && (
              <div className="hint">
                <span className="l">SHOW BOTH HANDS FOR A FULL WEB</span>
                <span className="r">{hasHands ? "✦ CASTING" : "WAITING…"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ root ═════════════════ */
function App() {
  const [route, setRoute] = useState(getRoute());
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const onHash = () => {
      setFading(true);
      setTimeout(() => { setRoute(getRoute()); setFading(false); }, 220);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  let page;
  if (route === "/draw") page = <DrawApp />;
  else if (route === "/magic") page = <MagicApp />;
  else page = <Landing />;
  return <div className={"fader" + (fading ? " fading" : "")}>{page}</div>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
