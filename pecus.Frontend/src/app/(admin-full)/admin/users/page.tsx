import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError } from '@/connectors/api/PecusApiClient';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー管理ページ（SSR）
 *
 * NOTE: ユーザー一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 */
export default async function AdminUsers() {
  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();
  } catch (error) {
    console.error('AdminUsers: failed to fetch user', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }
  }

  return <AdminUsersClient />;
}
