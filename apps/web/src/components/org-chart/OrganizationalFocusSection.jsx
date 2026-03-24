import { ReportsToCard } from './ReportsToCard';
import { DirectReportsList } from './DirectReportsList';

export function OrganizationalFocusSection({ manager, directReports }) {
  return (
    <section className="rounded-[36px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          ✦
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Organizational focus</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Reporting structure</h2>
        </div>
      </div>

      <div className="mt-8 space-y-7">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Reports To</p>
          <div className="mt-3">
            <ReportsToCard manager={manager} />
          </div>
        </div>

        <div className="border-t border-white/6 pt-7">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Direct Reports ({directReports.length})
          </p>
          <div className="mt-3">
            <DirectReportsList directReports={directReports} />
          </div>
        </div>
      </div>
    </section>
  );
}
