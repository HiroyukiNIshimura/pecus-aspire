import { redirect } from 'next/navigation';
import { fetchMyItems } from '@/actions/workspaceItem';
import { getProfileWithHeyApi } from '@/connectors/HeyApiClient';
import type {
  GetApiProfileResponse,
  PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics,
} from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getUserSafeErrorMessage } from '@/libs/apiError';
import MyItemsClient from './MyItemsClient';

export const dynamic = 'force-dynamic';

export default async function MyItemsPage() {
  let userResponse: GetApiProfileResponse | null = null;
  let initialItems: PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics | null = null;
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得（認証確認のため）
    userResponse = await getProfileWithHeyApi();

    // マイアイテムを取得（初回は All で取得）
    const itemsResult = await fetchMyItems({ page: 1 });
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

    fetchError = getUserSafeErrorMessage(error, 'データの取得に失敗しました');
  }

  if (!userResponse) {
    redirect('/signin');
  }

  return <MyItemsClient initialItems={initialItems} fetchError={fetchError} />;
}
