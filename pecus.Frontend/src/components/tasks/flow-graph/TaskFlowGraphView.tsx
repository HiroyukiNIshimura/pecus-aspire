'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { TaskFlowMapResponse, TaskFlowNode } from '@/connectors/api/pecus';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskFlowGraphNode from './TaskFlowGraphNode';
import { type TaskNodeData, useTaskFlowGraph } from './useTaskFlowGraph';

/** スマホ判定の閾値（px） */
const MOBILE_BREAKPOINT = 640;

interface TaskFlowGraphViewProps {
  /** タスクフローマップデータ */
  data: TaskFlowMapResponse;
  /** タスクノードクリック時のコールバック */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** タスクごとにクリック可能かどうかを判断する関数 */
  canEditTask?: (task: TaskFlowNode) => boolean;
}

/**
 * チェーン内のタスクの合計期間を計算
 */
function calculateChainDuration(tasks: TaskFlowNode[]): number {
  return tasks.reduce((sum, task) => sum + (task.durationDays ?? 0), 0);
}

/**
 * 期間を表示用にフォーマット
 */
function formatDuration(days: number): string {
  if (days === 0) return '0日';
  if (days < 1) return `${Math.round(days * 24)}時間`;
  if (Number.isInteger(days)) return `${days}日`;
  return `${days.toFixed(1)}日`;
}

/**
 * タスクフローのDAGグラフビュー
 * GitLab 13.1風のワークフロー可視化
 */
export default function TaskFlowGraphView({ data, onTaskClick, canEditTask }: TaskFlowGraphViewProps) {
  const { criticalPath, otherChains, independentTasks, summary } = data;

  // レスポンシブ対応: スマホでは縦レイアウト
  const [direction, setDirection] = useState<'TB' | 'LR'>('LR');
  useEffect(() => {
    const checkWidth = () => {
      setDirection(window.innerWidth < MOBILE_BREAKPOINT ? 'TB' : 'LR');
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // カスタムノードタイプの定義（useMemoでメモ化してReactFlowに渡す）
  // カスタムノードタイプの定義
  const nodeTypes = useMemo(
    () => ({
      taskNode: TaskFlowGraphNode,
    }),
    [],
  );

  // グラフデータの生成（方向を渡す）
  const { nodes: initialNodes, edges: initialEdges } = useTaskFlowGraph(data, direction);

  // React Flow の state 管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // データが変わったらノード/エッジを更新
  useEffect(() => {
    setNodes(initialNodes as Node[]);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // ノードクリック時の処理
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const nodeData = node.data as unknown as TaskNodeData;
      const task = nodeData.task;
      const clickable = canEditTask?.(task) ?? false;
      if (clickable && onTaskClick) {
        onTaskClick(task);
      }
    },
    [onTaskClick, canEditTask],
  );

  // 全タスクの合計期間を計算
  const totalDuration =
    calculateChainDuration(criticalPath) +
    otherChains.reduce((sum, chain) => sum + calculateChainDuration(chain), 0) +
    independentTasks.reduce((sum, task) => sum + (task.durationDays ?? 0), 0);

  // 担当者のユニーク人数を計算
  const uniqueAssigneeCount = useMemo(() => {
    const allTasks = [...criticalPath, ...otherChains.flat(), ...independentTasks];
    return new Set(allTasks.map((task) => task.assigned?.id).filter((id): id is number => id != null)).size;
  }, [criticalPath, otherChains, independentTasks]);

  const hasAnyTasks = summary.totalCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* サマリ情報 */}
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full text-sm mb-4 shrink-0">
        <div className="stat py-3 px-4">
          <div className="stat-figure text-primary">
            <span className="icon-[mdi--clipboard-list-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">総タスク</div>
          <div className="stat-value text-xl text-primary">{summary.totalCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-success">
            <span className="icon-[mdi--play-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">着手可能</div>
          <div className="stat-value text-xl text-success">{summary.readyCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-warning">
            <span className="icon-[mdi--pause-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">待機中</div>
          <div className="stat-value text-xl text-warning">{summary.waitingCount}</div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-figure text-success">
            <span className="icon-[mdi--check-circle-outline] w-6 h-6" aria-hidden="true" />
          </div>
          <div className="stat-title text-xs">完了</div>
          <div className="stat-value text-xl">{summary.completedCount}</div>
        </div>
        {hasAnyTasks && (
          <div className="stat py-3 px-4">
            <div className="stat-figure text-info">
              <span className="icon-[mdi--timer-outline] w-6 h-6" aria-hidden="true" />
            </div>
            <div className="stat-title text-xs">合計期間（残）</div>
            <div className="stat-value text-xl text-info">{formatDuration(totalDuration)}</div>
          </div>
        )}
        {hasAnyTasks && (
          <div className="stat py-3 px-4">
            <div className="stat-figure text-secondary">
              <span className="icon-[mdi--account-group-outline] w-6 h-6" aria-hidden="true" />
            </div>
            <div className="stat-title text-xs">担当者</div>
            <div className="stat-value text-xl text-secondary">{uniqueAssigneeCount}人</div>
          </div>
        )}
      </div>

      {/* クリティカルパス情報 */}
      {criticalPath.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 shrink-0">
          <div className="flex items-center gap-1">
            <span className="icon-[mdi--fire] w-5 h-5 text-error shrink-0" aria-hidden="true" />
            <span className="font-semibold text-sm whitespace-nowrap">クリティカルパス</span>
          </div>
          <span className="badge badge-error badge-sm whitespace-nowrap">{criticalPath.length}ステップ</span>
          <span className="badge badge-error badge-outline badge-sm gap-1 whitespace-nowrap">
            <span className="icon-[mdi--clock-outline] w-3 h-3" aria-hidden="true" />
            {formatDuration(calculateChainDuration(criticalPath))}
          </span>
        </div>
      )}

      {/* 凡例 - モバイルでは非表示 */}
      <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="icon-[mdi--fire] w-4 h-4 text-error" aria-hidden="true" />
          <span>クリティカルパス</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-error rounded" />
          <span>クリティカル接続</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-slate-400 rounded" />
          <span>依存関係</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-l-warning border border-base-content/25 rounded" />
          <span>待機中</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border-l-4 border-l-error border border-base-content/25 rounded" />
          <span>後続タスクあり</span>
        </div>
      </div>

      {/* グラフエリア - React Flowには明示的な高さとReactFlowProviderが必要 */}
      <div style={{ height: 500 }} className="rounded-lg border border-base-300 overflow-hidden bg-base-200">
        {hasAnyTasks ? (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              nodesConnectable={false}
              nodesDraggable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2}
              attributionPosition="bottom-left"
              proOptions={{ hideAttribution: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <Controls position="top-right" showInteractive={false} />
              {/* スマホではMiniMapを非表示 */}
              {direction === 'LR' && (
                <MiniMap
                  position="bottom-right"
                  nodeColor={(node) => {
                    const nodeData = node.data as unknown as TaskNodeData;
                    if (nodeData.isCriticalPath) return '#f87171';
                    if (nodeData.task.isCompleted) return '#22c55e';
                    if (nodeData.task.isDiscarded) return '#94a3b8';
                    if (!nodeData.task.canStart) return '#facc15';
                    return '#3b82f6';
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                  style={{ backgroundColor: 'oklch(var(--b1))' }}
                />
              )}
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#94a3b8" />
            </ReactFlow>
          </ReactFlowProvider>
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            <div className="text-center">
              <span className="icon-[mdi--clipboard-outline] w-12 h-12 mb-2" aria-hidden="true" />
              <p>タスクを追加しましょう</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
