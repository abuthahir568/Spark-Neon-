import React, { useEffect, useRef } from 'react';
import { BoardEngineState } from '../types/game';
import { renderBoard } from '../game/renderer';

interface GameBoardProps {
  engineRef: React.MutableRefObject<BoardEngineState>;
  onTapCell: (r: number, c: number) => void;
  onSlideTile: (fromR: number, fromC: number, toR: number, toC: number) => void;
  toastMessage: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  engineRef,
  onTapCell,
  onSlideTile,
  toastMessage,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardPxRef = useRef<number>(360);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    srcR: number;
    srcC: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const px = Math.max(240, Math.floor(Math.min(rect.width, rect.height || rect.width)));
      boardPxRef.current = px;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(px * dpr);
      canvas.height = Math.floor(px * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(wrap);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (ts: number) => {
      const rawDt = (ts - lastTime) * 0.001;
      lastTime = ts;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      renderBoard(ctx, boardPxRef.current, engineRef.current, ts * 0.001, dt);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [engineRef]);

  const getCellFromClient = (clientX: number, clientY: number): { r: number; c: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { r: -1, c: -1 };
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pad = 12;
    const inner = boardPxRef.current - pad * 2;
    const size = engineRef.current.size;
    const cell = inner / size;
    return {
      r: Math.floor((y - pad) / cell),
      c: Math.floor((x - pad) / cell),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { r, c } = getCellFromClient(e.clientX, e.clientY);
    const size = engineRef.current.size;
    if (r < 0 || r >= size || c < 0 || c >= size) return;

    const tile = engineRef.current.grid[r]?.[c];
    if (tile && tile.movable) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        srcR: r,
        srcC: c,
        moved: false,
      };
      engineRef.current.dragSource = { r, c, hoverR: r, hoverC: c };
    } else {
      onTapCell(r, c);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const { r, c } = getCellFromClient(e.clientX, e.clientY);
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (dist > 10 || r !== drag.srcR || c !== drag.srcC) {
      drag.moved = true;
    }
    engineRef.current.dragSource = {
      r: drag.srcR,
      c: drag.srcC,
      hoverR: r,
      hoverC: c,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const { r, c } = getCellFromClient(e.clientX, e.clientY);
    dragRef.current = null;
    engineRef.current.dragSource = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!drag.moved || (r === drag.srcR && c === drag.srcC)) {
      onTapCell(drag.srcR, drag.srcC);
    } else {
      onSlideTile(drag.srcR, drag.srcC, r, c);
    }
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
    engineRef.current.dragSource = null;
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-[min(480px,calc(100dvh-230px))] aspect-square mx-auto flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label="Spark optical laser puzzle grid"
        className="w-full h-full block rounded-[18px] shadow-[0_0_32px_rgba(0,240,255,0.12)] cursor-pointer touch-none"
      />
      {toastMessage && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-400/35 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-200 whitespace-nowrap shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
