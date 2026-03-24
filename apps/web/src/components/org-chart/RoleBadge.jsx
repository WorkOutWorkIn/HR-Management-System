const TONE_STYLES = {
  ADMIN: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  MANAGER: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200',
  EMPLOYEE: 'border-slate-700 bg-slate-900/70 text-slate-300',
  ACTIVE: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  LOCKED: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
  DISABLED: 'border-slate-700 bg-slate-900/70 text-slate-400',
  PENDING_FIRST_LOGIN: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
};

export function RoleBadge({ label, tone }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]',
        TONE_STYLES[tone] || TONE_STYLES.EMPLOYEE,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
