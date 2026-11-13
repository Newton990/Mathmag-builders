// src/tour/HintModeContext.tsx
// Manages the global "Help Mode" toggle.
// When active, hovering any element with data-help="…" shows a tooltip,
// and inputs with data-help-example="…" display inline example hints.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface HintModeContextValue {
  hintMode: boolean;
  toggle: () => void;
  disable: () => void;
}

const HintModeContext = createContext<HintModeContextValue | null>(null);

const STORAGE_KEY = 'mbms.hintMode';

export function HintModeProvider({ children }: { children: ReactNode }) {
  // New users start with hints ON; returning users keep their last choice.
  const [hintMode, setHintMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // If never set before → first-time user → hints ON
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setHintMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const disable = useCallback(() => {
    setHintMode(false);
    try { localStorage.setItem(STORAGE_KEY, 'false'); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ hintMode, toggle, disable }), [hintMode, toggle, disable]);
  return <HintModeContext.Provider value={value}>{children}</HintModeContext.Provider>;
}

export function useHintMode(): HintModeContextValue {
  const ctx = useContext(HintModeContext);
  if (!ctx) throw new Error('useHintMode must be used inside HintModeProvider');
  return ctx;
}
