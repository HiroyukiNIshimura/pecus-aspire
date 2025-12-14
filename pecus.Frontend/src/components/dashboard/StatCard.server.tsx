import type { ReactNode } from 'react';

interface StatCardProps {
  /** カードのタイトル */
  title: string;
  /** メインの数値 */
  value: number;
  /** 数値の説明文 */
  description?: string;
  /** アイコンのクラス名（Iconify形式: icon-[mdi--check-circle]） */
  iconClass?: string;
  /** アイコンの色クラス */
  iconColorClass?: string;
  /** 警告表示（期限切れなど） */
  isWarning?: boolean;
  /** 追加のアクションやコンテンツ */
  children?: ReactNode;
}

/**
 * 統計カードコンポーネント
 * ダッシュボードの統計情報を表示するカード
 */
export default function StatCard({
  title,
  value,
  description,
  iconClass = 'icon-[mdi--chart-bar]',
  iconColorClass = 'text-primary',
  isWarning = false,
  children,
}: StatCardProps) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-base-content/70 font-medium">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-bold ${isWarning ? 'text-error' : 'text-base-content'}`}>
                {value.toLocaleString()}
              </span>
              {isWarning && value > 0 && (
                <span className="icon-[mdi--alert-circle] text-error w-5 h-5" aria-label="警告" />
              )}
            </div>
            {description && <p className="text-xs text-base-content/60 mt-1">{description}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-base-200 ${iconColorClass}`}>
            <span className={`${iconClass} w-6 h-6`} aria-hidden="true" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
