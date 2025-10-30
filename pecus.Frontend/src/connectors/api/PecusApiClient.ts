import * as PecusApis from "./pecus";
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, refreshAccessToken } from "./auth";

// 主要なAPIクラスをインポートして型安全にする
import {
  Configuration,
  AdminOrganizationApi,
  AdminUserApi,
  AdminWorkspaceApi,
  BackendGenreApi,
  BackendHangfireTestApi,
  BackendOrganizationApi,
  BackendPermissionApi,
  BackendRoleApi,
  BackendSpecsApi,
  EntranceAuthApi,
  EntranceOrganizationApi,
  EntrancePasswordApi,
  FileDownloadApi,
  FileUploadApi,
  ProfileApi,
  RefreshApi,
  TagApi,
  TestEmailApi,
  WorkspaceItemApi,
  WorkspaceItemAttachmentApi,
  WorkspaceItemPinApi,
  WorkspaceItemRelationApi,
  WorkspaceItemTagApi
} from "./pecus";

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
  const config = new PecusApis.Configuration({
    basePath: process.env.API_BASE_URL || 'https://localhost:7265',
  });

  return {
    adminOrganization: new PecusApis.AdminOrganizationApi(config, undefined, axiosInstance),
    adminUser: new PecusApis.AdminUserApi(config, undefined, axiosInstance),
    adminWorkspace: new PecusApis.AdminWorkspaceApi(config, undefined, axiosInstance),
    backendGenre: new PecusApis.BackendGenreApi(config, undefined, axiosInstance),
    backendHangfireTest: new PecusApis.BackendHangfireTestApi(config, undefined, axiosInstance),
    backendOrganization: new PecusApis.BackendOrganizationApi(config, undefined, axiosInstance),
    backendPermission: new PecusApis.BackendPermissionApi(config, undefined, axiosInstance),
    backendRole: new PecusApis.BackendRoleApi(config, undefined, axiosInstance),
    backendSpecs: new PecusApis.BackendSpecsApi(config, undefined, axiosInstance),
    entranceAuth: new PecusApis.EntranceAuthApi(config, undefined, axiosInstance),
    entranceOrganization: new PecusApis.EntranceOrganizationApi(config, undefined, axiosInstance),
    entrancePassword: new PecusApis.EntrancePasswordApi(config, undefined, axiosInstance),
    fileDownload: new PecusApis.FileDownloadApi(config, undefined, axiosInstance),
    fileUpload: new PecusApis.FileUploadApi(config, undefined, axiosInstance),
    profile: new PecusApis.ProfileApi(config, undefined, axiosInstance),
    refresh: new PecusApis.RefreshApi(config, undefined, axiosInstance),
    tag: new PecusApis.TagApi(config, undefined, axiosInstance),
    testEmail: new PecusApis.TestEmailApi(config, undefined, axiosInstance),
    workspaceItem: new PecusApis.WorkspaceItemApi(config, undefined, axiosInstance),
    workspaceItemAttachment: new PecusApis.WorkspaceItemAttachmentApi(config, undefined, axiosInstance),
    workspaceItemPin: new PecusApis.WorkspaceItemPinApi(config, undefined, axiosInstance),
    workspaceItemRelation: new PecusApis.WorkspaceItemRelationApi(config, undefined, axiosInstance),
    workspaceItemTag: new PecusApis.WorkspaceItemTagApi(config, undefined, axiosInstance),
  };
}

