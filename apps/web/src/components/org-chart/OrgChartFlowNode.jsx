import { Handle, Position } from '@xyflow/react';
import { OrgAvatar } from './OrgAvatar';
import { RoleBadge } from './RoleBadge';

function HiddenHandle({ type, position }) {
  return (
    <Handle
      type={type}
      position={position}
      className="!h-2 !w-2 !border-0 !bg-cyan-300/0 !opacity-0"
    />
  );
}

export function OrgChartFlowNode({ data, selected }) {
  if (data.isOpenRole) {
    return (
      <div
        style={{ width: 176 }}
        className={[
          'relative rounded-[18px] border border-dashed border-cyan-400/18 bg-cyan-400/6 px-3.5 py-2.5 text-left shadow-[0_12px_22px_rgba(2,12,27,0.26)] backdrop-blur',
          selected ? 'ring-1 ring-cyan-300/55' : '',
        ].join(' ')}
      >
        <HiddenHandle position={Position.Top} type="target" />
        <p className="truncate text-[13px] font-semibold text-cyan-100">{data.fullName}</p>
        <p className="mt-0.5 truncate text-[11px] text-cyan-200/70">{data.jobTitle}</p>
        <HiddenHandle position={Position.Bottom} type="source" />
      </div>
    );
  }

  return (
    <div
      style={{ width: 196 }}
      className={[
        'relative rounded-[20px] border border-white/8 bg-slate-900/90 px-3.5 py-3 text-left shadow-[0_14px_24px_rgba(2,12,27,0.28)] backdrop-blur transition',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[20px] before:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_56%)]',
        selected ? 'border-cyan-300/35 ring-1 ring-cyan-300/45' : 'hover:border-cyan-400/25',
      ].join(' ')}
    >
      <HiddenHandle position={Position.Top} type="target" />

      <div className="relative z-10 flex items-start gap-2.5">
        <OrgAvatar
          accent={data.role === 'ADMIN' ? 'amber' : 'cyan'}
          name={data.fullName}
          size="xs"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-white">
            {data.fullName}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-cyan-100/90">
            {data.jobTitle || data.role}
          </p>
          {data.department ? (
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {data.department}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 mt-2.5 flex flex-wrap items-center gap-1.5">
        <RoleBadge compact label={data.role} tone={data.role} />
        {data.status && data.status !== 'ACTIVE' ? (
          <RoleBadge compact label={data.status} tone={data.status} />
        ) : null}
      </div>

      <HiddenHandle position={Position.Bottom} type="source" />
    </div>
  );
}
