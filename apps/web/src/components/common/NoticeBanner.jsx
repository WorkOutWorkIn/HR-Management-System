export function NoticeBanner({ tone = 'info', children }) {
  const styles = {
    info: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-800 dark:text-cyan-100',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100',
    danger: 'border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-100',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-100',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[tone] || styles.info}`}>
      {children}
    </div>
  );
}
