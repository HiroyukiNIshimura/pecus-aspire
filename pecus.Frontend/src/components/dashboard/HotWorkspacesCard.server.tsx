import Link from 'next/link';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { DashboardHotWorkspacesResponse } from '@/connectors/api/pecus';

interface HotWorkspacesCardProps {
  /** ホットワークスペースデータ */
  data: DashboardHotWorkspacesResponse;
}

/**
 * ホットワークスペースカード
 * タスク関連アクティビティが活発なワークスペースのランキングを表示
 */
export default function HotWorkspacesCard({ data }: HotWorkspacesCardProps) {
  const { workspaces, period } = data;
  const periodLabel = period === '24h' ? '直近24時間' : '直近1週間';

  if (workspaces.length === 0) {
    return (
      <section aria-labelledby="hot-workspaces-heading" className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h2 id="hot-workspaces-heading" className="text-lg font-semibold flex items-center gap-2">
            <span className="icon-[mdi--target] w-5 h-5 text-primary" aria-hidden="true" />
            タスク集中エリア
            <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
          </h2>
          <EmptyState
            iconClass="icon-[mdi--folder-outline]"
            message={`${periodLabel}のタスク活動はありません`}
            size="sm"
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hot-workspaces-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="flex flex-col p-4 gap-1">
        <h2 id="hot-workspaces-heading" className="text-lg font-semibold flex items-center gap-2">
          <span className="icon-[mdi--target] w-5 h-5 text-primary" aria-hidden="true" />
          タスク集中エリア
          <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
        </h2>
        <p className="text-xs text-base-content/50">タスクの追加・完了が多いワークスペース</p>
        <ul className="space-y-1" aria-label="タスク活動が多いワークスペース">
          {workspaces.map((ws) => (
            <li key={ws.workspaceId}>
              <Link
                href={`/workspaces/${ws.workspaceCode}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors group"
              >
                {/* ワークスペース情報 */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {ws.genreIcon && (
                    <img
                      src={`/icons/genres/${ws.genreIcon}.svg`}
                      alt=""
                      className="w-5 h-5 flex-shrink-0 opacity-70"
                    />
                  )}
                  <span className="font-medium truncate group-hover:text-primary transition-colors">
                    {ws.workspaceName}
                  </span>
                  {ws.mode === 'Document' && (
                    <span
                      className="icon-[mdi--file-document-outline] w-4 h-4 text-base-content/60"
                      aria-label="ドキュメントワークスペース"
                    />
                  )}
                </div>

                {/* タスク統計 */}
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <div className="flex items-center gap-1 min-w-10" title="タスク追加">
                    <span className="icon-[mdi--plus-circle-outline] w-4 h-4 text-info" aria-hidden="true" />
                    <span className="font-medium tabular-nums">{ws.taskAddedCount}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-10" title="タスク完了">
                    <span className="icon-[mdi--check-circle-outline] w-4 h-4 text-success" aria-hidden="true" />
                    <span className="font-medium tabular-nums">{ws.taskCompletedCount}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
