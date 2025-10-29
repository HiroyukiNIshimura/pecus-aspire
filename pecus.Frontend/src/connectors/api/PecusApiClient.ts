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

// axiosインスタンスを作成（インターセプター付き）
const createAxiosInstance = (enableRefresh: boolean = true): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.API_BASE_URL || 'https://localhost:7265',
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

  // レスポンスインターセプター: 401エラー時の処理
  if (enableRefresh) {
    // トークンリフレッシュを試みる（クライアントサイド・サーバーサイド共通）
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            throw error; // 元の401エラーを投げる
          }
        }
        throw error;
      }
    );
  }

  return instance;
};

export function createPecusApiClients() {
  // サーバーサイドでもトークンリフレッシュを有効にする
  const enableRefresh = true;
  const axiosInstance = createAxiosInstance(enableRefresh);
  const config = new PecusApis.Configuration({
    basePath: process.env.API_BASE_URL || 'https://localhost:7265',
  });

  return {
    adminOrganization: new AdminOrganizationApi(config, undefined, axiosInstance),
    adminUser: new AdminUserApi(config, undefined, axiosInstance),
    adminWorkspace: new AdminWorkspaceApi(config, undefined, axiosInstance),
    backendGenre: new BackendGenreApi(config, undefined, axiosInstance),
    backendHangfireTest: new BackendHangfireTestApi(config, undefined, axiosInstance),
    backendOrganization: new BackendOrganizationApi(config, undefined, axiosInstance),
    backendPermission: new BackendPermissionApi(config, undefined, axiosInstance),
    backendRole: new BackendRoleApi(config, undefined, axiosInstance),
    backendSpecs: new BackendSpecsApi(config, undefined, axiosInstance),
    entranceAuth: new EntranceAuthApi(config, undefined, axiosInstance),
    entranceOrganization: new EntranceOrganizationApi(config, undefined, axiosInstance),
    entrancePassword: new EntrancePasswordApi(config, undefined, axiosInstance),
    fileDownload: new FileDownloadApi(config, undefined, axiosInstance),
    fileUpload: new FileUploadApi(config, undefined, axiosInstance),
    profile: new ProfileApi(config, undefined, axiosInstance),
    refresh: new RefreshApi(config, undefined, axiosInstance),
    tag: new TagApi(config, undefined, axiosInstance),
    testEmail: new TestEmailApi(config, undefined, axiosInstance),
    workspaceItem: new WorkspaceItemApi(config, undefined, axiosInstance),
    workspaceItemAttachment: new WorkspaceItemAttachmentApi(config, undefined, axiosInstance),
    workspaceItemPin: new WorkspaceItemPinApi(config, undefined, axiosInstance),
    workspaceItemRelation: new WorkspaceItemRelationApi(config, undefined, axiosInstance),
    workspaceItemTag: new WorkspaceItemTagApi(config, undefined, axiosInstance),
  };
}

