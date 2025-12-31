import { notFound, redirect } from 'next/navigation';
import { getTagDetail } from '@/actions/admin/tags';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import EditTagClient from './EditTagClient';

export const dynamic = 'force-dynamic';

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tagId = parseInt(id, 10);

  if (Number.isNaN(tagId) || tagId <= 0) {
    notFound();
  }

  let tagDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

    const tagResult = await getTagDetail(tagId);
    if (tagResult.success) {
      tagDetail = tagResult.data;
    } else {
      fetchError = tagResult.error;
    }
  } catch (error) {
    console.error('EditTagPage: failed to fetch tag', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, 'データの取得中にエラーが発生しました。');
  }

  if (!tagDetail) {
    notFound();
  }

  return <EditTagClient tagDetail={tagDetail} fetchError={fetchError} />;
}
