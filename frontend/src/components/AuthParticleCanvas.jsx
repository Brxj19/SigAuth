import React, { useEffect, useRef } from 'react';

const CONTOUR_GROUPS = [
  { x: 0.08, y: 0.18, rx: 0.1, ry: 0.08, step: 0.025, layers: 13, rotation: 0.2, alpha: 0.09, phase: 0.1, drift: 0.6 },
  { x: 0.84, y: 0.24, rx: 0.12, ry: 0.09, step: 0.028, layers: 14, rotation: -0.28, alpha: 0.08, phase: 1.4, drift: 0.5 },
  { x: 0.14, y: 0.86, rx: 0.15, ry: 0.11, step: 0.03, layers: 12, rotation: 0.42, alpha: 0.075, phase: 2.3, drift: 0.55 },
  { x: 0.72, y: 0.78, rx: 0.13, ry: 0.1, step: 0.027, layers: 12, rotation: -0.18, alpha: 0.07, phase: 3.1, drift: 0.45 },
  { x: 0.48, y: 0.52, rx: 0.08, ry: 0.06, step: 0.018, layers: 8, rotation: 0.08, alpha: 0.05, phase: 4.2, drift: 0.35 },
];

const WASHES = [
  { x: 0.14, y: 0.22, radius: 0.34, alpha: 0.055, phase: 0.3, drift: 0.35 },
  { x: 0.86, y: 0.3, radius: 0.3, alpha: 0.045, phase: 1.7, drift: 0.28 },
  { x: 0.5, y: 0.84, radius: 0.38, alpha: 0.04, phase: 2.4, drift: 0.24 },
];

const POINTS_PER_CONTOUR = 44;

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function traceClosedCurve(ctx, points) {
  if (!points.length) return;
  const start = midpoint(points[points.length - 1], points[0]);
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const mid = midpoint(current, next);
    ctx.quadraticCurveTo(current.x, current.y, mid.x, mid.y);
  }
  ctx.closePath();
}

function drawWashes(ctx, width, height, time) {
  const largestSide = Math.max(width, height);

  WASHES.forEach((wash) => {
    const cx = width * wash.x + Math.sin(time * wash.drift + wash.phase) * width * 0.03;
    const cy = height * wash.y + Math.cos(time * (wash.drift * 0.9) + wash.phase) * height * 0.025;
    const radius = largestSide * wash.radius;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(17, 24, 39, ${wash.alpha})`);
    gradient.addColorStop(0.42, `rgba(17, 24, 39, ${wash.alpha * 0.34})`);
    gradient.addColorStop(1, 'rgba(17, 24, 39, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawContours(ctx, width, height, time) {
  const base = Math.min(width, height);

  CONTOUR_GROUPS.forEach((group) => {
    const driftX = Math.sin(time * group.drift + group.phase) * base * 0.018;
    const driftY = Math.cos(time * (group.drift * 0.85) + group.phase) * base * 0.016;
    const centerX = width * group.x + driftX;
    const centerY = height * group.y + driftY;
    const rotation = group.rotation + Math.sin(time * 0.18 + group.phase) * 0.08;

    for (let layer = 0; layer < group.layers; layer += 1) {
      const layerDepth = layer / Math.max(1, group.layers - 1);
      const radiusX = base * group.rx + layer * base * group.step;
      const radiusY = base * group.ry + layer * base * group.step * 0.76;
      const warp = base * (0.008 + layerDepth * 0.006);
      const points = [];

      for (let i = 0; i < POINTS_PER_CONTOUR; i += 1) {
        const angle = (i / POINTS_PER_CONTOUR) * Math.PI * 2;
        const ripple =
          Math.sin(angle * 2.8 + time * 0.52 + group.phase + layer * 0.12) * 0.58 +
          Math.cos(angle * 5.4 - time * 0.37 + group.phase * 0.8 - layer * 0.09) * 0.32;
        const localX = radiusX + ripple * warp;
        const localY = radiusY + ripple * warp * 0.82;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        points.push({
          x: centerX + cos * localX * Math.cos(rotation) - sin * localY * Math.sin(rotation),
          y: centerY + cos * localX * Math.sin(rotation) + sin * localY * Math.cos(rotation),
        });
      }

      const alpha = group.alpha * (1 - layerDepth * 0.48);
      ctx.beginPath();
      traceClosedCurve(ctx, points);
      ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
      ctx.lineWidth = layer % 4 === 0 ? 1.05 : 0.8;
      ctx.stroke();
    }
  });
}

export default function AuthParticleCanvas() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timestamp = 0) => {
      const { width, height } = sizeRef.current;
      const time = motionQuery.matches ? 0 : timestamp * 0.00012;
      const background = ctx.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, '#ffffff');
      background.addColorStop(1, '#fcfcfc');

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      drawWashes(ctx, width, height, time);
      drawContours(ctx, width, height, time);

      if (!motionQuery.matches) {
        frameRef.current = window.requestAnimationFrame(draw);
      }
    };

    const renderStill = () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      draw(performance.now());
      if (!motionQuery.matches) {
        frameRef.current = window.requestAnimationFrame(draw);
      }
    };

    resize();
    renderStill();

    const handleResize = () => {
      resize();
      renderStill();
    };

    const handleMotionPreference = () => {
      renderStill();
    };

    window.addEventListener('resize', handleResize);
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionPreference);
    } else {
      motionQuery.addListener(handleMotionPreference);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (motionQuery.addEventListener) {
        motionQuery.removeEventListener('change', handleMotionPreference);
      } else {
        motionQuery.removeListener(handleMotionPreference);
      }
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-backdrop-canvas" />
      <div className="ambient-backdrop-noise" />
    </div>
  );
}
