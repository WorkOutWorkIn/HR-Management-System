import { OrgChartTabs } from './OrgChartTabs';
import { OrgChartNodeCard } from './OrgChartNodeCard';
import { DepartmentGroupCard } from './DepartmentGroupCard';
import { OrgChartToolbar } from './OrgChartToolbar';
import { OrgChartMiniMap } from './OrgChartMiniMap';
import { OrgChartFiltersPanel } from './OrgChartFiltersPanel';
import { OrgChartQuickSearch } from './OrgChartQuickSearch';

export function OrgChartCanvas({
  workspace,
  selectedNodeId,
  onSelectNode,
  searchQuery,
  onSearchChange,
  quickSearchResults,
  onToggleFilter,
}) {
  const selectedNode =
    workspace.quickSearchItems.find((item) => item.id === selectedNodeId) || workspace.rootNode;
  const groupCount = workspace.departmentGroups.length;
  const desktopCardWidth = 320;
  const desktopGap = 32;
  const desktopGroupsWidth =
    groupCount > 0 ? groupCount * desktopCardWidth + Math.max(groupCount - 1, 0) * desktopGap : 0;
  const desktopRailWidth = Math.max(desktopGroupsWidth - desktopCardWidth, 0);

  return (
    <div className="space-y-6">
      <OrgChartTabs items={workspace.tabs} />

      <section className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[#08111a] px-6 py-7 shadow-[0_26px_60px_rgba(2,12,27,0.45)] lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),transparent_25%)]" />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                {workspace.header.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {workspace.header.title}
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-400">{workspace.header.subtitle}</p>
            </div>
            <OrgChartToolbar
              liveView={workspace.liveView}
              onZoomIn={() => {}}
              onZoomOut={() => {}}
              onReset={() => onSelectNode?.(workspace.rootNode?.id)}
            />
          </div>

          <div className="relative mt-14 min-h-[880px]">
            <div className="mx-auto flex max-w-4xl flex-col items-center">
              <div className="w-full max-w-md">
                <OrgChartNodeCard
                  person={workspace.rootNode}
                  featured
                  selected={selectedNodeId === workspace.rootNode?.id}
                  onSelect={onSelectNode}
                />
              </div>

              {groupCount ? (
                <>
                  <div className="mt-4 h-14 w-px bg-gradient-to-b from-cyan-300/75 via-cyan-300/30 to-transparent" />

                  <div className="hidden xl:block">
                    {groupCount > 1 ? (
                      <div className="relative">
                        <div
                          className="mx-auto h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
                          style={{ width: `${desktopRailWidth}px` }}
                        />
                        <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_14px_rgba(34,211,238,0.55)]" />
                      </div>
                    ) : null}

                    <div
                      className="mx-auto mt-0 grid gap-8"
                      style={{
                        gridTemplateColumns: `repeat(${groupCount}, minmax(${desktopCardWidth}px, ${desktopCardWidth}px))`,
                      }}
                    >
                      {workspace.departmentGroups.map((group) => (
                        <div key={group.id} className="flex flex-col items-center">
                          <div className="h-7 w-px bg-gradient-to-b from-cyan-300/45 to-cyan-300/0" />
                          <DepartmentGroupCard
                            group={group}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-6 xl:hidden">
                    {workspace.departmentGroups.map((group) => (
                      <div key={group.id} className="flex flex-col items-center">
                        <div className="h-6 w-px bg-gradient-to-b from-cyan-300/45 to-cyan-300/0" />
                        <DepartmentGroupCard
                          group={group}
                          selectedNodeId={selectedNodeId}
                          onSelectNode={onSelectNode}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="absolute right-0 top-0 hidden xl:block w-[220px]">
              <OrgChartMiniMap groups={workspace.departmentGroups} />
              <div className="mt-5 rounded-[28px] border border-white/8 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Focused node</p>
                {selectedNode ? (
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-white">{selectedNode.fullName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedNode.jobTitle || selectedNode.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Select a node to inspect the hierarchy.</p>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 hidden xl:grid gap-5 xl:grid-cols-[340px,340px]">
              <OrgChartFiltersPanel filters={workspace.filters} onToggle={onToggleFilter} />
              <OrgChartQuickSearch
                value={searchQuery}
                onChange={onSearchChange}
                results={quickSearchResults}
                onSelect={onSelectNode}
              />
            </div>

            <div className="mt-12 grid gap-5 xl:hidden">
              <OrgChartFiltersPanel filters={workspace.filters} onToggle={onToggleFilter} />
              <OrgChartQuickSearch
                value={searchQuery}
                onChange={onSearchChange}
                results={quickSearchResults}
                onSelect={onSelectNode}
              />
              <div className="rounded-[28px] border border-white/8 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Focused node</p>
                {selectedNode ? (
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-white">{selectedNode.fullName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedNode.jobTitle || selectedNode.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Select a node to inspect the hierarchy.</p>
                )}
              </div>
              <OrgChartMiniMap groups={workspace.departmentGroups} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
