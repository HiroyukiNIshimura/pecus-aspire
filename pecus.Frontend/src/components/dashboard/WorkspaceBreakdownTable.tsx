import Link from 'next/link';
import type { DashboardWorkspaceBreakdownResponse } from '@/connectors/api/pecus';

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
          <div className="text-center py-8 text-base-content/60">
            <span className="icon-[mdi--folder-open-outline] w-12 h-12 mb-2" aria-hidden="true" />
            <p>ワークスペースがありません</p>
          </div>
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
              {workspaces.map((ws) => (
                <tr key={ws.workspaceId} className="hover">
                  <td>
                    <Link
                      href={`/workspaces/${ws.workspaceCode}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      {ws.genreIcon && (
                        <img src={`/icons/genres/${ws.genreIcon}.svg`} alt="" className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="font-medium">{ws.workspaceName}</span>
                      <span className="text-xs text-base-content/50 hidden sm:inline">({ws.workspaceCode})</span>
                    </Link>
                  </td>
                  <td className="text-right">
                    <span className="badge badge-info badge-sm">{ws.inProgressCount}</span>
                  </td>
                  <td className="text-right">
                    <span className="badge badge-success badge-sm">{ws.completedCount}</span>
                  </td>
                  <td className="text-right">
                    {ws.overdueCount > 0 ? (
                      <span className="badge badge-error badge-sm">{ws.overdueCount}</span>
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
      </div>
    </section>
  );
}
