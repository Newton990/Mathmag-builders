// src/tour/TourOverlay.tsx
// Renders a spotlight overlay + positioned tooltip for the current tour step.
// Uses a large box-shadow to darken everything outside the highlighted element.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from './TourContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // spotlight padding around the target element

function getRect(selector: string): Rect | null {
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    };
  } catch {
    return null;
  }
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

export function TourOverlay() {
  const { active, stepIndex, steps, next, prev, skip } = useTour();
  const step = steps[stepIndex];
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { w: winW, h: winH } = useWindowSize();

  // Scroll target into view and measure it whenever the step changes.
  useLayoutEffect(() => {
    if (!active || !step) return;

    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Brief delay so scroll settles before measuring.
    const id = setTimeout(() => {
      setRect(getRect(step.target));
    }, 150);
    return () => clearTimeout(id);
  }, [active, step, winW, winH]);

  if (!active || !step) return null;

  // ── Tooltip positioning ──────────────────────────────────────────────────
  const placement = step.placement ?? 'bottom';
  const tooltipStyle: React.CSSProperties = { position: 'fixed', zIndex: 10001 };

  if (rect) {
    const TW = 320; // tooltip width
    const margin = 16;

    if (placement === 'right') {
      tooltipStyle.left = Math.min(rect.left + rect.width + margin, winW - TW - margin);
      tooltipStyle.top = rect.top + rect.height / 2 - 80;
    } else if (placement === 'left') {
      tooltipStyle.left = Math.max(rect.left - TW - margin, margin);
      tooltipStyle.top = rect.top + rect.height / 2 - 80;
    } else if (placement === 'top') {
      tooltipStyle.left = Math.min(
        Math.max(rect.left + rect.width / 2 - TW / 2, margin),
        winW - TW - margin,
      );
      tooltipStyle.bottom = winH - rect.top + margin;
    } else {
      // bottom (default)
      tooltipStyle.left = Math.min(
        Math.max(rect.left + rect.width / 2 - TW / 2, margin),
        winW - TW - margin,
      );
      tooltipStyle.top = rect.top + rect.height + margin;
    }
  } else {
    // No target found — centre the tooltip.
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return createPortal(
    <>
      {/* ── Dark overlay with spotlight cutout ───────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          boxShadow: rect
            ? `0 0 0 9999px rgba(0,0,0,0.55),
               inset 0 0 0 0 transparent`
            : '0 0 0 9999px rgba(0,0,0,0.55)',
        }}
      />

      {/* Spotlight highlight box */}
      {rect && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            zIndex: 10000,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            outline: '3px solid rgba(255,255,255,0.6)',
          }}
        />
      )}

      {/* ── Tooltip card ─────────────────────────────────────────────────── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label={`Tour step ${stepIndex + 1} of ${steps.length}: ${step.title}`}
        style={{ ...tooltipStyle, width: 320 }}
        className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-brand-600 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Step counter */}
          <p className="mb-1 text-xs font-medium text-brand-500 uppercase tracking-wider">
            Step {stepIndex + 1} of {steps.length}
          </p>

          {/* Title */}
          <h2 className="text-base font-bold text-gray-900 mb-2">{step.title}</h2>

          {/* Body */}
          <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-2">
            {/* Skip / restart */}
            <button
              type="button"
              onClick={skip}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {isLast ? '🎉 Done!' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── "Restart tour" button (shown after tour completes) ─────────────── */}
    </>,
    document.body,
  );
}

/** Small floating button to re-launch the tour at any time */
export function RestartTourButton() {
  const { active, restart } = useTour();
  if (active) return null;
  return (
    <button
      type="button"
      onClick={restart}
      title="Restart guided tour"
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors"
      aria-label="Restart guided tour"
    >
      ?
    </button>
  );
}
