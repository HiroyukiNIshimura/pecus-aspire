import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminSkillsClient from './AdminSkillsClient';

export const dynamic = 'force-dynamic';

/**
 * スキル管理ページ（SSR）
 *
 * NOTE: スキル一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 */
export default async function AdminSkills() {
  const api = createPecusApiClients();
  const result = await handleServerFetch(() => api.profile.getApiProfile());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <AdminSkillsClient />;
}
