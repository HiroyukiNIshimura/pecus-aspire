import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { getProfileWithHeyApi } from '@/connectors/HeyApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー管理ページ（SSR）
 *
 * NOTE: ユーザー一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 */
export default async function AdminUsers() {
  const result = await handleServerFetch(getProfileWithHeyApi);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <AdminUsersClient />;
}
