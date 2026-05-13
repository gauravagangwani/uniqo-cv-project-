// Component intentionally kept thin — the particle engine itself is a hook
// (useParticles) so render-free integration with the RAF loop is possible.
// This file exists only because the spec lists it; importing this file pulls
// in the public API.
export { useParticles } from "../hooks/useParticles";
export {
  spawnFromTip,
  stepParticles,
  renderParticles,
} from "../utils/particles";
export type { Particle, ParticleShape } from "../utils/particles";
