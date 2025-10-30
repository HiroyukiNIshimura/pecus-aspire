import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getAccessToken } from "./auth";
import { createApiClientInstances } from "./PecusApiClient.generated";

/**
 * axios インスタンスを作成（インターセプター付き）
 *
 * Middleware対応版:
 * - SSR: Middlewareが事前にトークンを検証・リフレッシュするため、インターセプターは不要
 * - CSR: クライアントサイドの動的API呼び出し時のみインターセプターが動作
 *
 * Server Actions から呼ばれる場合:
 * - enableRefresh=false を推奨（Middlewareに任せる）
 * - リクエストごとに新しいインスタンスが作成される
 */
const createAxiosInstance = (enableRefresh: boolean = true): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.API_BASE_URL || 'https://localhost:7265',
  });

  // インスタンスごとのリフレッシュPromise（同一インスタンス内での競合を防ぐ）
  let refreshPromise: Promise<{ accessToken: string; persisted: boolean }> | null = null;
  const RETRY_FLAG = '__pecus_retry';

  // リクエストインターセプター
  instance.interceptors.request.use(
    async (config) => {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // レスポンスインターセプター（クライアントサイドのみ）
  if (enableRefresh && typeof window !== 'undefined') {
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config as any;
        const status = error.response?.status;
        const wwwAuth = error.response?.headers?.['www-authenticate'] || '';

        // アクセストークン期限切れ判定:
        // - ステータスコード: 401
        // - www-authenticateヘッダーに'Bearer error="invalid_token"'が存在
        // - まだリトライしていない
        const isTokenExpired =
          status === 401 &&
          wwwAuth.toLowerCase().includes('bearer') &&
          wwwAuth.toLowerCase().includes('invalid_token');

        if (isTokenExpired && !originalRequest[RETRY_FLAG]) {
          // インスタンスレベルのリフレッシュPromiseを使用
          if (!refreshPromise) {
            // 動的インポートでServer Actionを呼び出し（クライアントサイド専用）
            const { refreshAccessToken: refreshFn } = await import('./auth');
            refreshPromise = refreshFn()
              .finally(() => {
                refreshPromise = null;
              });
          }

          // リフレッシュ処理を待って再試行
          return refreshPromise
            .then((result: { accessToken: string; persisted: boolean }) => {
              // 新しいトークンで再試行
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
              originalRequest[RETRY_FLAG] = true;

              // 再試行リクエストを返す
              return instance(originalRequest);
            })
            .catch((refreshError: unknown) => {
              console.error('[PecusApiClient] Token refresh failed:', refreshError);
              // クライアントサイドでリフレッシュ失敗時はログインページへリダイレクト
              if (typeof window !== 'undefined') {
                window.location.href = '/signin';
              }
              return Promise.reject(error);
            });
        }

        // トークン期限切れでない401エラーはそのまま返す
        return Promise.reject(error);
      }
    );
  }

  return instance;
};

export function createPecusApiClients(enableRefresh: boolean = true) {
  const axiosInstance = createAxiosInstance(enableRefresh);
  return createApiClientInstances(axiosInstance);
}

