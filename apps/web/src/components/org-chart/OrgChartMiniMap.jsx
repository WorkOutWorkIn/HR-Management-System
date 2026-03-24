export function OrgChartMiniMap({ groups }) {
  const markers = groups.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(67,56,202,0.2),transparent_45%),linear-gradient(180deg,#0f172a,#111827)] p-4 shadow-[0_20px_45px_rgba(2,12,27,0.35)]">
      <div className="absolute inset-x-5 top-5 h-10 rounded-xl border border-cyan-400/25 bg-cyan-400/6" />
      <div className="mt-14 grid grid-cols-2 gap-3">
        {markers.map((group) => (
          <div
            key={group.id}
            className="h-10 rounded-xl border border-white/8 bg-white/[0.04]"
            title={group.department}
          />
        ))}
      </div>
      <span className="mt-5 inline-flex rounded-full bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">
        Minimap
      </span>
    </div>
  );
}
