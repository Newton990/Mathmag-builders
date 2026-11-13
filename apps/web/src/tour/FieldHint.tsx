// src/tour/FieldHint.tsx
// Renders an inline hint below a form field when Help Mode is active.
// Usage:
//   <input ... />
//   <FieldHint text="Client's full legal name" example="John Kamau" />
import { useHintMode } from './HintModeContext';

interface FieldHintProps {
  text: string;
  example?: string;
}

export function FieldHint({ text, example }: FieldHintProps) {
  const { hintMode } = useHintMode();
  if (!hintMode) return null;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
      <span>💡 {text}</span>
      {example && (
        <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 font-mono text-amber-800">
          e.g. {example}
        </span>
      )}
    </p>
  );
}
