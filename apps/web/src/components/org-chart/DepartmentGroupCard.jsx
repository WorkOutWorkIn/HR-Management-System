import { OrgPersonIdentity } from './OrgPersonIdentity';
import { RoleBadge } from './RoleBadge';

const ACCENT_STYLES = {
  cyan: 'from-cyan-400/25 to-cyan-400/0 text-cyan-200',
  amber: 'from-amber-400/25 to-amber-400/0 text-amber-200',
  emerald: 'from-emerald-400/25 to-emerald-400/0 text-emerald-200',
  violet: 'from-violet-400/25 to-violet-400/0 text-violet-200',
};

export function DepartmentGroupCard({ group, selectedNodeId, onSelectNode }) {
  const accentStyle = ACCENT_STYLES[group.accent] || ACCENT_STYLES.cyan;

  return (
    <div className="relative rounded-[32px] border border-white/8 bg-slate-900/80 p-6 shadow-[0_24px_55px_rgba(2,12,27,0.34)]">
      <div className={`absolute inset-x-7 top-0 h-px bg-gradient-to-r ${accentStyle}`} />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">{group.department}</p>
          <p className="mt-2 text-sm text-slate-400">{group.headcount} people in view</p>
        </div>
        <RoleBadge
          label={`Lead ${group.lead.role}`}
          tone={group.accent === 'amber' ? 'ADMIN' : 'MANAGER'}
        />
      </div>

      <button
        type="button"
        onClick={() => onSelectNode?.(group.lead.id)}
        className={[
          'mb-4 w-full rounded-[24px] border border-white/6 bg-slate-950/60 p-4 text-left transition',
          selectedNodeId === group.lead.id ? 'ring-1 ring-cyan-300/50' : 'hover:border-cyan-400/25',
        ].join(' ')}
      >
        <OrgPersonIdentity
          person={group.lead}
          accent={group.accent}
          titleClassName="truncate text-lg font-semibold text-white"
          subtitleClassName="truncate text-sm text-slate-400"
          tertiaryText={group.lead.workEmail}
          tertiaryClassName="mt-1 truncate text-xs text-slate-500"
        />
      </button>

      <div className="space-y-3">
        {group.members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelectNode?.(member.id)}
            className={[
              'flex w-full items-center gap-3 rounded-[22px] border border-white/6 bg-slate-950/45 p-3.5 text-left transition',
              selectedNodeId === member.id ? 'ring-1 ring-cyan-300/50' : 'hover:border-cyan-400/20',
            ].join(' ')}
          >
            <OrgPersonIdentity
              person={member}
              accent={group.accent}
              avatarSize="sm"
              titleClassName="truncate text-sm font-medium text-white"
              subtitleClassName="truncate text-xs text-slate-400"
            />
          </button>
        ))}

        {group.openRoles.map((role) => (
          <div
            key={role.id}
            className="rounded-[22px] border border-dashed border-cyan-400/15 bg-cyan-400/5 p-3.5"
          >
            <p className="text-sm font-medium text-cyan-100">{role.title}</p>
            <p className="mt-1 text-xs text-cyan-200/70">{role.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
