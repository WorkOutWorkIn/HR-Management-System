import { Button } from '@heroui/react';
import { OrgAvatar } from './OrgAvatar';
import { RoleBadge } from './RoleBadge';

export function TeamManagerCard({ manager }) {
  return (
    <div className="rounded-[36px] border border-white/8 bg-slate-900/80 p-8 shadow-[0_24px_55px_rgba(2,12,27,0.42)]">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full border border-cyan-300/25 p-3 shadow-[0_0_0_6px_rgba(34,211,238,0.08)]">
          <OrgAvatar name={manager.fullName} size="xl" accent="cyan" />
        </div>
        <h2 className="mt-8 text-4xl font-semibold tracking-tight text-white">{manager.fullName}</h2>
        <p className="mt-2 text-lg uppercase tracking-[0.2em] text-cyan-300">
          {manager.jobTitle || manager.role}
        </p>
        <p className="mt-3 text-sm text-slate-500">{manager.workEmail}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <RoleBadge label={manager.department || 'Core Team'} tone="MANAGER" />
          <RoleBadge label={`${manager.reportsCount || 0} Reports`} tone="ADMIN" />
        </div>
        <Button className="mt-10" color="default" fullWidth radius="lg" variant="faded">
          Contact Manager
        </Button>
      </div>
    </div>
  );
}
