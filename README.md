# AIRDRAW

A dual-mode webcam hand-tracking experience: paint in the air with **DRAW**, or summon particle effects from your fingertips with **MAGIC**. Built with Vite + React + TypeScript and [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html).

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>. Allow the page to access your camera when prompted.

`npm run build` produces a static bundle in `dist/`.

## What it is

Two modes share one canvas stack (`webcam` + `draw` + `overlay` layers):

| Mode  | Route   | What it does                                                         |
| ----- | ------- | -------------------------------------------------------------------- |
| DRAW  | `#/draw`  | Use gestures to paint persistent strokes onto a transparent canvas. |
| MAGIC | `#/magic` | Particles spawn from each fingertip in real time.                   |

You can switch modes mid-session from the toolbar tabs — instant, no animation.

## Gesture guide (DRAW mode)

| Gesture                                                         | Meaning |
| --------------------------------------------------------------- | ------- |
| Index finger extended, middle + ring folded                     | DRAW    |
| All four fingers extended (open palm)                           | ERASE   |
| Pinch (thumb tip touches index tip)                             | PAN     |
| Anything else                                                   | IDLE    |

In MAGIC mode every fingertip on every detected hand emits particles whenever it's visible — no specific pose needed.

## Toolbar

- **Tabs**: DRAW / MAGIC — instant mode switch.
- **DRAW center**: brush size slider + 5 colour swatches.
- **MAGIC center**: shape selector (★ stars / • dots / ✦ sparkle) + 5 colour swatches.
- **Right**: gesture badge, undo (DRAW only), clear, save PNG.

## Browser notes

- **Chrome / Edge / Firefox**: works out of the box on desktop.
- **Safari**: `getUserMedia` requires HTTPS and a user gesture. The video element uses `playsinline`/`muted` to satisfy iOS autoplay rules. If autoplay still fails, tap anywhere on the page once after loading.
- **HTTPS required** for camera access on any non-localhost host. `vite preview` won't get you a cert — deploy to Vercel/Netlify/Cloudflare or run behind your own TLS for production.
- Hand tracking is CPU/WASM-heavy; expect ~30 fps on a recent laptop and lower on older mobile.

## Architecture

```
src/
  pages/        Landing, DrawApp, MagicApp
  components/   Toolbar, Canvas, GestureBadge, ModeSwitcher,
                ParticleEngine, ColorPicker, BrushControls
  hooks/        useHandTracking, useDrawing, useParticles
  utils/        gestures, particles, canvas
  styles/       global.css + CSS modules
  router.tsx    hash router: '/', '/draw', '/magic'
```

- **No npm dep on MediaPipe.** It's loaded from `cdn.jsdelivr.net` via a `<script>` tag in `index.html` to avoid WASM bundling headaches.
- **Particles live in a ref, not React state** — the RAF loop mutates the array directly and renders imperatively to the overlay canvas. Zero React re-renders in the hot path.
- The `draw` canvas is never cleared except on explicit undo or clear.

## License

MIT — built on top of MediaPipe Hands (Apache 2.0).
