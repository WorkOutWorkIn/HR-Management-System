import { Spinner } from '@heroui/react';

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-[var(--loader-border)] bg-[var(--loader-surface)] transition-colors duration-300">
      <div className="flex items-center gap-3 text-[var(--app-foreground)]">
        <Spinner color="primary" size="sm" />
        <span>{label}</span>
      </div>
    </div>
  );
}
