import { Spinner } from '@heroui/react';

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-3 text-slate-200">
        <Spinner color="primary" size="sm" />
        <span>{label}</span>
      </div>
    </div>
  );
}
