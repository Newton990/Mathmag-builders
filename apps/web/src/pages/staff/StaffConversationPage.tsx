// src/pages/staff/StaffConversationPage.tsx
import { Link } from 'react-router-dom';
import { buttonClass, secondaryButtonClass } from '../../components/ui';

export function StaffConversationPage() {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-600">Conversation view</p>
      <div className="mt-3 flex gap-2">
        <Link to="/staff/inbox" className={secondaryButtonClass}>Back to inbox</Link>
        <Link to="/staff/bookings/confirm" className={buttonClass}>Confirm site visit</Link>
      </div>
    </div>
  );
}

