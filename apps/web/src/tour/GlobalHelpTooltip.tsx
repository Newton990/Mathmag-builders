// src/tour/GlobalHelpTooltip.tsx
// Attaches a single delegated event listener to the document.
// When hint mode is ON, hovering any element that has:
//   data-help="Button description"           → shows a tooltip
//   data-help-example="e.g. John Kamau"      → appended to the tooltip
// No per-button changes needed — just add the attributes anywhere in the app.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHintMode } from './HintModeContext';

interface TooltipState {
  text: string;
  example?: string;
  x: number;
  y: number;
  visible: boolean;
}

const OFFSET_Y = 12;
const TOOLTIP_WIDTH = 280;

function closest(el: Element | null, attr: string): Element | null {
  let cur: Element | null = el;
  while (cur) {
    if (cur.hasAttribute(attr)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

export function GlobalHelpTooltip() {
  const { hintMode } = useHintMode();
  const [tip, setTip] = useState<TooltipState>({ text: '', x: 0, y: 0, visible: false });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hintMode) {
      setTip((t) => ({ ...t, visible: false }));
      return;
    }

    function show(e: MouseEvent) {
      const target = e.target as Element | null;
      const el = closest(target, 'data-help');
      if (!el) { hide(); return; }

      const text = el.getAttribute('data-help') ?? '';
      const example = el.getAttribute('data-help-example') ?? undefined;
      if (!text) { hide(); return; }

      if (hideTimer.current) clearTimeout(hideTimer.current);

      // Position tooltip above/below the element
      const rect = el.getBoundingClientRect();
      const x = Math.min(
        Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 8),
        window.innerWidth - TOOLTIP_WIDTH - 8,
      );
      // Prefer below; flip above if not enough room
      const spaceBelow = window.innerHeight - rect.bottom;
      const y = spaceBelow > 110 ? rect.bottom + OFFSET_Y : rect.top - OFFSET_Y;
      const above = spaceBelow <= 110;

      setTip({ text, example, x, y, visible: true, ...({ above } as object) });
    }

    function hide() {
      hideTimer.current = setTimeout(() => {
        setTip((t) => ({ ...t, visible: false }));
      }, 120);
    }

    function onOver(e: MouseEvent) { show(e); }
    function onOut(e: MouseEvent) {
      const related = e.relatedTarget as Element | null;
      if (related && closest(related, 'data-help')) return;
      hide();
    }
    function onFocus(e: FocusEvent) {
      const target = e.target as Element | null;
      const el = closest(target, 'data-help');
      if (el) show({ target: el, clientX: 0, clientY: 0 } as unknown as MouseEvent);
    }

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('focusin', onFocus, true);

    return () => {
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('focusin', onFocus, true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [hintMode]);

  if (!tip.visible) return null;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: tip.y,
        left: tip.x,
        width: TOOLTIP_WIDTH,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="animate-fade-in rounded-xl bg-gray-900 px-3.5 py-3 shadow-xl ring-1 ring-white/10"
    >
      <p className="text-xs font-medium text-white leading-snug">{tip.text}</p>
      {tip.example && (
        <div className="mt-1.5 rounded-lg bg-white/10 px-2 py-1">
          <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Example: </span>
          <span className="text-[11px] font-mono text-green-300">{tip.example}</span>
        </div>
      )}
    </div>,
    document.body,
  );
}
