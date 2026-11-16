import type { LandingPage } from '@/connectors/hey-api-axios/types.gen';

/**
 * LandingPage 列挙値を URL パスに変換
 * @param landingPage ランディングページ設定（null/undefined の場合はダッシュボード）
 * @returns URL パス
 */
export function getLandingPageUrl(landingPage?: LandingPage | 'BackOffice' | null): string {
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
    case 'BackOffice':
      return '/backoffice';
    default:
      return '/';
  }
}

/**
 * ログイン後の遷移先 URL を決める
 *
 * バックオフィス利用者はランディングページ設定よりバックオフィスを優先する。
 */
export function resolvePostLoginUrl(
  roles?: Array<{ name?: string }> | null,
  landingPage?: LandingPage | 'BackOffice' | null,
): string {
  const isBackOfficeUser = roles?.some((role) => role.name === 'BackOffice') ?? false;
  return isBackOfficeUser ? '/backoffice' : getLandingPageUrl(landingPage);
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

/**
 * LandingPage 列挙値を表示名に変換
 * @param landingPage ランディングページ設定
 * @returns 表示名
 */
export function getLandingPageDisplayName(landingPage?: LandingPage | null): string {
  const option = LANDING_PAGE_OPTIONS.find((opt) => opt.value === landingPage);
  return option?.label ?? 'ダッシュボード';
}
