import { notFound, redirect } from 'next/navigation';
import {
  detect401ValidationError,
  detect403ValidationError,
  detect404ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';

/**
 * Server Component用のフェッチ結果型
 */
export type ServerFetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: 'forbidden'; message: string }
  | { success: false; error: 'fetch-error'; message: string };

/**
 * Server Component用の共通エラーハンドラー
 *
 * 401 → /signin へリダイレクト（自動）
 * 403 → 権限エラーとして結果を返す
 * 404 → Next.js の notFound() を呼び出し
 * その他 → フェッチエラーとして結果を返す
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const result = await handleServerFetch(() =>
 *     api.admin.getOrganizations()
 *   );
 *
 *   if (!result.success) {
 *     if (result.error === 'forbidden') {
 *       return <ForbiddenError />;
 *     }
 *     return <FetchError message={result.message} />;
 *   }
 *
 *   return <AdminClient data={result.data} />;
 * }
 * ```
 */
export async function handleServerFetch<T>(fetchFn: () => Promise<T>): Promise<ServerFetchResult<T>> {
  try {
    const data = await fetchFn();
    return { success: true, data };
  } catch (error) {
    // 401: 認証エラー → サインインページへリダイレクト
    const unauthorizedError = detect401ValidationError(error);
    if (unauthorizedError) {
      redirect('/signin');
    }

    // 403: 権限エラー → 結果として返す（ページ内で表示）
    const forbiddenError = detect403ValidationError(error);
    if (forbiddenError) {
      return {
        success: false,
        error: 'forbidden',
        message: forbiddenError.message,
      };
    }

    // 404: Not Found → Next.js の notFound() を呼び出し
    const notFoundError = detect404ValidationError(error);
    if (notFoundError) {
      notFound();
    }

    // その他のエラー → フェッチエラーとして返す
    return {
      success: false,
      error: 'fetch-error',
      message: getUserSafeErrorMessage(error, 'データの取得に失敗しました'),
    };
  }
}

/**
 * 複数のフェッチを並列実行し、いずれかが失敗した場合はエラーを返す
 *
 * @example
 * ```tsx
 * const result = await handleServerFetchAll({
 *   organizations: () => api.admin.getOrganizations(),
 *   users: () => api.admin.getUsers(),
 * });
 *
 * if (!result.success) {
 *   return <FetchError message={result.message} />;
 * }
 *
 * const { organizations, users } = result.data;
 * ```
 */
export async function handleServerFetchAll<T extends Record<string, () => Promise<unknown>>>(
  fetchers: T,
): Promise<ServerFetchResult<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }>> {
  const keys = Object.keys(fetchers) as (keyof T)[];
  const promises = keys.map((key) => fetchers[key]());

  try {
    const results = await Promise.all(promises);
    const data = {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> };

    keys.forEach((key, index) => {
      data[key] = results[index] as Awaited<ReturnType<T[typeof key]>>;
    });

    return { success: true, data };
  } catch (error) {
    // 401: 認証エラー → サインインページへリダイレクト
    const unauthorizedError = detect401ValidationError(error);
    if (unauthorizedError) {
      redirect('/signin');
    }

    // 403: 権限エラー → 結果として返す
    const forbiddenError = detect403ValidationError(error);
    if (forbiddenError) {
      return {
        success: false,
        error: 'forbidden',
        message: forbiddenError.message,
      };
    }

    // 404: Not Found → Next.js の notFound() を呼び出し
    const notFoundError = detect404ValidationError(error);
    if (notFoundError) {
      notFound();
    }

    // その他のエラー
    return {
      success: false,
      error: 'fetch-error',
      message: getUserSafeErrorMessage(error, 'データの取得に失敗しました'),
    };
  }
}
