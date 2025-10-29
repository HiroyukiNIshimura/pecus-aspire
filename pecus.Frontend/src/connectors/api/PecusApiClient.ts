
import * as PecusApis from "./pecus";
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, refreshAccessToken } from "./auth";

// 主要なAPIクラスをインポートして型安全にする
import {
  Configuration,
  EntranceAuthApi,
  EntranceOrganizationApi,
  EntrancePasswordApi,
  ProfileApi,
  RefreshApi,
  WorkspaceItemApi,
  WorkspaceItemAttachmentApi,
  WorkspaceItemPinApi,
  WorkspaceItemRelationApi,
  WorkspaceItemTagApi,
  TagApi,
  AdminUserApi,
  AdminOrganizationApi,
  AdminWorkspaceApi,
  BackendGenreApi,
  BackendHangfireTestApi,
  BackendOrganizationApi,
  BackendPermissionApi,
  BackendRoleApi,
  BackendSpecsApi,
  FileDownloadApi,
  FileUploadApi,
  TestEmailApi,
} from "./pecus";

// axiosインスタンスを作成（インターセプター付き）
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });

  // リクエストインターセプター: アクセストークンをAuthorizationヘッダーにセット
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // トークンがない場合はヘッダーをセットしない（ログインエンドポイントなど）
    }
    return config;
  });

  // レスポンスインターセプター: 401エラー時にトークンをリフレッシュしてリトライ
  instance.interceptors.response.use(
    (response: AxiosResponse) => response, // 成功時はそのまま
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // 無限ループ防止
        try {
          const newToken = await refreshAccessToken();
          // 新しいトークンでリクエストを再送
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // リフレッシュ失敗時はエラーを投げる（ログアウト処理など追加可能）
          throw refreshError;
        }
      }
      throw error;
    }
  );

  return instance;
};

export function createPecusApiClients() {
  const axiosInstance = createAxiosInstance();
  const config = new PecusApis.Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
    // accessTokenはインターセプターで自動設定するため不要
  });

  return {
    // Entrance APIs
    entranceAuth: new EntranceAuthApi(config, undefined, axiosInstance),
    entranceOrganization: new EntranceOrganizationApi(config, undefined, axiosInstance),
    entrancePassword: new EntrancePasswordApi(config, undefined, axiosInstance),

    // Profile and Refresh
    profile: new ProfileApi(config, undefined, axiosInstance),
    refresh: new RefreshApi(config, undefined, axiosInstance),

    // Workspace Item APIs
    workspaceItem: new WorkspaceItemApi(config, undefined, axiosInstance),
    workspaceItemAttachment: new WorkspaceItemAttachmentApi(config, undefined, axiosInstance),
    workspaceItemPin: new WorkspaceItemPinApi(config, undefined, axiosInstance),
    workspaceItemRelation: new WorkspaceItemRelationApi(config, undefined, axiosInstance),
    workspaceItemTag: new WorkspaceItemTagApi(config, undefined, axiosInstance),

    // Tag
    tag: new TagApi(config, undefined, axiosInstance),

    // Admin APIs
    adminUser: new AdminUserApi(config, undefined, axiosInstance),
    adminOrganization: new AdminOrganizationApi(config, undefined, axiosInstance),
    adminWorkspace: new AdminWorkspaceApi(config, undefined, axiosInstance),

    // Backend APIs
    backendGenre: new BackendGenreApi(config, undefined, axiosInstance),
    backendHangfireTest: new BackendHangfireTestApi(config, undefined, axiosInstance),
    backendOrganization: new BackendOrganizationApi(config, undefined, axiosInstance),
    backendPermission: new BackendPermissionApi(config, undefined, axiosInstance),
    backendRole: new BackendRoleApi(config, undefined, axiosInstance),
    backendSpecs: new BackendSpecsApi(config, undefined, axiosInstance),

    // File APIs
    fileDownload: new FileDownloadApi(config, undefined, axiosInstance),
    fileUpload: new FileUploadApi(config, undefined, axiosInstance),

    // Test
    testEmail: new TestEmailApi(config, undefined, axiosInstance),
  };
}
