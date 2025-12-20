'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DashboardWorkspaceBreakdownResponse } from '@/connectors/api/pecus';

/** 初期表示件数 */
const INITIAL_DISPLAY_COUNT = 5;
/** もっと見るで追加する件数 */
const LOAD_MORE_COUNT = 10;

interface WorkspaceBreakdownTableProps {
  /** ワークスペース別統計データ */
  data: DashboardWorkspaceBreakdownResponse;
}

/**
 * ワークスペース別統計テーブル
 * 各ワークスペースのタスク・アイテム状況を一覧表示
 */
export default function WorkspaceBreakdownTable({ data }: WorkspaceBreakdownTableProps) {
  const { workspaces } = data;
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const displayedWorkspaces = workspaces.slice(0, displayCount);
  const hasMore = workspaces.length > displayCount;
  const remainingCount = workspaces.length - displayCount;

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
              </tr>
            </thead>
            <tbody>
              {displayedWorkspaces.map((ws) => (
                <tr key={ws.workspaceId} className="hover">
                  <td>
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
    </section>
  );
}
