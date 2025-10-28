
import * as PecusApis from "./pecus";
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

export async function callWithAutoRefresh<T>(
  apiCall: (token: string) => Promise<T>
): Promise<T> {
  let token = await getAccessToken();
  try {
    return await apiCall(token);
  } catch (err: any) {
    // 401など認証エラー時はリフレッシュ
    if (err?.response?.status === 401) {
      token = await refreshAccessToken();
      return await apiCall(token);
    }
    throw err;
  }
}

export function createPecusApiClients(token?: string | undefined) {
  const config = new PecusApis.Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: token ? () => token : undefined,
  });

  return {
    // Entrance APIs
    entranceAuth: new EntranceAuthApi(config),
    entranceOrganization: new EntranceOrganizationApi(config),
    entrancePassword: new EntrancePasswordApi(config),

    // Profile and Refresh
    profile: new ProfileApi(config),
    refresh: new RefreshApi(config),

    // Workspace Item APIs
    workspaceItem: new WorkspaceItemApi(config),
    workspaceItemAttachment: new WorkspaceItemAttachmentApi(config),
    workspaceItemPin: new WorkspaceItemPinApi(config),
    workspaceItemRelation: new WorkspaceItemRelationApi(config),
    workspaceItemTag: new WorkspaceItemTagApi(config),

    // Tag
    tag: new TagApi(config),

    // Admin APIs
    adminUser: new AdminUserApi(config),
    adminOrganization: new AdminOrganizationApi(config),
    adminWorkspace: new AdminWorkspaceApi(config),

    // Backend APIs
    backendGenre: new BackendGenreApi(config),
    backendHangfireTest: new BackendHangfireTestApi(config),
    backendOrganization: new BackendOrganizationApi(config),
    backendPermission: new BackendPermissionApi(config),
    backendRole: new BackendRoleApi(config),
    backendSpecs: new BackendSpecsApi(config),

    // File APIs
    fileDownload: new FileDownloadApi(config),
    fileUpload: new FileUploadApi(config),

    // Test
    testEmail: new TestEmailApi(config),
  };
}
