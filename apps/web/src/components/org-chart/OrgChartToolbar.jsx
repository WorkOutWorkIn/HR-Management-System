import { Button } from '@heroui/react';

function IconMagnifier({ type = 'plus' }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
      {type === 'plus' ? <path d="M11 8.5v5M8.5 11h5" /> : null}
      {type === 'minus' ? <path d="M8.5 11h5" /> : null}
    </svg>
  );
}

function IconFrame() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 4H5a1 1 0 00-1 1v3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M4 16v3a1 1 0 001 1h3" />
    </svg>
  );
}

export function OrgChartToolbar({ liveView, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/8 bg-slate-950/80 p-3 shadow-[0_24px_50px_rgba(2,12,27,0.34)] backdrop-blur">
        <div className="grid gap-3">
          <Button aria-label="Zoom in" color="default" isIconOnly variant="light" onPress={onZoomIn}>
            <IconMagnifier type="plus" />
          </Button>
          <Button aria-label="Zoom out" color="default" isIconOnly variant="light" onPress={onZoomOut}>
            <IconMagnifier type="minus" />
          </Button>
          <Button aria-label="Reset view" color="default" isIconOnly variant="light" onPress={onReset}>
            <IconFrame />
          </Button>
        </div>
      </div>

      <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/12 bg-slate-950/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,12,27,0.32)]">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
        <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200">{liveView.label}</span>
        <span className="text-slate-400">{liveView.employeeCount} Employees</span>
      </div>
    </div>
  );
}
