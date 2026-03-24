export function NoticeBanner({ tone = 'info', children }) {
  const styles = {
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    danger: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[tone] || styles.info}`}>
      {children}
    </div>
  );
}
