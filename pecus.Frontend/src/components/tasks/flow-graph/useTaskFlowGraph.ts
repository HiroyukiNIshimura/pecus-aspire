'use client';

import type { Edge, Node } from '@xyflow/react';
import dagre from 'dagre';
import { useMemo } from 'react';
import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';

/** グラフノードのデータ型（React Flow v12ではRecord<string, unknown>を継承する必要あり） */
export interface TaskNodeData extends Record<string, unknown> {
  task: TaskFlowNode;
  /** クリティカルパス上のノードか */
  isCriticalPath: boolean;
  /** ルートノードか（先行タスクなし） */
  isRoot: boolean;
  /** 末端ノードか（後続タスクなし） */
  isLeaf: boolean;
  /** レイアウト方向 */
  direction: 'TB' | 'LR';
}

/** ノードのサイズ定数 */
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

/**
 * dagreを使って自動レイアウトを計算
 */
function calculateLayout(
  nodes: Node<TaskNodeData>[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR',
): Node<TaskNodeData>[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  });

  // ノードを追加
  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // エッジを追加
  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  // レイアウト計算
  dagre.layout(dagreGraph);

  // 計算結果を適用
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * TaskFlowMapResponse を React Flow の nodes/edges に変換するフック
 * @param data - タスクフローマップのレスポンスデータ
 * @param direction - レイアウト方向（'LR' = 横、'TB' = 縦）
 */
export function useTaskFlowGraph(
  data: TaskFlowMapResponse | null,
  direction: 'TB' | 'LR' = 'LR',
): {
  nodes: Node<TaskNodeData>[];
  edges: Edge[];
  direction: 'TB' | 'LR';
} {
  return useMemo(() => {
    if (!data) {
      return { nodes: [], edges: [], direction };
    }

    const { criticalPath, otherChains, independentTasks } = data;

    // クリティカルパスのタスクIDをセット化
    const criticalPathIds = new Set(criticalPath.map((t) => t.id));

    // 全タスクを収集（重複排除）
    const allTasksMap = new Map<number, TaskFlowNode>();

    for (const task of criticalPath) {
      allTasksMap.set(task.id, task);
    }
    for (const chain of otherChains) {
      for (const task of chain) {
        if (!allTasksMap.has(task.id)) {
          allTasksMap.set(task.id, task);
        }
      }
    }
    for (const task of independentTasks) {
      if (!allTasksMap.has(task.id)) {
        allTasksMap.set(task.id, task);
      }
    }

    const allTasks = Array.from(allTasksMap.values());

    // 後続タスクを持つIDを収集（isLeaf判定用）
    const hasSuccessorIds = new Set<number>();
    for (const task of allTasks) {
      // 配列形式: predecessorTaskIds
      for (const predId of task.predecessorTaskIds || []) {
        hasSuccessorIds.add(predId);
      }
    }

    // ノードを作成
    const nodes: Node<TaskNodeData>[] = allTasks.map((task) => ({
      id: String(task.id),
      type: 'taskNode',
      position: { x: 0, y: 0 }, // dagreで計算
      data: {
        task,
        isCriticalPath: criticalPathIds.has(task.id),
        isRoot: !task.predecessorTaskIds?.length,
        isLeaf: !hasSuccessorIds.has(task.id),
        direction,
      },
    }));

    // エッジを作成（先行タスク → 自タスク）
    const edges: Edge[] = [];
    for (const task of allTasks) {
      // 配列形式: 各先行タスクからエッジを作成
      for (const predId of task.predecessorTaskIds || []) {
        if (allTasksMap.has(predId)) {
          const isCriticalEdge = criticalPathIds.has(task.id) && criticalPathIds.has(predId);

          edges.push({
            id: `e${predId}-${task.id}`,
            source: String(predId),
            target: String(task.id),
            type: 'smoothstep',
            animated: !task.isCompleted && !task.isDiscarded,
            style: {
              stroke: isCriticalEdge ? '#f87171' : '#94a3b8', // error色 or slate-400
              strokeWidth: isCriticalEdge ? 2.5 : 1.5,
            },
            markerEnd: {
              type: 'arrowclosed' as const,
              color: isCriticalEdge ? '#f87171' : '#94a3b8',
            },
          });
        }
      }
    }

    // dagreで自動レイアウト
    const layoutedNodes = calculateLayout(nodes, edges, direction);

    return { nodes: layoutedNodes, edges, direction };
  }, [data, direction]);
}

export { NODE_WIDTH, NODE_HEIGHT };
