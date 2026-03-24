import { Button } from '@heroui/react';
import { DirectReportCard } from './DirectReportCard';

export function DirectReportsGrid({
  directReports,
  openPosition,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="rounded-[34px] border border-white/8 bg-slate-900/72 p-6 shadow-[0_24px_55px_rgba(2,12,27,0.34)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-4xl font-semibold tracking-tight text-white">Direct Reports</h3>
          <span className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm text-slate-300">
            {directReports.length} Team Members
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            radius="lg"
            variant={viewMode === 'grid' ? 'solid' : 'light'}
            className={viewMode === 'grid' ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400'}
            onPress={() => onViewModeChange?.('grid')}
          >
            <span className="grid grid-cols-2 gap-1">
              <span className="h-2 w-2 rounded-sm bg-current" />
              <span className="h-2 w-2 rounded-sm bg-current" />
              <span className="h-2 w-2 rounded-sm bg-current" />
              <span className="h-2 w-2 rounded-sm bg-current" />
            </span>
          </Button>
          <Button
            isIconOnly
            radius="lg"
            variant={viewMode === 'list' ? 'solid' : 'light'}
            className={viewMode === 'list' ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400'}
            onPress={() => onViewModeChange?.('list')}
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-4 rounded bg-current" />
              <span className="h-0.5 w-4 rounded bg-current" />
              <span className="h-0.5 w-4 rounded bg-current" />
            </span>
          </Button>
        </div>
      </div>

      <div
        className={
          viewMode === 'list' ? 'mt-6 space-y-4' : 'mt-6 grid gap-5 md:grid-cols-2'
        }
      >
        {directReports.map((person) => (
          <DirectReportCard key={person.id} person={person} />
        ))}
        {openPosition ? <DirectReportCard isOpenRole person={openPosition} /> : null}
      </div>
    </div>
  );
}
