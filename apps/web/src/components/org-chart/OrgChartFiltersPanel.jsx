export function OrgChartFiltersPanel({ filters, onToggle }) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-slate-950/80 p-5 shadow-[0_20px_45px_rgba(2,12,27,0.35)]">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">View filters</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onToggle?.(filter.key)}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              filter.active
                ? 'bg-cyan-400/12 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]',
            ].join(' ')}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
