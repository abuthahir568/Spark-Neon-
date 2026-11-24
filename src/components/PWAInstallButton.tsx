import React, { useState } from 'react';
import { Download, Share, Smartphone, Check, Copy, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'primary' }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) return;
      return;
    }
    setShowGuide(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard permission denied
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Install Prism Spark on mobile"
        className={
          variant === 'compact'
            ? 'min-h-[44px] px-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 active:scale-95 transition-transform duration-150 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer'
            : 'min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/45 text-cyan-200 hover:bg-slate-800 active:scale-95 transition-transform duration-150 flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download className="w-4 h-4 text-cyan-300 shrink-0" />
        <span>{isInstallable ? 'Install App' : 'Mobile Install'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-400/35 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-300" />
                <h2 id="install-guide-title" className="font-display text-lg font-bold text-white">
                  Install on Mobile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="mb-3 rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 text-xs text-amber-200 leading-relaxed">
                Preview frames block browser install prompts. Open the app URL directly in your mobile browser to install to your home screen.
              </div>
            )}

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Open this page in <strong>Safari</strong> and tap the{' '}
                    <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold">
                      Share <Share className="w-3.5 h-3.5" />
                    </span>{' '}
                    button.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="rounded-xl bg-slate-800/70 border border-slate-700/70 p-3">
                  <div className="font-semibold text-white mb-1">Android (Chrome / Edge)</div>
                  <p>
                    Open in Chrome, tap the menu button (<strong>⋮</strong>) in the top right, then tap{' '}
                    <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/70 border border-slate-700/70 p-3">
                  <div className="font-semibold text-white mb-1">iPhone / iPad (Safari)</div>
                  <p>
                    Open in Safari, tap <strong>Share</strong>, then choose{' '}
                    <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-300" />}
                <span>{copied ? 'Link Copied' : 'Copy App Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
