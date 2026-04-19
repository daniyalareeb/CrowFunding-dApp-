"use client";

import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────
   Design-system colours  (violet / indigo / emerald)
   Weighted so violet/indigo appear ~2× more than emerald
   ───────────────────────────────────────────────────── */
const PALETTE = [
  { r: 139, g: 92,  b: 246 }, // neon-violet
  { r: 99,  g: 102, b: 241 }, // neon-indigo
  { r: 139, g: 92,  b: 246 }, // violet  (weight ×2)
  { r: 99,  g: 102, b: 241 }, // indigo  (weight ×2)
  { r: 16,  g: 185, b: 129 }, // neon-emerald
  { r: 6,   g: 182, b: 212 }, // neon-cyan
];

const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

/* ─────────────────────────────────────────────────────
   Particle class
   ───────────────────────────────────────────────────── */
class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.init(true);
  }

  init(scatter = false) {
    const c = this.canvas;
    this.x  = scatter ? Math.random() * c.width  : Math.random() * c.width;
    this.y  = scatter ? Math.random() * c.height : Math.random() * c.height;
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;

    this.color    = randomColor();
    this.isHub    = Math.random() < 0.14;            // ~14% are "hub" nodes
    this.baseR    = this.isHub
      ? Math.random() * 1.8 + 2.5                   // hub: 2.5–4.3 px
      : Math.random() * 1.2 + 1.0;                  // node: 1.0–2.2 px
    this.r        = this.baseR;
    this.baseA    = this.isHub
      ? Math.random() * 0.25 + 0.75                 // hub: 0.75–1.0
      : Math.random() * 0.35 + 0.30;                // node: 0.30–0.65
    this.alpha    = this.baseA;
    this.pSpeed   = Math.random() * 0.018 + 0.008;  // pulse speed
    this.pOffset  = Math.random() * Math.PI * 2;    // pulse phase
  }

  update(tick, mouse) {
    // ── Pulse ──────────────────────────────────────
    const p = Math.sin(tick * this.pSpeed + this.pOffset);
    this.r     = this.baseR + p * (this.isHub ? 0.9 : 0.35);
    this.alpha = this.baseA + p * 0.08;

    // ── Mouse interaction ───────────────────────────
    if (mouse.x !== null) {
      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 170 && dist > 0) {
        const f = (170 - dist) / 170;
        if (dist < 45) {
          // Soft repel when cursor is almost on top
          this.vx -= (dx / dist) * f * 0.18;
          this.vy -= (dy / dist) * f * 0.18;
        } else {
          // Gentle attract
          this.vx += (dx / dist) * f * 0.05;
          this.vy += (dy / dist) * f * 0.05;
        }
      }
    }

    // ── Speed cap ───────────────────────────────────
    const spd    = Math.sqrt(this.vx ** 2 + this.vy ** 2);
    const maxSpd = this.isHub ? 1.1 : 1.7;
    if (spd > maxSpd) {
      this.vx = (this.vx / spd) * maxSpd;
      this.vy = (this.vy / spd) * maxSpd;
    }

    // Natural drag
    this.vx *= 0.992;
    this.vy *= 0.992;

    this.x += this.vx;
    this.y += this.vy;

    // ── Wrap edges (seamless) ───────────────────────
    const pad = 12;
    if (this.x < -pad)                  this.x = this.canvas.width  + pad;
    if (this.x > this.canvas.width + pad)  this.x = -pad;
    if (this.y < -pad)                  this.y = this.canvas.height + pad;
    if (this.y > this.canvas.height + pad) this.y = -pad;
  }

  draw(ctx) {
    const { r, g, b } = this.color;

    // ── Hub outer glow ─────────────────────────────
    if (this.isHub) {
      const gr = this.r * 5;
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, gr);
      grd.addColorStop(0, `rgba(${r},${g},${b},${(this.alpha * 0.45).toFixed(2)})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, gr, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // ── Inner glow ring ────────────────────────────
    const ig = this.r * 2.2;
    const igd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, ig);
    igd.addColorStop(0, `rgba(${r},${g},${b},${(this.alpha * 0.30).toFixed(2)})`);
    igd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, ig, 0, Math.PI * 2);
    ctx.fillStyle = igd;
    ctx.fill();

    // ── Solid core ────────────────────────────────
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha.toFixed(2)})`;
    ctx.fill();
  }
}

/* ─────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ particles: [], mouse: { x: null, y: null }, animId: null, tick: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    const state = stateRef.current;

    /* ── Resize + (re)init particles ── */
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.min(
        Math.floor((canvas.width * canvas.height) / 8500),
        100
      );
      state.particles = Array.from({ length: count }, () => new Particle(canvas));
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── Connection lines ── */
    const CONNECT = 135;

    const drawLines = () => {
      const pts = state.particles;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx   = pts[i].x - pts[j].x;
          const dy   = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= CONNECT) continue;

          const t  = 1 - dist / CONNECT;
          // Lines are more opaque between hubs
          const a  = t * (pts[i].isHub || pts[j].isHub ? 0.50 : 0.28);

          const ci = pts[i].color;
          const cj = pts[j].color;

          // Gradient line — looks beautiful for the demo
          const grad = ctx.createLinearGradient(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
          grad.addColorStop(0, `rgba(${ci.r},${ci.g},${ci.b},${a.toFixed(2)})`);
          grad.addColorStop(1, `rgba(${cj.r},${cj.g},${cj.b},${a.toFixed(2)})`);

          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = pts[i].isHub || pts[j].isHub ? 1.1 : 0.65;
          ctx.stroke();
        }
      }
    };

    /* ── Animation loop ── */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.tick++;
      state.particles.forEach(p => p.update(state.tick, state.mouse));
      drawLines();
      state.particles.forEach(p => p.draw(ctx));
      state.animId = requestAnimationFrame(animate);
    };
    animate();

    /* ── Mouse tracking ── */
    const onMove  = (e) => {
      const rect    = canvas.getBoundingClientRect();
      state.mouse.x = e.clientX - rect.left;
      state.mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { state.mouse.x = null; state.mouse.y = null; };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(state.animId);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.65 }}
    />
  );
};

export default ParticleCanvas;
