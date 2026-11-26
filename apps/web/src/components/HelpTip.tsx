// src/components/HelpTip.tsx
// Contextual "?" help trigger that opens the User Guide to a specific section.
// Usage: <HelpTip sectionId="bookings-create" label="Create booking help" />
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonClass, secondaryButtonClass } from './ui';

interface HelpTipProps {
  sectionId: string;
  label?: string;
  className?: string;
}

export function HelpTip({ sectionId, label = 'How this works', className }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          navigate(`/staff/guide#${sectionId}`);
          setOpen(false);
        }}
        className={secondaryButtonClass + ' flex-1 sm:flex-1'}
        title={label}
        aria-label={label}
      >
        ?
      </button>
      {/* Dialog rendered inline to keep it simple */}
      {open && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="rounded-2xl bg-white shadow-2xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Help</h3>
            <p className="text-sm text-gray-600 mb-4">This help topic is coming soon. In the meantime, use the Help button in the header to browse the full User Guide.</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
