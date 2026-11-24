import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-400/30 p-5 shadow-2xl max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 id="help-modal-title" className="font-display text-lg font-bold text-white">
            How to Play
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <li className="flex gap-2.5 items-start">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold flex items-center justify-center shrink-0">
              ⌜⌟
            </span>
            <span>
              <strong className="text-white">Rail Optics:</strong> Tiles with green corner brackets can be{' '}
              <strong>dragged</strong> onto any empty cell AND <strong>tapped</strong> to rotate.
            </span>
          </li>
          <li className="flex gap-2.5 items-start">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold flex items-center justify-center shrink-0">
              ➤
            </span>
            <span>
              <strong className="text-white">4-Way Diodes:</strong> Capture any incoming laser and fire it strictly along their arrow. Tap to rotate 90°.
            </span>
          </li>
          <li className="flex gap-2.5 items-start">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold flex items-center justify-center shrink-0">
              ⚿
            </span>
            <span>
              <strong className="text-white">Keys &amp; Gates:</strong> Power a colored Key node to unlock matching Forcefield Gates blocking your path.
            </span>
          </li>
          <li className="flex gap-2.5 items-start">
            <span className="w-7 h-7 rounded-lg bg-slate-100/15 border border-slate-200/50 text-white font-bold flex items-center justify-center shrink-0">
              ⬡
            </span>
            <span>
              <strong className="text-white">Prismatic Combiner:</strong> Feed 2 different laser colors into the octagon to fire a White Superbeam!
            </span>
          </li>
          <li className="flex gap-2.5 items-start">
            <span className="w-7 h-7 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 font-bold flex items-center justify-center shrink-0">
              ◎
            </span>
            <span>
              <strong className="text-white">Splitters, Lenses &amp; Portals:</strong> Split beams 90°, recolor beams, or warp across obsidian walls.
            </span>
          </li>
        </ul>

        <p className="mt-4 text-xs text-slate-400">
          Keyboard: Arrow keys move cursor, Space rotates, WASD slides rail optics, U undo, R reset, H hint.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
