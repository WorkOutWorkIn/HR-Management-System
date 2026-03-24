import { Button } from '@heroui/react';
import { OrgPersonIdentity } from './OrgPersonIdentity';

export function DirectReportCard({ person, isOpenRole = false }) {
  if (isOpenRole) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/12 bg-slate-950/40 p-7 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05] text-3xl text-slate-300">
          +
        </div>
        <p className="mt-8 text-3xl font-semibold text-white">{person.title}</p>
        <p className="mt-2 text-sm uppercase tracking-[0.22em] text-slate-500">{person.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-white/8 bg-slate-900/80 p-6 shadow-[0_18px_45px_rgba(2,12,27,0.32)] transition hover:border-cyan-400/25">
      <div className="flex items-start justify-between gap-4">
        <OrgPersonIdentity
          person={person}
          accent="violet"
          titleClassName="text-[2rem] leading-tight font-semibold text-white"
          subtitleClassName="mt-2 text-lg text-slate-300"
          tertiaryText={person.workEmail}
          tertiaryClassName="mt-2 text-sm text-slate-500"
        />
        <Button isIconOnly radius="full" size="sm" variant="light" className="text-slate-400">
          •••
        </Button>
      </div>
    </div>
  );
}
