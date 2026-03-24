import { Card, CardBody, CardHeader } from '@heroui/react';

export function ForbiddenPage() {
  return (
    <Card className="border border-rose-500/20 bg-slate-900/70">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Access blocked</p>
        <h2 className="text-2xl font-semibold text-white">You do not have access to this page</h2>
      </CardHeader>
      <CardBody className="text-slate-300">
        Your current role does not include permission to view this resource.
      </CardBody>
    </Card>
  );
}
