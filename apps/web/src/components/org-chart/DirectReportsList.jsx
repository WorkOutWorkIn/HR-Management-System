import { OrgPersonIdentity } from './OrgPersonIdentity';

export function DirectReportsList({ directReports }) {
  if (!directReports.length) {
    return (
      <div className="rounded-[26px] border border-white/8 bg-slate-950/55 p-5">
        <p className="text-sm text-slate-400">No direct reports are assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {directReports.map((person) => (
        <div
          key={person.id}
          className="rounded-[24px] border border-white/8 bg-slate-950/55 p-4 shadow-[0_12px_30px_rgba(2,12,27,0.24)]"
        >
          <OrgPersonIdentity
            person={person}
            accent="violet"
            avatarSize="sm"
            titleClassName="truncate text-lg font-semibold text-white"
            subtitleClassName="truncate text-sm text-slate-400"
          />
        </div>
      ))}
    </div>
  );
}
