// src/tour/HintModeToggle.tsx
// A toggle button shown in every layout header.
// When Help Mode is ON it's highlighted; hovering explains what it does.
import { useHintMode } from './HintModeContext';

export function HintModeToggle() {
  const { hintMode, toggle } = useHintMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hintMode}
      aria-label={hintMode ? 'Turn off help hints' : 'Turn on help hints'}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
        hintMode
          ? 'bg-amber-400 text-amber-900 border-amber-500 shadow-sm'
          : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
      }`}
    >
      <span>{hintMode ? '💡' : '💡'}</span>
      {hintMode ? 'Help ON' : 'Help'}
    </button>
  );
}
