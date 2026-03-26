import { Card, CardBody, CardHeader } from '@heroui/react';

export function ModulePlaceholderPage({ title, description }) {
  return (
    <Card className="border border-dashed border-slate-700 bg-slate-900/70">
      <CardHeader className="flex flex-col items-start gap-2">
        {/* <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Scaffold ready</p> */}
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </CardHeader>
      <CardBody className="text-slate-300">
        <p>{description}</p>
      </CardBody>
    </Card>
  );
}
