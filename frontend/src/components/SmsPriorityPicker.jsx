import React from 'react';

/**
 * SMS priority is chosen by the STUDENT, never by the organiser.
 * tier value: 0 none, 1 low, 2 medium, 3 high.
 */
export const SMS_TIERS = [
  { value: 0, label: 'None', short: 'None', description: 'In-app notifications only. No SMS.' },
  { value: 1, label: 'Low', short: 'Low', description: 'SMS for urgent changes only (cancellation, venue or time change).' },
  { value: 2, label: 'Medium', short: 'Medium', description: 'Urgent changes plus event reminders.' },
  { value: 3, label: 'High', short: 'High', description: 'Urgent changes, reminders and general announcements.' }
];

export const smsTierLabel = (v) => (SMS_TIERS.find((t) => t.value === Number(v)) || SMS_TIERS[2]).label;

export default function SmsPriorityPicker({ value, onChange, disabled = false, compact = false }) {
  const current = SMS_TIERS.find((t) => t.value === Number(value)) || SMS_TIERS[2];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="SMS priority">
        {SMS_TIERS.map((t) => {
          const active = t.value === current.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(t.value)}
              className={`py-2 rounded-xl border text-[11px] font-extrabold transition-colors disabled:opacity-50 ${
                active
                  ? 'bg-[#003366] border-[#003366] text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.short}
            </button>
          );
        })}
      </div>
      {!compact && <p className="text-[11px] text-slate-500">{current.description}</p>}
    </div>
  );
}
