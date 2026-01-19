export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchRecentOccurrencesPaginated } from '@/actions/agenda';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { AgendaOccurrenceResponse } from '@/connectors/api/pecus';
import AgendaPageClient from './AgendaPageClient';

export default async function AgendasPage() {
  let initialOccurrences: AgendaOccurrenceResponse[] = [];
  let initialNextCursor: string | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();
    // ユーザー認証確認（appSettings取得でOK）
    await api.profile.getApiProfileAppSettings();

    // 直近のオカレンスを取得（初回は20件）
    const result = await fetchRecentOccurrencesPaginated(20);
    if (result.success) {
      initialOccurrences = result.data.items;
      initialNextCursor = result.data.nextCursor ?? null;
    } else {
      fetchError = result.message ?? 'アジェンダの取得に失敗しました。';
    }
  } catch (error) {
    console.error('AgendasPage: failed to fetch data', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, 'データの取得に失敗しました');
  }

  return (
    <AgendaPageClient
      initialOccurrences={initialOccurrences}
      initialNextCursor={initialNextCursor}
      fetchError={fetchError}
    />
  );
}
