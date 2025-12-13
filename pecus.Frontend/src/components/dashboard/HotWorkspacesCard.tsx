import Link from 'next/link';
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
          <div className="text-center py-6 text-base-content/60">
            <span className="icon-[mdi--folder-outline] w-10 h-10 mb-2" aria-hidden="true" />
            <p className="text-sm">{periodLabel}のタスク活動はありません</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hot-workspaces-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h2 id="hot-workspaces-heading" className="text-lg font-semibold flex items-center gap-2 mb-3">
          <span className="icon-[mdi--target] w-5 h-5 text-primary" aria-hidden="true" />
          タスク集中エリア
          <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
        </h2>

        <ul className="space-y-2" aria-label="タスク活動が多いワークスペース">
          {workspaces.map((ws, index) => (
            <li key={ws.workspaceId}>
              <Link
                href={`/workspaces/${ws.workspaceCode}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors group"
              >
                {/* ランキング番号 */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === 0
                      ? 'bg-yellow-500 text-white'
                      : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-base-300 text-base-content/70'
                  }`}
                >
                  {index + 1}
                </div>

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
                </div>

                {/* タスク統計 */}
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <div className="flex items-center gap-1" title="タスク追加">
                    <span className="icon-[mdi--plus-circle-outline] w-4 h-4 text-info" aria-hidden="true" />
                    <span className="font-medium">{ws.taskAddedCount}</span>
                  </div>
                  <div className="flex items-center gap-1" title="タスク完了">
                    <span className="icon-[mdi--check-circle-outline] w-4 h-4 text-success" aria-hidden="true" />
                    <span className="font-medium">{ws.taskCompletedCount}</span>
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
