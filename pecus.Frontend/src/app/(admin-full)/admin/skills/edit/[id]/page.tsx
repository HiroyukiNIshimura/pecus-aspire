import { notFound, redirect } from 'next/navigation';
import { getSkillDetail } from '@/actions/admin/skills';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import EditSkillClient from './EditSkillClient';

export const dynamic = 'force-dynamic';

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skillId = parseInt(id, 10);

  if (Number.isNaN(skillId) || skillId <= 0) {
    notFound();
  }

  let skillDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

    const skillResult = await getSkillDetail(skillId);
    if (skillResult.success) {
      skillDetail = skillResult.data;
    } else {
      fetchError = skillResult.error;
    }
  } catch (error) {
    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, 'データの取得中にエラーが発生しました。');
  }

  if (!skillDetail) {
    notFound();
  }

  return <EditSkillClient skillDetail={skillDetail} fetchError={fetchError} />;
}
