import Link from 'next/link';
import type { DashboardHotItemsResponse } from '@/connectors/api/pecus';

/**
 * 相対時間をフォーマット（例: "3時間前", "2日前"）
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

interface HotItemsCardProps {
  /** ホットアイテムデータ */
  data: DashboardHotItemsResponse;
}

/**
 * ホットアイテムカード
 * 直近でアクティビティが活発なアイテムのランキングを表示
 */
export default function HotItemsCard({ data }: HotItemsCardProps) {
  const { items, period } = data;
  const periodLabel = period === '24h' ? '直近24時間' : '直近1週間';

  if (items.length === 0) {
    return (
      <section aria-labelledby="hot-items-heading" className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h2 id="hot-items-heading" className="text-lg font-semibold flex items-center gap-2">
            <span className="icon-[mdi--fire] w-5 h-5 text-orange-500" aria-hidden="true" />
            ホットアイテム
            <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
          </h2>
          <div className="text-center py-6 text-base-content/60">
            <span className="icon-[mdi--file-document-outline] w-10 h-10 mb-2" aria-hidden="true" />
            <p className="text-sm">{periodLabel}のアクティビティはありません</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="hot-items-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <h2 id="hot-items-heading" className="text-lg font-semibold flex items-center gap-2 mb-3">
          <span className="icon-[mdi--fire] w-5 h-5 text-orange-500" aria-hidden="true" />
          ホットアイテム
          <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
        </h2>

        <ul className="space-y-2" aria-label="アクティビティが多いアイテム">
          {items.map((item, index) => (
            <li key={item.itemId}>
              <Link
                href={`/workspaces/${item.workspaceCode}?itemCode=${item.itemCode}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors group"
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

                {/* アイテム情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.genreIcon && (
                      <img
                        src={`/icons/genres/${item.genreIcon}.svg`}
                        alt=""
                        className="w-4 h-4 flex-shrink-0 opacity-70"
                      />
                    )}
                    <span className="font-medium truncate group-hover:text-primary transition-colors">
                      {item.itemSubject || '(無題)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-base-content/60">
                    <span className="truncate">{item.workspaceName}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{formatRelativeTime(item.lastActivityAt)}</span>
                  </div>
                </div>

                {/* アクティビティ数 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="icon-[mdi--pencil-outline] w-4 h-4 text-base-content/50" aria-hidden="true" />
                  <span className="text-sm font-medium text-primary">{item.activityCount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
