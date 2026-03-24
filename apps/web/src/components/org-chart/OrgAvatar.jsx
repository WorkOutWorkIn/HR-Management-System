const SIZE_STYLES = {
  sm: 'h-11 w-11 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
};

const ACCENT_STYLES = {
  cyan: 'from-cyan-400/35 via-sky-500/25 to-slate-900',
  amber: 'from-amber-400/35 via-orange-500/20 to-slate-900',
  emerald: 'from-emerald-400/35 via-teal-500/20 to-slate-900',
  violet: 'from-violet-400/35 via-indigo-500/20 to-slate-900',
};

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function OrgAvatar({ name, size = 'md', accent = 'cyan' }) {
  return (
    <div
      className={[
        'relative inline-flex items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br font-semibold text-slate-50 shadow-[0_18px_45px_rgba(8,145,178,0.18)]',
        SIZE_STYLES[size] || SIZE_STYLES.md,
        ACCENT_STYLES[accent] || ACCENT_STYLES.cyan,
      ].join(' ')}
    >
      <div className="absolute inset-[3px] rounded-[24px] border border-white/5 bg-slate-950/70" />
      <span className="relative z-10 tracking-[0.12em]">{getInitials(name)}</span>
    </div>
  );
}
