import { OrgPersonIdentity } from './OrgPersonIdentity';
import { RoleBadge } from './RoleBadge';

export function OrgChartNodeCard({ person, accent = 'cyan', featured = false, selected, onSelect }) {
  if (!person) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(person.id)}
      className={[
        'group relative w-full rounded-[30px] border bg-slate-900/85 p-6 text-left transition duration-200',
        featured
          ? 'border-cyan-400/30 shadow-[0_24px_60px_rgba(10,30,48,0.45)]'
          : 'border-white/8 shadow-[0_18px_40px_rgba(2,12,27,0.35)]',
        selected ? 'ring-1 ring-cyan-300/50' : 'hover:border-cyan-400/30',
      ].join(' ')}
    >
      <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_52%)] opacity-80" />
      <div className="relative z-10">
        <OrgPersonIdentity
          person={person}
          accent={accent}
          avatarSize={featured ? 'lg' : 'md'}
          titleClassName={[
            'truncate font-semibold text-white',
            featured ? 'text-[2rem] leading-tight' : 'text-lg',
          ].join(' ')}
          subtitleClassName="truncate text-sm text-cyan-200/90"
          tertiaryText={featured ? person.workEmail : person.department}
          tertiaryClassName={featured ? 'mt-2 text-sm text-slate-400' : 'mt-1 text-xs text-slate-500'}
        />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <RoleBadge label={person.role} tone={person.role} />
          {person.status ? <RoleBadge label={person.status} tone={person.status} /> : null}
        </div>
      </div>
    </button>
  );
}
