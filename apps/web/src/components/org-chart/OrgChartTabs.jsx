import { NavLink } from 'react-router-dom';

export function OrgChartTabs({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/6 pb-4">
      {items.map((item) =>
        item.disabled || item.current ? (
          <span
            key={item.key}
            className={[
              'rounded-full border px-4 py-2 text-sm',
              item.current
                ? 'border-cyan-400/15 bg-cyan-400/12 font-medium text-cyan-200'
                : 'border-white/6 bg-white/[0.02] text-slate-500',
            ].join(' ')}
          >
            {item.label}
          </span>
        ) : (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              [
                'rounded-full px-4 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-cyan-400/12 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.16)]'
                  : 'text-slate-300 hover:bg-white/[0.03] hover:text-white',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ),
      )}
    </div>
  );
}
