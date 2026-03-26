import dagre from 'dagre';
import { Position } from '@xyflow/react';

const PERSON_NODE_WIDTH = 196;
const PERSON_NODE_HEIGHT = 80;
const OPEN_ROLE_NODE_WIDTH = 176;
const OPEN_ROLE_NODE_HEIGHT = 60;
const VIRTUAL_ROOT_ID = '__org-chart-root__';

function uniqueById(items = []) {
  return Array.from(new Map(items.filter(Boolean).map((item) => [item.id, item])).values());
}

function buildVisibleItems(workspace) {
  const people = uniqueById(workspace.chartPeople || []);
  const openRoleNodes = workspace.openRoleNodes || [];

  return [...people, ...openRoleNodes];
}

function getNodeSize(item) {
  if (item.kind === 'open-role') {
    return {
      width: OPEN_ROLE_NODE_WIDTH,
      height: OPEN_ROLE_NODE_HEIGHT,
    };
  }

  return {
    width: PERSON_NODE_WIDTH,
    height: PERSON_NODE_HEIGHT,
  };
}

export function buildOrgChartFlow(workspace, options = {}) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    ranker: 'tight-tree',
    nodesep: 44,
    ranksep: 96,
    marginx: 18,
    marginy: 18,
  });

  const items = buildVisibleItems(workspace);
  const itemIds = new Set(items.map((item) => item.id));

  graph.setNode(VIRTUAL_ROOT_ID, {
    width: 1,
    height: 1,
  });

  items.forEach((item) => {
    const { width, height } = getNodeSize(item);

    graph.setNode(item.id, { width, height });
  });

  const edges = [];

  items.forEach((item) => {
    if (!item.managerUserId || !itemIds.has(item.managerUserId)) {
      return;
    }

    graph.setEdge(item.managerUserId, item.id);

    edges.push({
      id: `${item.managerUserId}-${item.id}`,
      source: item.managerUserId,
      target: item.id,
      type: 'smoothstep',
      animated: false,
      pathOptions: {
        borderRadius: 18,
      },
      style: {
        stroke: 'rgba(56, 189, 248, 0.36)',
        strokeWidth: 1.35,
      },
    });
  });

  items
    .filter((item) => !item.managerUserId || !itemIds.has(item.managerUserId))
    .forEach((item) => {
      graph.setEdge(VIRTUAL_ROOT_ID, item.id);
    });

  dagre.layout(graph);

  const nodes = items.map((item) => {
    const { width, height } = getNodeSize(item);
    const position = graph.node(item.id);

    return {
      id: item.id,
      type: 'orgPerson',
      position: {
        x: position.x - width / 2,
        y: position.y - height / 2,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        ...item,
        isOpenRole: item.kind === 'open-role',
      },
      selected: item.id === options.selectedNodeId,
    };
  });

  return {
    nodes,
    edges,
  };
}
