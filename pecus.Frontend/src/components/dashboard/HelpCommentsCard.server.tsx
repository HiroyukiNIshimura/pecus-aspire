import Link from 'next/link';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { DashboardHelpCommentsResponse } from '@/connectors/api/pecus';
import { formatRelativeTime } from '@/libs/utils/date';

/**
 * コメント内容を省略表示（最大100文字）
 */
function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return `${content.substring(0, maxLength)}...`;
}

interface HelpCommentsCardProps {
  /** ヘルプコメントデータ */
  data: DashboardHelpCommentsResponse;
}

/**
 * ヘルプコメントカード
 * HelpWantedタイプのコメント一覧を表示
 */
export default function HelpCommentsCard({ data }: HelpCommentsCardProps) {
  const { comments, totalCount } = data;

  if (comments.length === 0) {
    return (
      <section aria-labelledby="help-comments-heading" className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <h2 id="help-comments-heading" className="text-lg font-semibold flex items-center gap-2">
            <span className="icon-[mdi--hand-wave-outline] w-5 h-5 text-warning" aria-hidden="true" />
            ヘルプリクエスト
            <span className="text-sm font-normal text-base-content/60 ml-auto">0件</span>
          </h2>
          <EmptyState iconClass="icon-[mdi--comment-check-outline]" message="ヘルプリクエストはありません" size="sm" />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="help-comments-heading" className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4 gap-1">
        <h2 id="help-comments-heading" className="text-lg font-semibold flex items-center gap-2">
          <span className="icon-[mdi--hand-wave-outline] w-5 h-5 text-warning" aria-hidden="true" />
          ヘルプリクエスト
          <span className="text-sm font-normal text-base-content/60 ml-auto">{totalCount}件</span>
        </h2>
        <p className="text-xs text-base-content/50">助けを求めているタスクコメント</p>

        <ul className="space-y-3 mt-2" aria-label="ヘルプリクエスト一覧">
          {comments.map((comment) => (
            <li key={comment.commentId}>
              <Link
                href={`/workspaces/${comment.workspaceCode}?itemCode=${comment.itemCode}&task=${comment.taskSequence}`}
                className="block p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors group"
              >
                {/* コメント内容 */}
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="icon-[mdi--comment-alert-outline] w-4 h-4 text-warning flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-base-content/90 leading-relaxed">{truncateContent(comment.content)}</p>
                </div>

                {/* タスク情報 */}
                <div className="ml-6 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                    <span className="icon-[mdi--checkbox-marked-outline] w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-primary font-semibold">T-{comment.taskSequence}</span>
                    <span className="truncate">{truncateContent(comment.taskContent, 50)}</span>
                  </div>
                </div>

                {/* アイテム・ワークスペース情報 */}
                <div className="ml-6 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-base-content/50">
                    <span className="icon-[mdi--file-document-outline] w-3.5 h-3.5" aria-hidden="true" />
                    <span className="truncate">
                      {comment.itemCode}: {comment.itemSubject || '(無題)'}
                    </span>
                    <span className="mx-1">•</span>
                    <span className="truncate">{comment.workspaceName}</span>
                  </div>
                </div>

                {/* 投稿者情報 */}
                <div className="flex items-center justify-between ml-6">
                  <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                    <UserAvatar
                      userName={comment.commentBy?.username}
                      identityIconUrl={comment.commentBy?.identityIconUrl}
                      size={16}
                      showName={true}
                      nameClassName="text-xs"
                    />
                    <span className="mx-1">•</span>
                    <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
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
