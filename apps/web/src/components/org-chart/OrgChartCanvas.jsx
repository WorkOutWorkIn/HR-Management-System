import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { buildOrgChartFlow } from '@/services/org-chart/orgChart.flow';
import { OrgChartFlowNode } from './OrgChartFlowNode';
import { OrgChartTabs } from './OrgChartTabs';
import { RoleBadge } from './RoleBadge';

const nodeTypes = {
  orgPerson: OrgChartFlowNode,
};

function getMiniMapColor(node) {
  if (node.data?.isOpenRole) {
    return '#38bdf8';
  }

  if (node.data?.role === 'ADMIN') {
    return '#fbbf24';
  }

  if (node.data?.role === 'MANAGER') {
    return '#22d3ee';
  }

  return '#475569';
}

function FocusedNodePanel({ person, onClose }) {
  return (
    <div className="w-[236px] rounded-[26px] border border-white/8 bg-slate-950/82 p-4 shadow-[0_20px_45px_rgba(2,12,27,0.34)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-slate-500">
          Focused node
        </p>
        <button
          aria-label="Close focused node panel"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
          type="button"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="truncate text-xl font-semibold text-white">{person.fullName}</p>
        <p className="truncate text-sm text-cyan-100/90">{person.jobTitle || person.role}</p>
        {person.workEmail ? <p className="truncate text-xs text-slate-500">{person.workEmail}</p> : null}
        <div className="pt-1">
          <RoleBadge
            compact
            label={person.role === 'OPEN_ROLE' ? 'Open Role' : person.role}
            tone={person.role}
          />
        </div>
      </div>
    </div>
  );
}

function LiveViewPill({ liveView }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/12 bg-slate-950/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,12,27,0.32)] backdrop-blur">
      <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
      <span className="font-semibold uppercase tracking-[0.2em] text-cyan-200">
        {liveView.label}
      </span>
      <span className="text-slate-400">{liveView.employeeCount} Employees</span>
    </div>
  );
}

function OrgChartFlowWorkspace({ workspace, selectedNodeId, onSelectNode }) {
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const lastStructureRef = useRef('');
  const flow = useMemo(
    () =>
      buildOrgChartFlow(workspace, {
        selectedNodeId,
      }),
    [selectedNodeId, workspace],
  );
  const structureSignature = useMemo(
    () =>
      `${flow.nodes.map((node) => node.id).join('|')}::${flow.edges
        .map((edge) => edge.id)
        .join('|')}`,
    [flow.edges, flow.nodes],
  );
  const selectedNode = useMemo(
    () => flow.nodes.find((node) => node.id === selectedNodeId)?.data || null,
    [flow.nodes, selectedNodeId],
  );

  const focusNode = useCallback(
    (nodeId) => {
      if (!nodeId) {
        return;
      }

      onSelectNode?.(nodeId);

      window.requestAnimationFrame(() => {
        const node = reactFlow.getNode(nodeId);

        if (!node) {
          return;
        }

        const width = node.measured?.width || node.width || 0;
        const height = node.measured?.height || node.height || 0;
        const position = node.positionAbsolute || node.position;

        reactFlow.setCenter(position.x + width / 2, position.y + height / 2, {
          duration: 420,
          zoom: Math.max(reactFlow.getZoom(), 0.92),
        });
      });
    },
    [onSelectNode, reactFlow],
  );

  const fitGraphToView = useCallback(() => {
    window.requestAnimationFrame(() => {
      reactFlow.fitView({
        duration: 420,
        maxZoom: 1,
        minZoom: 0.58,
        padding: 0.16,
      });
    });
  }, [reactFlow]);

  useEffect(() => {
    if (!nodesInitialized || !flow.nodes.length) {
      return;
    }

    if (lastStructureRef.current === structureSignature) {
      return;
    }

    lastStructureRef.current = structureSignature;
    fitGraphToView();
  }, [fitGraphToView, flow.nodes.length, nodesInitialized, structureSignature]);

  useEffect(() => {
    if (!nodesInitialized || !selectedNodeId) {
      return;
    }

    focusNode(selectedNodeId);
  }, [focusNode, nodesInitialized, selectedNodeId]);

  if (!flow.nodes.length) {
    return (
      <div className="flex h-[720px] items-center justify-center rounded-[32px] border border-white/8 bg-[#060d14]">
        <NoticeBanner tone="info">
          No reporting relationships are available yet. Assign employees to managers to populate the
          chart.
        </NoticeBanner>
      </div>
    );
  }

  return (
    <div className="h-[720px] overflow-hidden rounded-[32px] border border-white/8 bg-[#060d14] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <ReactFlow
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        deleteKeyCode={null}
        disableKeyboardA11y={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.42}
        maxZoom={1.3}
        nodeTypes={nodeTypes}
        nodes={flow.nodes}
        edges={flow.edges}
        onNodeClick={(_, node) => focusNode(node.id)}
        onPaneClick={() => onSelectNode?.(null)}
      >
        <Background
          color="rgba(51, 65, 85, 0.32)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="org-chart-flow__controls"
          position="top-left"
          orientation="horizontal"
          showInteractive={false}
        />
        <MiniMap
          className="org-chart-flow__minimap"
          maskColor="rgba(2, 6, 23, 0.6)"
          nodeColor={getMiniMapColor}
          pannable
          position="bottom-right"
          style={{ bottom: 20, height: 124, right: 20, width: 180 }}
          zoomable
        />

        <Panel position="top-right" style={{ right: 20, top: 20 }}>
          <LiveViewPill liveView={workspace.liveView} />
        </Panel>

        {selectedNode ? (
          <Panel position="top-right" style={{ right: 20, top: 92 }}>
            <FocusedNodePanel person={selectedNode} onClose={() => onSelectNode?.(null)} />
          </Panel>
        ) : null}
      </ReactFlow>
    </div>
  );
}

export function OrgChartCanvas(props) {
  return (
    <div>
      <OrgChartTabs items={props.workspace.tabs} />

      <section className="mt-6 rounded-[36px] border border-white/8 bg-[#08111a] px-6 py-7 shadow-[0_26px_60px_rgba(2,12,27,0.45)] lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
              {props.workspace.header.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {props.workspace.header.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-400">
              {props.workspace.header.subtitle}
            </p>
          </div>

          {props.headerActions ? <div className="shrink-0">{props.headerActions}</div> : null}
        </div>

        <div className="mt-8">
          <ReactFlowProvider>
            <OrgChartFlowWorkspace {...props} />
          </ReactFlowProvider>
        </div>
      </section>
    </div>
  );
}
