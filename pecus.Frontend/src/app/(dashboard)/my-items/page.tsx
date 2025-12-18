import { redirect } from 'next/navigation';
import { fetchMyItems } from '@/actions/workspaceItem';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics,
  UserDetailResponse,
} from '@/connectors/api/pecus';
import MyItemsClient from './MyItemsClient';

export const dynamic = 'force-dynamic';

export default async function MyItemsPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialItems: PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得（認証確認のため）
    userResponse = await api.profile.getApiProfile();

    // マイアイテムを取得（初回は All で取得）
    const itemsResult = await fetchMyItems(1);
    if (itemsResult.success) {
      initialItems = itemsResult.data;
    } else {
      fetchError = itemsResult.message;
    }
  } catch (error) {
    console.error('MyItemsPage: failed to fetch data', error);

    const noAuthError = detect401ValidationError(error);
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました').message;
  }

  if (!userResponse) {
    redirect('/signin');
  }

  return <MyItemsClient initialItems={initialItems} fetchError={fetchError} />;
}
