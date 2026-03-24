import { Description, Input, TextField } from '@/components/forms/TextField';

export function OrgChartQuickSearch({ value, onChange, results, onSelect }) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className="rounded-[28px] border border-white/8 bg-slate-950/80 p-5 shadow-[0_20px_45px_rgba(2,12,27,0.35)]">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">Quick search</p>
      <div className="mt-4 space-y-3">
        <TextField fullWidth name="quickSearch">
          <Input
            aria-label="Quick search"
            value={value}
            placeholder="Find employee..."
            onValueChange={onChange}
            classNames={{
              inputWrapper:
                'border-white/8 bg-slate-900/80 data-[hover=true]:border-cyan-400/30 group-data-[focus=true]:border-cyan-400/35',
            }}
            endContent={
              <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-400">
                ⌘ K
              </span>
            }
          />
          {!hasQuery ? (
            <Description>
              Search highlights a node and helps navigate the current reporting structure.
            </Description>
          ) : null}
        </TextField>

        {hasQuery ? (
          results.length ? (
            <div className="space-y-2">
              {results.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-400/25"
                >
                  <span>
                    <span className="block text-sm font-medium text-white">{item.fullName}</span>
                    <span className="block text-xs text-slate-400">
                      {item.jobTitle || item.role}
                    </span>
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-cyan-200">View</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No matching employees found.</p>
          )
        ) : null}
      </div>
    </div>
  );
}
