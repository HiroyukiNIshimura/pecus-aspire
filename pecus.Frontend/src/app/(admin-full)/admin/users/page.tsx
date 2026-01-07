import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
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
  const api = createPecusApiClients();
  const result = await handleServerFetch(() => api.profile.getApiProfile());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
  }

  return <AdminUsersClient />;
}
