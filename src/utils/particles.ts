export type ParticleShape = "star" | "dot" | "sparkle";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  born: number;
  shape: ParticleShape;
}

const GRAVITY = 0.06;
const MAX_PARTICLES = 800;

export function spawnFromTip(
  arr: Particle[],
  x: number,
  y: number,
  color: string,
  shape: ParticleShape,
  now: number,
): void {
  const count = 2 + Math.floor(Math.random() * 2); // 2–3
  for (let i = 0; i < count; i++) {
    arr.push({
      x,
      y,
      vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2.5),
      vy: -(1.5 + Math.random() * 3),
      size: 3 + Math.random() * 6,
      color,
      alpha: 1,
      lifetime: 600 + Math.random() * 400,
      born: now,
      shape,
    });
  }
  if (arr.length > MAX_PARTICLES) {
    arr.splice(0, arr.length - MAX_PARTICLES);
  }
}

export function stepParticles(arr: Particle[], now: number): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += GRAVITY;
    const elapsed = now - p.born;
    p.alpha = Math.max(0, 1 - elapsed / p.lifetime);
    if (p.alpha <= 0) {
      arr.splice(i, 1);
    }
  }
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  arr: Particle[],
): void {
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    if (p.shape === "star") drawStar(ctx, p);
    else if (p.shape === "dot") drawDot(ctx, p);
    else drawSparkle(ctx, p);
  }
}

function drawStar(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.born * 0.003);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ox = Math.cos(outerA) * p.size;
    const oy = Math.sin(outerA) * p.size;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    const innerA = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    const ix = Math.cos(innerA) * p.size * 0.4;
    const iy = Math.sin(innerA) * p.size * 0.4;
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.born * 0.004);
  ctx.globalAlpha = p.alpha;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  const r = p.size;
  ctx.beginPath();
  ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
  ctx.moveTo(0, -r); ctx.lineTo(0, r);
  ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, r * 0.6);
  ctx.moveTo(-r * 0.6, r * 0.6); ctx.lineTo(r * 0.6, -r * 0.6);
  ctx.stroke();
  ctx.restore();
}
