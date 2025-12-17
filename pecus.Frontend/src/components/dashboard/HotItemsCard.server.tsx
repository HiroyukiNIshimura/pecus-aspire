import Link from 'next/link';
import type { DashboardHotItemsResponse } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

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
      <div className="card-body p-4 gap-1">
        <h2 id="hot-items-heading" className="text-lg font-semibold flex items-center gap-2">
          <span className="icon-[mdi--fire] w-5 h-5 text-orange-500" aria-hidden="true" />
          ホットアイテム
          <span className="text-sm font-normal text-base-content/60 ml-auto">{periodLabel}</span>
        </h2>
        <p className="text-xs text-base-content/50">編集・更新などの操作が多いアイテム</p>
        <ul className="space-y-1" aria-label="アクティビティが多いアイテム">
          {items.map((item) => {
            const content = (
              <>
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
                    <span
                      className={`font-medium truncate transition-colors ${
                        item.canAccess ? 'group-hover:text-primary' : ''
                      }`}
                    >
                      {item.itemSubject || '(無題)'}
                    </span>
                    {!item.canAccess && (
                      <span
                        className="icon-[mdi--lock-outline] w-3.5 h-3.5 text-base-content/40 flex-shrink-0"
                        aria-label="アクセス権がありません"
                      />
                    )}
                  </div>
                  {/* ワークスペース名 */}
                  <div className="ml-6 mt-1 text-xs text-base-content/50 truncate flex items-center gap-1">
                    <span className="truncate">{item.workspaceName}</span>
                    {item.mode === 'Document' && (
                      <span
                        className="icon-[mdi--file-document-outline] w-3.5 h-3.5 text-base-content/60"
                        aria-label="ドキュメントワークスペース"
                      />
                    )}
                  </div>
                  {/* 最終アクター情報 */}
                  <div className="flex items-center gap-1.5 mt-1.5 ml-6 text-xs text-base-content/60">
                    {item.lastActorAvatar ? (
                      <img
                        src={getDisplayIconUrl(item.lastActorAvatar)}
                        alt=""
                        className="w-4 h-4 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <span
                        className="icon-[mdi--account-circle] w-4 h-4 flex-shrink-0 opacity-60"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">
                      {item.lastActorName || 'システム'}が{formatRelativeTime(item.lastActivityAt)}に
                      {item.lastActionLabel || '更新'}
                    </span>
                  </div>
                </div>

                {/* アクティビティ数バッジ */}
                <div
                  className={`flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full ${
                    item.canAccess ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/50'
                  }`}
                >
                  <span className="text-xs font-medium">{item.activityCount}回</span>
                </div>
              </>
            );

            return (
              <li key={item.itemId}>
                {item.canAccess ? (
                  <Link
                    href={`/workspaces/${item.workspaceCode}?itemCode=${item.itemCode}`}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 p-2 rounded-lg opacity-50 cursor-not-allowed">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
