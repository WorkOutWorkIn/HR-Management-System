import { OrgPersonIdentity } from './OrgPersonIdentity';

export function ReportsToCard({ manager }) {
  if (!manager) {
    return (
      <div className="rounded-[26px] border border-white/8 bg-slate-950/55 p-5">
        <p className="text-sm text-slate-400">
          No manager is assigned yet. ADMIN can update this reporting line from the Org Chart
          workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-white/8 bg-slate-950/55 p-5 shadow-[0_16px_35px_rgba(2,12,27,0.28)]">
      <OrgPersonIdentity
        person={manager}
        accent="cyan"
        titleClassName="truncate text-2xl font-semibold text-white"
        subtitleClassName="truncate text-lg text-slate-300"
        tertiaryText={manager.workEmail}
        tertiaryClassName="mt-2 truncate text-sm text-slate-500"
      />
    </div>
  );
}
