import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { ROLES } from '@hrms/shared';
import { useAuth } from '@/hooks/useAuth';

const highlights = [
  'Modular route groups for future HRMS domains',
  'Role-aware guard structure with ADMIN, MANAGER, and EMPLOYEE',
  'Cookie-ready API client and placeholder auth state',
  'Security-first backend conventions with migrations and middleware',
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Chip
            color={
              user?.role === ROLES.ADMIN
                ? 'warning'
                : user?.role === ROLES.MANAGER
                  ? 'primary'
                  : 'default'
            }
            variant="flat"
          >
            {user?.role}
          </Chip>
          <p className="text-sm text-slate-400">{user?.workEmail}</p>
        </div>
        <h2 className="mt-4 text-3xl font-semibold text-white">Foundation dashboard</h2>
        <p className="mt-2 max-w-3xl text-slate-300">
          This placeholder dashboard confirms the secure scaffold is running while leaving business
          modules intentionally unimplemented.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => (
          <Card key={item} className="border border-slate-800 bg-slate-900/70">
            <CardHeader className="pb-0 text-sm uppercase tracking-[0.2em] text-slate-400">
              Ready
            </CardHeader>
            <CardBody className="pt-3 text-slate-100">{item}</CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
