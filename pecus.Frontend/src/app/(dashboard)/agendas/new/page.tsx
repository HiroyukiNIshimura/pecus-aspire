export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getProfileAppSettingsWithHeyApi } from '@/connectors/HeyApiClient';
import { detect401ValidationError } from '@/connectors/legacy-api/PecusApiClient';
import AgendaFormClient from './AgendaFormClient';

export default async function NewAgendaPage() {
  try {
    // 認証確認
    await getProfileAppSettingsWithHeyApi();

    // 現在のユーザーID取得
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data) {
      redirect('/signin');
    }

    return <AgendaFormClient mode="create" currentUserId={userResult.data.id} />;
  } catch (error) {
    console.error('NewAgendaPage: failed to verify auth', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }

    redirect('/agendas');
  }
}
