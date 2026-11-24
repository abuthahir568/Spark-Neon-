import { BoardEngineState } from '../types/game';
import { COLORS } from './levels';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawCornerRails(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cell: number,
  isDragging: boolean
): void {
  const half = cell * 0.41;
  const arm = cell * 0.14;
  ctx.save();
  ctx.strokeStyle = isDragging ? '#34d399' : 'rgba(52, 211, 153, 0.72)';
  ctx.lineWidth = isDragging ? 2.5 : 1.8;
  ctx.lineCap = 'round';
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [sx, sy] of corners) {
    const x = cx + sx * half;
    const y = cy + sy * half;
    ctx.beginPath();
    ctx.moveTo(x - sx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - sy * arm);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  boardPx: number,
  engine: BoardEngineState,
  animTime: number,
  dt: number
): void {
  const pad = 12;
  const inner = boardPx - pad * 2;
  const cell = inner / engine.size;
  const dtScale = dt * 60;

  ctx.fillStyle = '#090f22';
  ctx.fillRect(0, 0, boardPx, boardPx);

  // Grid cells
  for (let r = 0; r < engine.size; r++) {
    for (let c = 0; c < engine.size; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;
      drawRoundedRect(ctx, x + 2, y + 2, cell - 4, cell - 4, 8);
      ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(30, 41, 59, 0.42)' : 'rgba(15, 23, 42, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Drag hover target highlight
  if (engine.dragSource) {
    const { hoverR, hoverC, r: srcR, c: srcC } = engine.dragSource;
    if (
      hoverR >= 0 &&
      hoverR < engine.size &&
      hoverC >= 0 &&
      hoverC < engine.size &&
      (hoverR !== srcR || hoverC !== srcC) &&
      !engine.grid[hoverR]?.[hoverC]
    ) {
      const hx = pad + hoverC * cell;
      const hy = pad + hoverR * cell;
      drawRoundedRect(ctx, hx + 4, hy + 4, cell - 8, cell - 8, 8);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Keyboard focus cursor
  if (engine.cursor) {
    const cx = pad + engine.cursor.c * cell;
    const cy = pad + engine.cursor.r * cell;
    drawRoundedRect(ctx, cx + 3, cy + 3, cell - 6, cell - 6, 8);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Hint highlight (and slide arrow if movable)
  if (engine.hintTile) {
    const hx = pad + (engine.hintTile.c + 0.5) * cell;
    const hy = pad + (engine.hintTile.r + 0.5) * cell;
    const pulse = 0.5 + 0.5 * Math.sin(animTime * 7);
    ctx.beginPath();
    ctx.arc(hx, hy, cell * (0.39 + pulse * 0.08), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.45 + pulse * 0.55})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (engine.hintTile.targetR !== undefined && engine.hintTile.targetC !== undefined) {
      const tx = pad + (engine.hintTile.targetC + 0.5) * cell;
      const ty = pad + (engine.hintTile.targetR + 0.5) * cell;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -animTime * 24;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(tx, ty, cell * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  // Laser Beams
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < engine.beams.length; i++) {
    const b = engine.beams[i];
    const x1 = pad + (b.c1 + 0.5) * cell;
    const y1 = pad + (b.r1 + 0.5) * cell;
    const x2 = pad + (b.c2 + 0.5) * cell;
    const y2 = pad + (b.r2 + 0.5) * cell;
    const col = COLORS[b.color] || COLORS.cyan;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.glow;
    ctx.lineWidth = Math.max(8, cell * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.main;
    ctx.lineWidth = Math.max(3.2, cell * 0.08);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.4, cell * 0.032);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([4, 14]);
    ctx.lineDashOffset = -animTime * 48;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.soft;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Tiles
  const posLerp = Math.min(1, 0.3 * dtScale);
  for (let r = 0; r < engine.size; r++) {
    for (let c = 0; c < engine.size; c++) {
      const tile = engine.grid[r]?.[c];
      if (!tile) continue;

      tile.visualR += (tile.r - tile.visualR) * posLerp;
      tile.visualC += (tile.c - tile.visualC) * posLerp;

      const cx = pad + (tile.visualC + 0.5) * cell;
      const cy = pad + (tile.visualR + 0.5) * cell;
      const isDragging =
        engine.dragSource !== null && engine.dragSource.r === r && engine.dragSource.c === c;

      if (tile.movable) {
        drawCornerRails(ctx, cx, cy, cell, isDragging);
      }

      if (tile.type === 'W') {
        const s = cell * 0.78;
        drawRoundedRect(ctx, cx - s / 2, cy - s / 2, s, s, 8);
        const g = ctx.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
        g.addColorStop(0, '#334155');
        g.addColorStop(1, '#0f172a');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - s * 0.22, cy - s * 0.22);
        ctx.lineTo(cx + s * 0.22, cy + s * 0.22);
        ctx.moveTo(cx + s * 0.22, cy - s * 0.22);
        ctx.lineTo(cx - s * 0.22, cy + s * 0.22);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (tile.type === 'E') {
        const col = COLORS[tile.color ?? 'cyan'];
        ctx.save();
        ctx.translate(cx, cy);
        const rotMap = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        ctx.rotate(rotMap[tile.dir]);

        drawRoundedRect(ctx, -cell * 0.34, -cell * 0.3, cell * 0.62, cell * 0.6, 8);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = col.main;
        ctx.beginPath();
        ctx.moveTo(cell * 0.26, -cell * 0.14);
        ctx.lineTo(cell * 0.42, 0);
        ctx.lineTo(cell * 0.26, cell * 0.14);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-cell * 0.04, 0, cell * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = col.main;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      } else if (tile.type === 'T') {
        const col = COLORS[tile.color ?? 'cyan'];
        const isLit = engine.litTargets.has(`${r},${c}`);
        const pulse = isLit ? 1 + 0.08 * Math.sin(animTime * 6) : 1;
        const rad = cell * 0.28 * pulse;

        ctx.save();
        ctx.translate(cx, cy);
        if (isLit) {
          ctx.shadowColor = col.main;
          ctx.shadowBlur = 18;
        }
        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.lineTo(rad * 0.85, 0);
        ctx.lineTo(0, rad);
        ctx.lineTo(-rad * 0.85, 0);
        ctx.closePath();
        ctx.fillStyle = isLit ? col.main : 'rgba(15, 23, 42, 0.85)';
        ctx.fill();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = isLit ? 2.5 : 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -rad * 0.45);
        ctx.lineTo(rad * 0.38, 0);
        ctx.lineTo(0, rad * 0.45);
        ctx.lineTo(-rad * 0.38, 0);
        ctx.closePath();
        ctx.fillStyle = isLit ? '#ffffff' : col.glow;
        ctx.fill();
        ctx.restore();
      } else if (tile.type === 'M' || tile.type === 'S') {
        const lerpAlpha = Math.min(1, 0.24 * dtScale);
        tile.visualAngle += (tile.targetAngle - tile.visualAngle) * lerpAlpha;
        const isSplitter = tile.type === 'S';

        ctx.save();
        ctx.translate(cx, cy);

        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.34, 0, Math.PI * 2);
        ctx.fillStyle = isSplitter ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.10)';
        ctx.fill();
        ctx.strokeStyle = isSplitter ? 'rgba(251, 191, 36, 0.38)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.rotate(-Math.PI / 4 + tile.visualAngle);

        const len = cell * 0.6;
        const thick = isSplitter ? Math.max(5, cell * 0.11) : Math.max(6, cell * 0.13);

        if (isSplitter) {
          drawRoundedRect(ctx, -len / 2, -thick / 2, len, thick, thick / 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();

          const d = cell * 0.11;
          ctx.beginPath();
          ctx.moveTo(0, -d);
          ctx.lineTo(d, 0);
          ctx.lineTo(0, d);
          ctx.lineTo(-d, 0);
          ctx.closePath();
          ctx.fillStyle = '#fef3c7';
          ctx.fill();
        } else {
          drawRoundedRect(ctx, -len / 2, -thick / 2, len, thick, thick / 2);
          const grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(0.5, '#e0f2fe');
          grad.addColorStop(1, '#38bdf8');
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.shadowBlur = 0;
          drawRoundedRect(ctx, -len * 0.38, -thick * 0.18, len * 0.76, thick * 0.36, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        ctx.restore();
      } else if (tile.type === 'D') {
        // 4-Way Optical Diode
        const lerpAlpha = Math.min(1, 0.26 * dtScale);
        tile.visualAngle += (tile.targetAngle - tile.visualAngle) * lerpAlpha;

        ctx.save();
        ctx.translate(cx, cy);

        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.33, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // visualAngle tracks (dir - 1) * PI/2 so angle 0 = Right
        ctx.rotate(tile.visualAngle);

        ctx.beginPath();
        ctx.moveTo(-cell * 0.15, -cell * 0.14);
        ctx.lineTo(cell * 0.21, 0);
        ctx.lineTo(-cell * 0.15, cell * 0.14);
        ctx.lineTo(-cell * 0.06, 0);
        ctx.closePath();
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      } else if (tile.type === 'K') {
        // Energy Key Node
        const col = COLORS[tile.color ?? 'cyan'];
        const active = engine.activeKeys.has(`${r},${c}`);
        ctx.save();
        ctx.translate(cx, cy);
        if (active) {
          ctx.shadowColor = col.main;
          ctx.shadowBlur = 14;
        }
        const s = cell * 0.26;
        drawRoundedRect(ctx, -s, -s, s * 2, s * 2, 6);
        ctx.fillStyle = active ? col.main : 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Keyhole glyph
        ctx.beginPath();
        ctx.arc(0, -cell * 0.03, cell * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = active ? '#090f22' : col.main;
        ctx.fill();
        ctx.fillRect(-cell * 0.03, 0, cell * 0.06, cell * 0.11);
        ctx.restore();
      } else if (tile.type === 'G') {
        // Forcefield Gate
        const gateColor = tile.color ?? 'cyan';
        const col = COLORS[gateColor];
        const isOpen = engine.openGateColors.has(gateColor);

        ctx.save();
        ctx.translate(cx, cy);
        const s = cell * 0.36;
        if (isOpen) {
          ctx.setLineDash([4, 4]);
          drawRoundedRect(ctx, -s, -s, s * 2, s * 2, 6);
          ctx.strokeStyle = col.glow;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          drawRoundedRect(ctx, -s, -s, s * 2, s * 2, 6);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fill();
          ctx.strokeStyle = col.main;
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Energy barrier bars
          ctx.beginPath();
          ctx.moveTo(-s * 0.55, -s * 0.55);
          ctx.lineTo(s * 0.55, s * 0.55);
          ctx.moveTo(s * 0.55, -s * 0.55);
          ctx.lineTo(-s * 0.55, s * 0.55);
          ctx.strokeStyle = col.main;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      } else if (tile.type === 'X') {
        // Prismatic Combiner Chamber
        const fedColors = Array.from(engine.combinerColors[`${r},${c}`] || []);
        const charged = fedColors.length >= 2;
        const rotMap = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotMap[tile.dir]);

        if (charged) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 16;
        }
        const rad = cell * 0.34;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = charged ? 'rgba(248, 250, 252, 0.22)' : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = charged ? '#ffffff' : '#94a3b8';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Output arrow
        ctx.beginPath();
        ctx.moveTo(rad * 0.72, -cell * 0.1);
        ctx.lineTo(rad * 1.15, 0);
        ctx.lineTo(rad * 0.72, cell * 0.1);
        ctx.closePath();
        ctx.fillStyle = charged ? '#ffffff' : '#94a3b8';
        ctx.fill();
        ctx.restore();

        // Draw 2 color charge pips unrotated
        for (let i = 0; i < 2; i++) {
          const pipColor = fedColors[i] ? COLORS[fedColors[i]].main : 'rgba(100, 116, 139, 0.45)';
          const px = cx + (i === 0 ? -cell * 0.1 : cell * 0.1);
          ctx.beginPath();
          ctx.arc(px, cy, cell * 0.065, 0, Math.PI * 2);
          ctx.fillStyle = pipColor;
          ctx.fill();
        }
      } else if (tile.type === 'P') {
        const spin = animTime * 2.2;
        ctx.save();
        ctx.translate(cx, cy);

        ctx.save();
        ctx.rotate(spin);
        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.32, 0, Math.PI * 2);
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.21, 0, Math.PI * 2);
        const pg = ctx.createRadialGradient(0, 0, 2, 0, 0, cell * 0.22);
        pg.addColorStop(0, '#fdf4ff');
        pg.addColorStop(0.5, '#d946ef');
        pg.addColorStop(1, 'rgba(88, 28, 135, 0.25)');
        ctx.fillStyle = pg;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.restore();
      } else if (tile.type === 'F') {
        const col = COLORS[tile.color ?? 'cyan'];
        ctx.save();
        ctx.translate(cx, cy);

        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.29, 0, Math.PI * 2);
        ctx.fillStyle = col.glow;
        ctx.fill();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.14, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Particles
  for (let i = engine.particles.length - 1; i >= 0; i--) {
    const p = engine.particles[i];
    p.r += p.vr * dtScale;
    p.c += p.vc * dtScale;
    p.life -= p.decay * dtScale;
    if (p.life <= 0) {
      engine.particles.splice(i, 1);
      continue;
    }
    const px = pad + p.c * cell;
    const py = pad + p.r * cell;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderTitleBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  animTime: number
): void {
  ctx.clearRect(0, 0, w, h);

  const step = 48;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;
  for (let x = (w % step) / 2; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = (h % step) / 2; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const cx = w * 0.5;
  const cy = h * 0.34;
  const sway = Math.sin(animTime * 0.85) * 20;

  const drawBeam = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    col: { main: string; glow: string; soft: string }
  ) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.glow;
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.main;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.setLineDash([6, 18]);
    ctx.lineDashOffset = -animTime * 54;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.soft;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  };

  // Dual input beams fusing into a Prismatic White beam!
  drawBeam(0, cy - h * 0.14 + sway, cx, cy, COLORS.cyan);
  drawBeam(0, cy + h * 0.14 - sway, cx, cy, COLORS.magenta);
  drawBeam(cx, cy, w, cy, COLORS.white);

  const rad = Math.min(w, h) * 0.085;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(animTime * 0.25);
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}
