'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { joinWorkspace } from '@/actions/workspace';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import { Tooltip } from '@/components/common/feedback/Tooltip';
import JoinWorkspaceModal from '@/components/workspaces/JoinWorkspaceModal';
import type { DashboardWorkspaceBreakdownResponse, DashboardWorkspaceStatistics } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

/** 初期表示件数 */
const INITIAL_DISPLAY_COUNT = 5;
/** もっと見るで追加する件数 */
const LOAD_MORE_COUNT = 10;

interface WorkspaceBreakdownTableProps {
  /** ワークスペース別統計データ */
  data: DashboardWorkspaceBreakdownResponse;
}

/** 参加モーダルの状態 */
interface JoinModalState {
  isOpen: boolean;
  workspace: DashboardWorkspaceStatistics | null;
}

/**
 * ワークスペース別統計テーブル
 * 各ワークスペースのタスク・アイテム状況を一覧表示
 */
export default function WorkspaceBreakdownTable({ data }: WorkspaceBreakdownTableProps) {
  const router = useRouter();
  const notify = useNotify();
  const { workspaces } = data;
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [joinModal, setJoinModal] = useState<JoinModalState>({ isOpen: false, workspace: null });

  const displayedWorkspaces = workspaces.slice(0, displayCount);
  const hasMore = workspaces.length > displayCount;
  const remainingCount = workspaces.length - displayCount;

  /** 参加モーダルを開く */
  const handleOpenJoinModal = (workspace: DashboardWorkspaceStatistics) => {
    setJoinModal({ isOpen: true, workspace });
  };

  /** 参加モーダルを閉じる */
  const handleCloseJoinModal = () => {
    setJoinModal({ isOpen: false, workspace: null });
  };

  /** ワークスペースに参加 */
  const handleJoinWorkspace = async () => {
    if (!joinModal.workspace) return;

    const result = await joinWorkspace(joinModal.workspace.workspaceId);

    if (result.success) {
      notify.success(`${joinModal.workspace.workspaceName} に参加しました`);
      handleCloseJoinModal();
      // ページをリフレッシュして最新の状態を反映
      router.refresh();
    } else {
      // エラーは例外としてスローしてモーダル側で処理
      throw new Error(result.message || 'ワークスペースへの参加に失敗しました');
    }
  };

  if (workspaces.length === 0) {
    return (
      <section
        aria-labelledby="workspace-breakdown-heading"
        className="card bg-base-100 shadow-sm border border-base-300"
      >
        <div className="card-body p-4">
          <h2 id="workspace-breakdown-heading" className="text-lg font-semibold flex items-center gap-2">
            <span className="icon-[mdi--folder-multiple-outline] w-5 h-5 text-primary" aria-hidden="true" />
            ワークスペース別状況
          </h2>
          <EmptyState iconClass="icon-[mdi--folder-open-outline]" message="ワークスペースに参加しましょう" size="sm" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="workspace-breakdown-heading"
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <h2 id="workspace-breakdown-heading" className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span className="icon-[mdi--folder-multiple-outline] w-5 h-5 text-primary" aria-hidden="true" />
          ワークスペース別状況
          <span className="text-sm font-normal text-base-content/60 ml-auto">{workspaces.length}件</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>ワークスペース</th>
                <th className="text-right">進行中</th>
                <th className="text-right">完了</th>
                <th className="text-right">期限切れ</th>
                <th className="text-right">アイテム</th>
                <th className="text-right">メンバー</th>
                <th className="text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayedWorkspaces.map((ws) => (
                <tr key={ws.workspaceId} className="hover">
                  <td>
                    {ws.isMember ? (
                      <Link
                        href={`/workspaces/${ws.workspaceCode}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        {ws.genreIcon && (
                          <img src={`/icons/genres/${ws.genreIcon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{ws.workspaceName}</span>
                        {ws.mode === 'Document' && (
                          <span
                            className="icon-[mdi--file-document-outline] w-3.5 h-3.5 text-base-content/60"
                            aria-label="ドキュメントワークスペース"
                          />
                        )}
                        <span className="text-xs text-base-content/50 hidden sm:inline">({ws.workspaceCode})</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 text-base-content/70">
                        {ws.genreIcon && (
                          <img src={`/icons/genres/${ws.genreIcon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{ws.workspaceName}</span>
                        {ws.mode === 'Document' && (
                          <span
                            className="icon-[mdi--file-document-outline] w-3.5 h-3.5 text-base-content/60"
                            aria-label="ドキュメントワークスペース"
                          />
                        )}
                        <span className="text-xs text-base-content/50 hidden sm:inline">({ws.workspaceCode})</span>
                      </div>
                    )}
                    {ws.description && (
                      <Tooltip text={ws.description} position="top" contentClassName="max-w-64 whitespace-normal">
                        <span className="text-xs text-base-content/60 truncate block max-w-xs mt-0.5">
                          {ws.description}
                        </span>
                      </Tooltip>
                    )}
                  </td>
                  <td className="text-right">
                    <span className="badge badge-info badge-sm min-w-12 tabular-nums">{ws.inProgressCount}</span>
                  </td>
                  <td className="text-right">
                    <span className="badge badge-success badge-sm min-w-12 tabular-nums">{ws.completedCount}</span>
                  </td>
                  <td className="text-right">
                    {ws.overdueCount > 0 ? (
                      <span className="badge badge-error badge-sm min-w-12 tabular-nums">{ws.overdueCount}</span>
                    ) : (
                      <span className="text-base-content/40">0</span>
                    )}
                  </td>
                  <td className="text-right text-base-content/70">{ws.itemCount}</td>
                  <td className="text-right text-base-content/70">{ws.memberCount}</td>
                  <td className="text-center">
                    {!ws.isMember && (
                      <Tooltip text="閲覧者として参加" position="top">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline btn-primary"
                          onClick={() => handleOpenJoinModal(ws)}
                          aria-label={`${ws.workspaceName}に参加`}
                        >
                          <span className="icon-[mdi--account-plus-outline] w-4 h-4" aria-hidden="true" />
                          参加
                        </button>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* もっと見る / 折りたたむボタン */}
        {workspaces.length > INITIAL_DISPLAY_COUNT && (
          <div className="mt-3 flex justify-center">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + LOAD_MORE_COUNT)}
                className="btn btn-outline btn-sm gap-1 text-primary"
              >
                <span className="icon-[mdi--chevron-down] w-4 h-4" aria-hidden="true" />
                もっと見る
                <span className="text-base-content/60">（残り {remainingCount} 件）</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDisplayCount(INITIAL_DISPLAY_COUNT)}
                className="btn btn-soft btn-secondary btn-sm gap-1 text-base-content/60"
              >
                <span className="icon-[mdi--chevron-up] w-4 h-4" aria-hidden="true" />
                折りたたむ
              </button>
            )}
          </div>
        )}
      </div>

      {/* ワークスペース参加確認モーダル */}
      <JoinWorkspaceModal
        isOpen={joinModal.isOpen}
        workspaceName={joinModal.workspace?.workspaceName || ''}
        workspaceCode={joinModal.workspace?.workspaceCode || ''}
        onClose={handleCloseJoinModal}
        onConfirm={handleJoinWorkspace}
      />
    </section>
  );
}
