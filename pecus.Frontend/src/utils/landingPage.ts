import type { LandingPage } from '@/connectors/api/pecus';

/**
 * LandingPage 列挙値を URL パスに変換
 * @param landingPage ランディングページ設定（null/undefined の場合はダッシュボード）
 * @returns URL パス
 */
export function getLandingPageUrl(landingPage?: LandingPage | null): string {
  switch (landingPage) {
    case 'Dashboard':
      return '/';
    case 'Workspace':
      return '/workspaces';
    case 'MyItems':
      return '/my-items';
    case 'Tasks':
      return '/tasks';
    case 'Committer':
      return '/committer';
    default:
      return '/';
  }
}

/**
 * ランディングページの選択肢一覧
 */
export const LANDING_PAGE_OPTIONS: { value: NonNullable<LandingPage>; label: string }[] = [
  { value: 'Dashboard', label: 'ダッシュボード' },
  { value: 'Workspace', label: 'マイワークスペース' },
  { value: 'MyItems', label: 'マイアイテム' },
  { value: 'Tasks', label: 'タスク' },
  { value: 'Committer', label: 'コミッター' },
];
