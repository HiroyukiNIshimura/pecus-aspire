'use server';

import { getApiBaseUrl } from '@/libs/env';
import { getAccessToken } from './auth';
import {
  deleteApiAdminExternalApiKeysByKeyId,
  deleteApiAdminSkillsById,
  deleteApiAdminTagsById,
  deleteApiAdminWorkspacesById,
  deleteApiAdminWorkspacesByIdUsersByUserId,
  deleteApiBackofficeNotificationsById,
  deleteApiBackofficeOrganizationsById,
  deleteApiWorkspacesByWorkspaceIdItemsByItemIdAttachmentsByAttachmentId,
  deleteApiWorkspacesByWorkspaceIdItemsByItemIdPin,
  deleteApiWorkspacesByWorkspaceIdItemsByItemIdRelationsByRelationId,
  deleteApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId,
  getApiAchievements,
  getApiAchievementsMe,
  getApiAchievementsMeUnnotified,
  getApiAchievementsRanking,
  getApiAdminExternalApiKeys,
  getApiAdminOrganization,
  getApiAdminSkills,
  getApiAdminSkillsById,
  getApiAdminTags,
  getApiAdminTagsById,
  getApiAdminUsers,
  getApiAdminUsersById,
  getApiAdminUsersRoles,
  getApiAdminWorkspaces,
  getApiAdminWorkspacesById,
  getApiBackendMonitoringHangfireStats,
  getApiBackofficeNotifications,
  getApiBackofficeNotificationsById,
  getApiBackofficeOrganizations,
  getApiBackofficeOrganizationsById,
  getApiBackofficeOrganizationsByIdBots,
  getApiChatDmCandidates,
  getApiChatRooms,
  getApiChatRoomsByRoomId,
  getApiChatRoomsByRoomIdMessages,
  getApiChatUnreadByCategory,
  getApiDashboardHelpComments,
  getApiDashboardHotItems,
  getApiDashboardHotWorkspaces,
  getApiDashboardPersonalSummary,
  getApiDashboardSummary,
  getApiDashboardTasksByPriority,
  getApiDashboardTasksTrend,
  getApiDashboardWorkspaces,
  getApiMasterGenres,
  getApiMasterRoles,
  getApiMasterSkills,
  getApiMasterTaskTypes,
  getApiMyActivities,
  getApiMyCommitterItems,
  getApiMyCommitterWorkspaces,
  getApiMyCommitterWorkspacesByWorkspaceIdTasks,
  getApiMyTasks,
  getApiMyTaskWorkspaces,
  getApiMyTaskWorkspacesByWorkspaceIdTasks,
  getApiProfile,
  getApiProfileAppSettings,
  getApiProfileDevices,
  getApiProfileEmailPending,
  getApiUsersByUserIdAchievements,
  getApiUsersByUserIdSkills,
  getApiUsersSearch,
  getApiWorkspaces,
  getApiWorkspacesById,
  getApiWorkspacesByWorkspaceIdItems,
  getApiWorkspacesByWorkspaceIdItemsByItemId,
  getApiWorkspacesByWorkspaceIdItemsByItemIdActivities,
  getApiWorkspacesByWorkspaceIdItemsByItemIdAttachments,
  getApiWorkspacesByWorkspaceIdItemsByItemIdChildrenCount,
  getApiWorkspacesByWorkspaceIdItemsByItemIdTasks,
  getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskId,
  getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments,
  getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId,
  getApiWorkspacesByWorkspaceIdItemsByItemIdTasksSequenceBySequence,
  getApiWorkspacesByWorkspaceIdItemsCodeByCode,
  getApiWorkspacesCodeByCode,
  getApiWorkspacesStatistics,
  patchApiAdminSkillsByIdActivate,
  patchApiAdminSkillsByIdDeactivate,
  patchApiAdminTagsByIdActivate,
  patchApiAdminTagsByIdDeactivate,
  patchApiAdminWorkspacesByIdActivate,
  patchApiAdminWorkspacesByIdDeactivate,
  patchApiAdminWorkspacesByIdUsersByUserIdRole,
  patchApiWorkspacesByWorkspaceIdItemsByItemId,
  patchApiWorkspacesByWorkspaceIdItemsByItemIdAssignee,
  patchApiWorkspacesByWorkspaceIdItemsByItemIdByAttr,
  patchApiWorkspacesByWorkspaceIdItemsByItemIdStatus,
  postApiAchievementsMeByAchievementIdNotify,
  postApiAchievementsMeNotifyAll,
  postApiAdminExternalApiKeys,
  postApiAdminOrganizationAvailableModels,
  postApiAdminSkills,
  postApiAdminTags,
  postApiAdminUsersByIdRequestPasswordReset,
  postApiAdminUsersByIdResendPasswordSetup,
  postApiAdminUsersCreateWithoutPassword,
  postApiAdminWorkspaces,
  postApiAdminWorkspacesByIdUsers,
  postApiBackofficeNotifications,
  postApiBackofficeOrganizations,
  postApiBackofficeOrganizationsByIdResendCreatedEmail,
  postApiChatRoomsAi,
  postApiChatRoomsByRoomIdMessages,
  postApiChatRoomsByRoomIdTyping,
  postApiChatRoomsDm,
  postApiDashboardHealthAnalysis,
  postApiEntranceAuthLogin,
  postApiUsersWorkload,
  postApiWorkspaces,
  postApiWorkspacesByWorkspaceIdItems,
  postApiWorkspacesByWorkspaceIdItemsByItemIdPin,
  postApiWorkspacesByWorkspaceIdItemsByItemIdRelations,
  postApiWorkspacesByWorkspaceIdItemsByItemIdTasks,
  postApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments,
  postApiWorkspacesByWorkspaceIdItemsDocumentSuggestion,
  putApiAdminOrganization,
  putApiAdminOrganizationSetting,
  putApiAdminSkillsById,
  putApiAdminTagsById,
  putApiAdminUsersById,
  putApiAdminWorkspacesById,
  putApiBackofficeNotificationsById,
  putApiBackofficeOrganizationsById,
  putApiBackofficeOrganizationsByIdBotsByBotIdPersona,
  putApiChatRoomsByRoomIdRead,
  putApiWorkspacesById,
  putApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId,
} from './hey-api-axios';
import { type Client, createClient } from './hey-api-axios/client';
import type {
  ActivityPeriod,
  AppPublicSettingsResponse,
  BackOfficeBotResponse,
  BackOfficeOrganizationDetailResponse,
  ChatRoomType,
  DashboardTaskFilter,
  DeleteApiAdminExternalApiKeysByKeyIdResponse,
  DeleteApiAdminSkillsByIdResponse,
  DeleteApiAdminTagsByIdResponse,
  DeleteApiAdminWorkspacesByIdResponse,
  DeleteApiAdminWorkspacesByIdUsersByUserIdResponse,
  DeleteApiWorkspacesByWorkspaceIdItemsByItemIdPinResponse,
  DeleteApiWorkspacesByWorkspaceIdItemsByItemIdRelationsByRelationIdResponse,
  DeleteApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse,
  GetApiAchievementsMeResponse,
  GetApiAchievementsMeUnnotifiedResponse,
  GetApiAchievementsRankingResponse,
  GetApiAchievementsResponse,
  GetApiAdminExternalApiKeysResponse,
  GetApiAdminOrganizationResponse,
  GetApiAdminSkillsByIdResponse,
  GetApiAdminSkillsResponse,
  GetApiAdminTagsByIdResponse,
  GetApiAdminTagsResponse,
  GetApiAdminUsersByIdResponse,
  GetApiAdminUsersResponse,
  GetApiAdminUsersRolesResponse,
  GetApiAdminWorkspacesByIdResponse,
  GetApiAdminWorkspacesResponse,
  GetApiBackendMonitoringHangfireStatsResponse,
  GetApiBackofficeNotificationsByIdResponse,
  GetApiBackofficeNotificationsResponse,
  GetApiBackofficeOrganizationsByIdBotsResponse,
  GetApiBackofficeOrganizationsByIdResponse,
  GetApiBackofficeOrganizationsResponse,
  GetApiChatDmCandidatesResponse,
  GetApiChatRoomsByRoomIdMessagesResponse,
  GetApiChatRoomsByRoomIdResponse,
  GetApiChatRoomsResponse,
  GetApiChatUnreadByCategoryResponse,
  GetApiDashboardHelpCommentsResponse,
  GetApiDashboardHotItemsResponse,
  GetApiDashboardHotWorkspacesResponse,
  GetApiDashboardPersonalSummaryResponse,
  GetApiDashboardSummaryResponse,
  GetApiDashboardTasksByPriorityResponse,
  GetApiDashboardTasksTrendResponse,
  GetApiDashboardWorkspacesResponse,
  GetApiMasterGenresResponse,
  GetApiMasterRolesResponse,
  GetApiMasterSkillsResponse,
  GetApiMasterTaskTypesResponse,
  GetApiMyActivitiesResponse,
  GetApiMyCommitterItemsResponse,
  GetApiMyCommitterWorkspacesByWorkspaceIdTasksResponse,
  GetApiMyCommitterWorkspacesResponse,
  GetApiMyTasksResponse,
  GetApiMyTaskWorkspacesByWorkspaceIdTasksResponse,
  GetApiMyTaskWorkspacesResponse,
  GetApiProfileDevicesResponse,
  GetApiProfileResponse,
  GetApiUsersByUserIdAchievementsResponse,
  GetApiUsersByUserIdSkillsResponse,
  GetApiUsersSearchResponse,
  GetApiWorkspacesByIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdActivitiesResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdAttachmentsResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdChildrenCountResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksSequenceBySequenceResponse,
  GetApiWorkspacesByWorkspaceIdItemsCodeByCodeResponse,
  GetApiWorkspacesByWorkspaceIdItemsResponse,
  GetApiWorkspacesCodeByCodeResponse,
  GetApiWorkspacesResponse,
  GetApiWorkspacesStatisticsResponse,
  GetAvailableModelsRequest,
  GetAvailableModelsResponse,
  HealthAnalysisRequest,
  OrganizationWithAdminResponse,
  PatchApiAdminSkillsByIdActivateResponse,
  PatchApiAdminSkillsByIdDeactivateResponse,
  PatchApiAdminTagsByIdActivateResponse,
  PatchApiAdminTagsByIdDeactivateResponse,
  PatchApiAdminWorkspacesByIdActivateResponse,
  PatchApiAdminWorkspacesByIdDeactivateResponse,
  PatchApiAdminWorkspacesByIdUsersByUserIdRoleResponse,
  PatchApiWorkspacesByWorkspaceIdItemsByItemIdAssigneeResponse,
  PatchApiWorkspacesByWorkspaceIdItemsByItemIdByAttrResponse,
  PatchApiWorkspacesByWorkspaceIdItemsByItemIdResponse,
  PatchApiWorkspacesByWorkspaceIdItemsByItemIdStatusResponse,
  PendingEmailChangeResponse,
  PostApiAdminExternalApiKeysResponse,
  PostApiAdminSkillsResponse,
  PostApiAdminTagsResponse,
  PostApiAdminUsersByIdRequestPasswordResetResponse,
  PostApiAdminUsersByIdResendPasswordSetupResponse,
  PostApiAdminUsersCreateWithoutPasswordResponse,
  PostApiAdminWorkspacesByIdUsersResponse,
  PostApiAdminWorkspacesResponse,
  PostApiBackofficeNotificationsResponse,
  PostApiChatRoomsAiResponse,
  PostApiChatRoomsByRoomIdMessagesResponse,
  PostApiChatRoomsDmResponse,
  PostApiDashboardHealthAnalysisResponse,
  PostApiEntranceAuthLoginResponse,
  PostApiUsersWorkloadResponse,
  PostApiWorkspacesByWorkspaceIdItemsByItemIdPinResponse,
  PostApiWorkspacesByWorkspaceIdItemsByItemIdRelationsResponse,
  PostApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsResponse,
  PostApiWorkspacesByWorkspaceIdItemsByItemIdTasksResponse,
  PostApiWorkspacesByWorkspaceIdItemsDocumentSuggestionResponse,
  PostApiWorkspacesByWorkspaceIdItemsResponse,
  PostApiWorkspacesResponse,
  PutApiAdminOrganizationResponse,
  PutApiAdminOrganizationSettingResponse,
  PutApiAdminSkillsByIdResponse,
  PutApiAdminTagsByIdResponse,
  PutApiAdminUsersByIdResponse,
  PutApiAdminWorkspacesByIdResponse,
  PutApiBackofficeNotificationsByIdResponse,
  PutApiWorkspacesByIdResponse,
  PutApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse,
  SuccessResponse,
  TaskPriority,
  TaskStatusFilter,
  WorkspaceMode,
} from './hey-api-axios/types.gen';

function isPendingEmailChangeResponse(value: unknown): value is PendingEmailChangeResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.newEmail === 'string' &&
    typeof response.expiresAt === 'string' &&
    typeof response.createdAt === 'string'
  );
}

/**
 * Hey API Axios client.
 */
export async function createHeyApiClient(): Promise<Client> {
  return createClient({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    throwOnError: true,
    auth: async () => (await getAccessToken()) ?? undefined,
  });
}

/**
 * Get the achievement collection through Hey API.
 */
export async function getAchievementsWithHeyApi(): Promise<GetApiAchievementsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAchievements({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get achievement rankings through Hey API.
 */
export async function getAchievementsRankingWithHeyApi(
  workspaceId?: number,
): Promise<GetApiAchievementsRankingResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAchievementsRanking({
    client,
    query: { workspaceId },
    throwOnError: true,
  });

  return response.data;
}

export async function getMyAchievementsWithHeyApi(): Promise<GetApiAchievementsMeResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAchievementsMe({ client, throwOnError: true });
  return response.data;
}

export async function getUnnotifiedAchievementsWithHeyApi(): Promise<GetApiAchievementsMeUnnotifiedResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAchievementsMeUnnotified({ client, throwOnError: true });
  return response.data;
}

export async function notifyAchievementWithHeyApi(achievementId: number): Promise<void> {
  const client = await createHeyApiClient();
  await postApiAchievementsMeByAchievementIdNotify({
    client,
    path: { achievementId },
    throwOnError: true,
  });
}

export async function notifyAllAchievementsWithHeyApi(): Promise<void> {
  const client = await createHeyApiClient();
  await postApiAchievementsMeNotifyAll({
    client,
    throwOnError: true,
  });
}

export async function getItemActivitiesWithHeyApi(
  workspaceId: number,
  itemId: number,
  page = 1,
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdActivitiesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdActivities({
    client,
    path: { workspaceId, itemId },
    query: { page },
    throwOnError: true,
  });
  return response.data;
}

export async function getMyActivitiesWithHeyApi(
  page = 1,
  period?: ActivityPeriod,
): Promise<GetApiMyActivitiesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyActivities({
    client,
    query: { Page: page, Period: period },
    throwOnError: true,
  });
  return response.data;
}

export async function getMyTasksWithHeyApi(page?: number, status?: TaskStatusFilter): Promise<GetApiMyTasksResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyTasks({
    client,
    query: { Page: page, Status: status },
    throwOnError: true,
  });
  return response.data;
}

export async function getMyTaskWorkspacesWithHeyApi(): Promise<GetApiMyTaskWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyTaskWorkspaces({ client, throwOnError: true });
  return response.data;
}

export async function getMyTasksByWorkspaceWithHeyApi(
  workspaceId: number,
  filter?: DashboardTaskFilter,
): Promise<GetApiMyTaskWorkspacesByWorkspaceIdTasksResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyTaskWorkspacesByWorkspaceIdTasks({
    client,
    path: { workspaceId },
    query: { filter },
    throwOnError: true,
  });
  return response.data;
}

export async function getMyCommitterWorkspacesWithHeyApi(): Promise<GetApiMyCommitterWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyCommitterWorkspaces({ client, throwOnError: true });
  return response.data;
}

export async function getMyCommitterItemsWithHeyApi(
  page?: number,
  workspaceId?: number,
): Promise<GetApiMyCommitterItemsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyCommitterItems({
    client,
    query: { Page: page, WorkspaceId: workspaceId },
    throwOnError: true,
  });
  return response.data;
}

export async function getMyCommitterTasksByWorkspaceWithHeyApi(
  workspaceId: number,
  filter?: DashboardTaskFilter,
): Promise<GetApiMyCommitterWorkspacesByWorkspaceIdTasksResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMyCommitterWorkspacesByWorkspaceIdTasks({
    client,
    path: { workspaceId },
    query: { filter },
    throwOnError: true,
  });
  return response.data;
}

export async function loginWithHeyApi(
  body: Parameters<typeof postApiEntranceAuthLogin>[0]['body'],
): Promise<PostApiEntranceAuthLoginResponse> {
  const client = await createHeyApiClient();
  const response = await postApiEntranceAuthLogin({
    client,
    body,
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get the current organization through Hey API.
 */
export async function getAdminOrganizationWithHeyApi(): Promise<GetApiAdminOrganizationResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminOrganization({
    client,
    throwOnError: true,
  });

  return response.data;
}

export async function updateAdminOrganizationWithHeyApi(
  body: Parameters<typeof putApiAdminOrganization>[0]['body'],
): Promise<PutApiAdminOrganizationResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminOrganization({ client, body, throwOnError: true });
  return response.data;
}

export async function updateAdminOrganizationSettingWithHeyApi(
  body: Parameters<typeof putApiAdminOrganizationSetting>[0]['body'],
): Promise<PutApiAdminOrganizationSettingResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminOrganizationSetting({ client, body, throwOnError: true });
  return response.data;
}

export async function getAvailableAdminModelsWithHeyApi(
  body: GetAvailableModelsRequest,
): Promise<GetAvailableModelsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminOrganizationAvailableModels({
    client,
    body,
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get external API keys through Hey API.
 */
export async function getAdminUsersWithHeyApi(
  page?: number,
  isActive?: boolean,
  username?: string,
  skillIds?: number[],
  skillFilterMode?: string,
): Promise<GetApiAdminUsersResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminUsers({
    client,
    query: { Page: page, IsActive: isActive, Username: username, SkillIds: skillIds, SkillFilterMode: skillFilterMode },
    throwOnError: true,
  });
  return response.data;
}

export async function getAdminUserByIdWithHeyApi(id: number): Promise<GetApiAdminUsersByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminUsersById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function getAdminUsersRolesWithHeyApi(): Promise<GetApiAdminUsersRolesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminUsersRoles({ client, throwOnError: true });
  return response.data;
}

export async function createAdminUserWithoutPasswordWithHeyApi(
  body: Parameters<typeof postApiAdminUsersCreateWithoutPassword>[0]['body'],
): Promise<PostApiAdminUsersCreateWithoutPasswordResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminUsersCreateWithoutPassword({
    client,
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateAdminUserWithHeyApi(
  id: number,
  body: Parameters<typeof putApiAdminUsersById>[0]['body'],
): Promise<PutApiAdminUsersByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminUsersById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function requestAdminUserPasswordResetWithHeyApi(
  id: number,
): Promise<PostApiAdminUsersByIdRequestPasswordResetResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminUsersByIdRequestPasswordReset({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function resendAdminUserPasswordSetupWithHeyApi(
  id: number,
): Promise<PostApiAdminUsersByIdResendPasswordSetupResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminUsersByIdResendPasswordSetup({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function searchUsersWithHeyApi(query: string, limit: number): Promise<GetApiUsersSearchResponse> {
  const client = await createHeyApiClient();
  const response = await getApiUsersSearch({
    client,
    query: { Q: query, Limit: limit },
    throwOnError: true,
  });
  return response.data;
}

export async function getUsersWorkloadWithHeyApi(userIds: number[]): Promise<PostApiUsersWorkloadResponse> {
  const client = await createHeyApiClient();
  const response = await postApiUsersWorkload({
    client,
    body: { userIds },
    throwOnError: true,
  });
  return response.data;
}

export async function getAdminExternalApiKeysWithHeyApi(): Promise<GetApiAdminExternalApiKeysResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminExternalApiKeys({
    client,
    throwOnError: true,
  });

  return response.data;
}

export async function createAdminExternalApiKeyWithHeyApi(
  body: Parameters<typeof postApiAdminExternalApiKeys>[0]['body'],
): Promise<PostApiAdminExternalApiKeysResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminExternalApiKeys({ client, body, throwOnError: true });
  return response.data;
}

export async function revokeAdminExternalApiKeyWithHeyApi(
  keyId: number,
): Promise<DeleteApiAdminExternalApiKeysByKeyIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiAdminExternalApiKeysByKeyId({
    client,
    path: { keyId },
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get the admin skill list through Hey API.
 */
export async function getAdminSkillsWithHeyApi(
  page?: number,
  isActive?: boolean,
  unusedOnly?: boolean,
  name?: string,
): Promise<GetApiAdminSkillsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminSkills({
    client,
    query: {
      Page: page,
      IsActive: isActive,
      UnusedOnly: unusedOnly,
      Name: name,
    },
    throwOnError: true,
  });

  return response.data;
}

export async function getAdminSkillByIdWithHeyApi(id: number): Promise<GetApiAdminSkillsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminSkillsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get the admin tag list through Hey API.
 */
export async function getAdminTagsWithHeyApi(
  page?: number,
  isActive?: boolean,
  unusedOnly?: boolean,
  name?: string,
): Promise<GetApiAdminTagsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminTags({
    client,
    query: {
      Page: page,
      IsActive: isActive,
      UnusedOnly: unusedOnly,
      Name: name,
    },
    throwOnError: true,
  });

  return response.data;
}

export async function getAdminTagByIdWithHeyApi(id: number): Promise<GetApiAdminTagsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminTagsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function createAdminSkillWithHeyApi(
  body: Parameters<typeof postApiAdminSkills>[0]['body'],
): Promise<PostApiAdminSkillsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminSkills({ client, body, throwOnError: true });
  return response.data;
}

export async function updateAdminSkillWithHeyApi(
  id: number,
  body: Parameters<typeof putApiAdminSkillsById>[0]['body'],
): Promise<PutApiAdminSkillsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminSkillsById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteAdminSkillWithHeyApi(id: number): Promise<DeleteApiAdminSkillsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiAdminSkillsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function activateAdminSkillWithHeyApi(id: number): Promise<PatchApiAdminSkillsByIdActivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminSkillsByIdActivate({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function deactivateAdminSkillWithHeyApi(id: number): Promise<PatchApiAdminSkillsByIdDeactivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminSkillsByIdDeactivate({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function createAdminTagWithHeyApi(
  body: Parameters<typeof postApiAdminTags>[0]['body'],
): Promise<PostApiAdminTagsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminTags({ client, body, throwOnError: true });
  return response.data;
}

export async function updateAdminTagWithHeyApi(
  id: number,
  body: Parameters<typeof putApiAdminTagsById>[0]['body'],
): Promise<PutApiAdminTagsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminTagsById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteAdminTagWithHeyApi(id: number): Promise<DeleteApiAdminTagsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiAdminTagsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function activateAdminTagWithHeyApi(id: number): Promise<PatchApiAdminTagsByIdActivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminTagsByIdActivate({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function deactivateAdminTagWithHeyApi(id: number): Promise<PatchApiAdminTagsByIdDeactivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminTagsByIdDeactivate({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get the admin workspace list through Hey API.
 */
export async function getAdminWorkspacesWithHeyApi(
  page?: number,
  isActive?: boolean,
  genreId?: number,
  name?: string,
): Promise<GetApiAdminWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminWorkspaces({
    client,
    query: {
      Page: page,
      IsActive: isActive,
      GenreId: genreId,
      Name: name,
    },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get an admin workspace by ID through Hey API.
 */
export async function getAdminWorkspaceByIdWithHeyApi(workspaceId: number): Promise<GetApiAdminWorkspacesByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminWorkspacesById({
    client,
    path: { id: workspaceId },
    throwOnError: true,
  });

  return response.data;
}

export async function createAdminWorkspaceWithHeyApi(
  body: Parameters<typeof postApiAdminWorkspaces>[0]['body'],
): Promise<PostApiAdminWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminWorkspaces({ client, body, throwOnError: true });
  return response.data;
}

export async function updateAdminWorkspaceWithHeyApi(
  id: number,
  body: Parameters<typeof putApiAdminWorkspacesById>[0]['body'],
): Promise<PutApiAdminWorkspacesByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiAdminWorkspacesById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteAdminWorkspaceWithHeyApi(id: number): Promise<DeleteApiAdminWorkspacesByIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiAdminWorkspacesById({ client, path: { id }, throwOnError: true });
  return response.data;
}

export async function activateAdminWorkspaceWithHeyApi(
  id: number,
  rowVersion: number,
): Promise<PatchApiAdminWorkspacesByIdActivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminWorkspacesByIdActivate({
    client,
    path: { id },
    body: rowVersion,
    throwOnError: true,
  });
  return response.data;
}

export async function deactivateAdminWorkspaceWithHeyApi(
  id: number,
  rowVersion: number,
): Promise<PatchApiAdminWorkspacesByIdDeactivateResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminWorkspacesByIdDeactivate({
    client,
    path: { id },
    body: rowVersion,
    throwOnError: true,
  });
  return response.data;
}

export async function addAdminWorkspaceMemberWithHeyApi(
  id: number,
  body: Parameters<typeof postApiAdminWorkspacesByIdUsers>[0]['body'],
): Promise<PostApiAdminWorkspacesByIdUsersResponse> {
  const client = await createHeyApiClient();
  const response = await postApiAdminWorkspacesByIdUsers({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function removeAdminWorkspaceMemberWithHeyApi(
  id: number,
  userId: number,
): Promise<DeleteApiAdminWorkspacesByIdUsersByUserIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiAdminWorkspacesByIdUsersByUserId({
    client,
    path: { id, userId },
    throwOnError: true,
  });
  return response.data;
}

export async function updateAdminWorkspaceMemberRoleWithHeyApi(
  id: number,
  userId: number,
  body: Parameters<typeof patchApiAdminWorkspacesByIdUsersByUserIdRole>[0]['body'],
): Promise<PatchApiAdminWorkspacesByIdUsersByUserIdRoleResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiAdminWorkspacesByIdUsersByUserIdRole({
    client,
    path: { id, userId },
    body,
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get Hangfire statistics through Hey API.
 */
export async function getHangfireStatsWithHeyApi(): Promise<GetApiBackendMonitoringHangfireStatsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackendMonitoringHangfireStats({
    client,
    throwOnError: true,
  });

  return response.data;
}

export async function getBackOfficeOrganizationsWithHeyApi(
  page?: number,
  pageSize?: number,
): Promise<GetApiBackofficeOrganizationsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackofficeOrganizations({
    client,
    query: { Page: page, PageSize: pageSize },
    throwOnError: true,
  });
  return response.data;
}

export async function getBackOfficeOrganizationByIdWithHeyApi(
  id: number,
): Promise<GetApiBackofficeOrganizationsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackofficeOrganizationsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function getBackOfficeOrganizationBotsWithHeyApi(
  id: number,
): Promise<GetApiBackofficeOrganizationsByIdBotsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackofficeOrganizationsByIdBots({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function updateBackOfficeOrganizationWithHeyApi(
  id: number,
  body: Parameters<typeof putApiBackofficeOrganizationsById>[0]['body'],
): Promise<BackOfficeOrganizationDetailResponse> {
  const client = await createHeyApiClient();
  const response = await putApiBackofficeOrganizationsById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteBackOfficeOrganizationWithHeyApi(
  id: number,
  body: Parameters<typeof deleteApiBackofficeOrganizationsById>[0]['body'],
): Promise<void> {
  const client = await createHeyApiClient();
  await deleteApiBackofficeOrganizationsById({ client, path: { id }, body, throwOnError: true });
}

export async function createBackOfficeOrganizationWithHeyApi(
  body: Parameters<typeof postApiBackofficeOrganizations>[0]['body'],
): Promise<OrganizationWithAdminResponse> {
  const client = await createHeyApiClient();
  const response = await postApiBackofficeOrganizations({ client, body, throwOnError: true });
  return response.data;
}

export async function resendBackOfficeOrganizationCreatedEmailWithHeyApi(id: number): Promise<SuccessResponse> {
  const client = await createHeyApiClient();
  const response = await postApiBackofficeOrganizationsByIdResendCreatedEmail({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function updateBackOfficeBotPersonaWithHeyApi(
  organizationId: number,
  botId: number,
  body: Parameters<typeof putApiBackofficeOrganizationsByIdBotsByBotIdPersona>[0]['body'],
): Promise<BackOfficeBotResponse> {
  const client = await createHeyApiClient();
  const response = await putApiBackofficeOrganizationsByIdBotsByBotIdPersona({
    client,
    path: { id: organizationId, botId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function getBackOfficeNotificationsWithHeyApi(
  page?: number,
  pageSize?: number,
  includeDeleted?: boolean,
): Promise<GetApiBackofficeNotificationsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackofficeNotifications({
    client,
    query: { Page: page, PageSize: pageSize, IncludeDeleted: includeDeleted },
    throwOnError: true,
  });
  return response.data;
}

export async function getBackOfficeNotificationByIdWithHeyApi(
  id: number,
): Promise<GetApiBackofficeNotificationsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiBackofficeNotificationsById({
    client,
    path: { id },
    throwOnError: true,
  });
  return response.data;
}

export async function createBackOfficeNotificationWithHeyApi(
  body: Parameters<typeof postApiBackofficeNotifications>[0]['body'],
): Promise<PostApiBackofficeNotificationsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiBackofficeNotifications({ client, body, throwOnError: true });
  return response.data;
}

export async function updateBackOfficeNotificationWithHeyApi(
  id: number,
  body: Parameters<typeof putApiBackofficeNotificationsById>[0]['body'],
): Promise<PutApiBackofficeNotificationsByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiBackofficeNotificationsById({
    client,
    path: { id },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteBackOfficeNotificationWithHeyApi(
  id: number,
  deleteMessages: boolean,
  rowVersion: number,
): Promise<void> {
  const client = await createHeyApiClient();
  await deleteApiBackofficeNotificationsById({
    client,
    path: { id },
    body: { deleteMessages, rowVersion },
    throwOnError: true,
  });
}

/**
 * Get chat unread counts by category through Hey API.
 */
export async function getChatUnreadByCategoryWithHeyApi(): Promise<GetApiChatUnreadByCategoryResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatUnreadByCategory({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get chat rooms through Hey API.
 */
export async function getChatRoomsWithHeyApi(): Promise<GetApiChatRoomsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatRooms({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get chat room details through Hey API.
 */
export async function getChatRoomByIdWithHeyApi(roomId: number): Promise<GetApiChatRoomsByRoomIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatRoomsByRoomId({
    client,
    path: { roomId },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get chat room messages through Hey API.
 */
export async function getChatRoomMessagesWithHeyApi(roomId: number): Promise<GetApiChatRoomsByRoomIdMessagesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatRoomsByRoomIdMessages({
    client,
    path: { roomId },
    throwOnError: true,
  });

  return response.data;
}

export async function getChatRoomsWithHeyApiByType(type?: ChatRoomType): Promise<GetApiChatRoomsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatRooms({ client, query: { type }, throwOnError: true });
  return response.data;
}

export async function createOrGetDmRoomWithHeyApi(
  targetUserId: Parameters<typeof postApiChatRoomsDm>[0]['body']['targetUserId'],
): Promise<PostApiChatRoomsDmResponse> {
  const client = await createHeyApiClient();
  const response = await postApiChatRoomsDm({
    client,
    body: { targetUserId },
    throwOnError: true,
  });
  return response.data;
}

export async function createOrGetAiRoomWithHeyApi(): Promise<PostApiChatRoomsAiResponse> {
  const client = await createHeyApiClient();
  const response = await postApiChatRoomsAi({ client, throwOnError: true });
  return response.data;
}

export async function getChatRoomMessagesWithHeyApiOptions(
  roomId: number,
  limit?: number,
  cursor?: number,
): Promise<GetApiChatRoomsByRoomIdMessagesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatRoomsByRoomIdMessages({
    client,
    path: { roomId },
    query: { Limit: limit, Cursor: cursor },
    throwOnError: true,
  });
  return response.data;
}

export async function sendChatMessageWithHeyApi(
  roomId: number,
  body: Parameters<typeof postApiChatRoomsByRoomIdMessages>[0]['body'],
): Promise<PostApiChatRoomsByRoomIdMessagesResponse> {
  const client = await createHeyApiClient();
  const response = await postApiChatRoomsByRoomIdMessages({
    client,
    path: { roomId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateChatReadPositionWithHeyApi(
  roomId: number,
  body: Parameters<typeof putApiChatRoomsByRoomIdRead>[0]['body'],
): Promise<void> {
  const client = await createHeyApiClient();
  await putApiChatRoomsByRoomIdRead({ client, path: { roomId }, body, throwOnError: true });
}

export async function notifyChatTypingWithHeyApi(
  roomId: number,
  body: Parameters<typeof postApiChatRoomsByRoomIdTyping>[0]['body'],
): Promise<void> {
  const client = await createHeyApiClient();
  await postApiChatRoomsByRoomIdTyping({ client, path: { roomId }, body, throwOnError: true });
}

export async function getChatDmCandidatesWithHeyApi(limit?: number): Promise<GetApiChatDmCandidatesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiChatDmCandidates({ client, query: { limit }, throwOnError: true });
  return response.data;
}

/**
 * Get the dashboard summary through Hey API.
 */
export async function getDashboardSummaryWithHeyApi(): Promise<GetApiDashboardSummaryResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardSummary({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get dashboard task counts by priority through Hey API.
 */
export async function getDashboardTasksByPriorityWithHeyApi(): Promise<GetApiDashboardTasksByPriorityResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardTasksByPriority({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the current user's dashboard summary through Hey API.
 */
export async function getDashboardPersonalSummaryWithHeyApi(): Promise<GetApiDashboardPersonalSummaryResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardPersonalSummary({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get dashboard workspace statistics through Hey API.
 */
export async function getDashboardWorkspacesWithHeyApi(): Promise<GetApiDashboardWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardWorkspaces({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get weekly dashboard task trends through Hey API.
 */
export async function getDashboardTasksTrendWithHeyApi(weeks: number): Promise<GetApiDashboardTasksTrendResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardTasksTrend({
    client,
    query: { weeks },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the dashboard's most active items through Hey API.
 */
export async function getDashboardHotItemsWithHeyApi(
  period: string,
  limit: number,
): Promise<GetApiDashboardHotItemsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardHotItems({
    client,
    query: { period, limit },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the dashboard's most active workspaces through Hey API.
 */
export async function getDashboardHotWorkspacesWithHeyApi(
  period: string,
  limit: number,
): Promise<GetApiDashboardHotWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardHotWorkspaces({
    client,
    query: { period, limit },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get dashboard help comments through Hey API.
 */
export async function getDashboardHelpCommentsWithHeyApi(): Promise<GetApiDashboardHelpCommentsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiDashboardHelpComments({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Analyze dashboard health through Hey API.
 */
export async function analyzeDashboardHealthWithHeyApi(
  body: HealthAnalysisRequest,
): Promise<PostApiDashboardHealthAnalysisResponse> {
  const client = await createHeyApiClient();
  const response = await postApiDashboardHealthAnalysis({
    client,
    body,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the current user's profile through Hey API.
 */
export async function getProfileWithHeyApi(): Promise<GetApiProfileResponse> {
  const client = await createHeyApiClient();
  const response = await getApiProfile({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get public application settings through Hey API.
 */
export async function getProfileAppSettingsWithHeyApi(): Promise<AppPublicSettingsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiProfileAppSettings({
    client,
    throwOnError: true,
  });

  return {
    ...response.data,
    user: {
      ...response.data.user,
      landingPage: response.data.user.landingPage ?? undefined,
      focusScorePriority: response.data.user.focusScorePriority ?? undefined,
      badgeVisibility: response.data.user.badgeVisibility ?? undefined,
      pendingLandingPageRecommendation: response.data.user.pendingLandingPageRecommendation ?? undefined,
    },
  } satisfies AppPublicSettingsResponse;
}

/**
 * Get the current user's connected devices through Hey API.
 */
export async function getProfileDevicesWithHeyApi(): Promise<GetApiProfileDevicesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiProfileDevices({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get workspaces through Hey API.
 */
export async function getWorkspacesWithHeyApi(): Promise<GetApiWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspaces({
    client,
    throwOnError: true,
  });

  return response.data;
}

export async function getWorkspacesWithHeyApiOptions(options: {
  page?: number;
  genreId?: number;
  name?: string;
  mode?: WorkspaceMode;
}): Promise<GetApiWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspaces({
    client,
    query: { Page: options.page, GenreId: options.genreId, Name: options.name, Mode: options.mode },
    throwOnError: true,
  });
  return response.data;
}

export async function createWorkspaceWithHeyApi(
  body: Parameters<typeof postApiWorkspaces>[0]['body'],
): Promise<PostApiWorkspacesResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspaces({ client, body, throwOnError: true });
  return response.data;
}

export async function updateWorkspaceWithHeyApi(
  workspaceId: number,
  body: Parameters<typeof putApiWorkspacesById>[0]['body'],
): Promise<PutApiWorkspacesByIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiWorkspacesById({
    client,
    path: { id: workspaceId },
    body,
    throwOnError: true,
  });
  return response.data;
}

type TaskCommentPath = {
  workspaceId: number;
  itemId: number;
  taskId: number;
};

export async function getTaskCommentsWithHeyApi(
  path: TaskCommentPath,
  query?: Parameters<typeof getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments>[0]['query'],
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments({
    client,
    path,
    query,
    throwOnError: true,
  });
  return response.data;
}

export async function getTaskCommentWithHeyApi(
  path: TaskCommentPath & { commentId: number },
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId({
    client,
    path,
    throwOnError: true,
  });
  return response.data;
}

export async function createTaskCommentWithHeyApi(
  path: TaskCommentPath,
  body: Parameters<typeof postApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments>[0]['body'],
): Promise<PostApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdComments({
    client,
    path,
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateTaskCommentWithHeyApi(
  path: TaskCommentPath & { commentId: number },
  body: Parameters<typeof putApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId>[0]['body'],
): Promise<PutApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse> {
  const client = await createHeyApiClient();
  const response = await putApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId({
    client,
    path,
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function deleteTaskCommentWithHeyApi(
  path: TaskCommentPath & { commentId: number },
  body: Parameters<typeof deleteApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId>[0]['body'],
): Promise<DeleteApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdCommentsByCommentId({
    client,
    path,
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function getWorkspaceItemAttachmentsWithHeyApi(
  workspaceId: number,
  itemId: number,
  taskId?: number,
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdAttachmentsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdAttachments({
    client,
    path: { workspaceId, itemId },
    query: { taskId },
    throwOnError: true,
  });
  return response.data;
}

export async function deleteWorkspaceItemAttachmentWithHeyApi(
  workspaceId: number,
  itemId: number,
  attachmentId: number,
): Promise<void> {
  const client = await createHeyApiClient();
  await deleteApiWorkspacesByWorkspaceIdItemsByItemIdAttachmentsByAttachmentId({
    client,
    path: { workspaceId, itemId, attachmentId },
    throwOnError: true,
  });
}

/**
 * Get workspace details by code through Hey API.
 */
export async function getWorkspaceByCodeWithHeyApi(code: string): Promise<GetApiWorkspacesCodeByCodeResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesCodeByCode({
    client,
    path: { code },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get workspace details by ID through Hey API.
 */
export async function getWorkspaceByIdWithHeyApi(workspaceId: number): Promise<GetApiWorkspacesByIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesById({
    client,
    path: { id: workspaceId },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get workspace items through Hey API.
 */
export async function getWorkspaceItemsWithHeyApi(
  workspaceId: number,
  options: {
    page?: number;
    pageSize?: number;
    isDraft?: boolean;
    isArchived?: boolean;
    assigneeId?: number;
    ownerId?: number;
    committerId?: number;
    priority?: TaskPriority;
    pinned?: boolean;
    hasDueDate?: boolean;
    hasPersonalNote?: boolean;
    searchQuery?: string;
  },
): Promise<GetApiWorkspacesByWorkspaceIdItemsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItems({
    client,
    path: { workspaceId },
    query: {
      Page: options.page,
      PageSize: options.pageSize,
      IsDraft: options.isDraft,
      IsArchived: options.isArchived,
      AssigneeId: options.assigneeId,
      OwnerId: options.ownerId,
      CommitterId: options.committerId,
      Priority: options.priority,
      Pinned: options.pinned,
      HasDueDate: options.hasDueDate,
      HasPersonalNote: options.hasPersonalNote,
      SearchQuery: options.searchQuery,
    },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get a workspace item by ID through Hey API.
 */
export async function getWorkspaceItemByIdWithHeyApi(
  workspaceId: number,
  itemId: number,
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemId({
    client,
    path: { workspaceId, itemId },
    throwOnError: true,
  });

  return response.data;
}

export async function getWorkspaceItemByCodeWithHeyApi(
  workspaceId: number,
  itemCode: string,
): Promise<GetApiWorkspacesByWorkspaceIdItemsCodeByCodeResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsCodeByCode({
    client,
    path: { workspaceId, code: itemCode },
    throwOnError: true,
  });
  return response.data;
}

export async function getWorkspaceItemChildrenCountWithHeyApi(
  workspaceId: number,
  itemId: number,
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdChildrenCountResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdChildrenCount({
    client,
    path: { workspaceId, itemId },
    throwOnError: true,
  });
  return response.data;
}

type WorkspaceTaskPath = {
  workspaceId: number;
  itemId: number;
};

export async function getWorkspaceTasksWithHeyApi(
  path: WorkspaceTaskPath,
  query?: Parameters<typeof getApiWorkspacesByWorkspaceIdItemsByItemIdTasks>[0]['query'],
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdTasks({
    client,
    path,
    query,
    throwOnError: true,
  });
  return response.data;
}

export async function getWorkspaceTaskWithHeyApi(
  path: WorkspaceTaskPath & { taskId: number },
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskIdResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdTasksByTaskId({
    client,
    path,
    throwOnError: true,
  });
  return response.data;
}

export async function getWorkspaceTaskBySequenceWithHeyApi(
  path: WorkspaceTaskPath & { sequence: number },
): Promise<GetApiWorkspacesByWorkspaceIdItemsByItemIdTasksSequenceBySequenceResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesByWorkspaceIdItemsByItemIdTasksSequenceBySequence({
    client,
    path,
    throwOnError: true,
  });
  return response.data;
}

export async function createWorkspaceTaskWithHeyApi(
  path: WorkspaceTaskPath,
  body: Parameters<typeof postApiWorkspacesByWorkspaceIdItemsByItemIdTasks>[0]['body'],
): Promise<PostApiWorkspacesByWorkspaceIdItemsByItemIdTasksResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItemsByItemIdTasks({
    client,
    path,
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function createWorkspaceItemWithHeyApi(
  workspaceId: number,
  body: Parameters<typeof postApiWorkspacesByWorkspaceIdItems>[0]['body'],
): Promise<PostApiWorkspacesByWorkspaceIdItemsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItems({
    client,
    path: { workspaceId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateWorkspaceItemWithHeyApi(
  workspaceId: number,
  itemId: number,
  body: Parameters<typeof patchApiWorkspacesByWorkspaceIdItemsByItemId>[0]['body'],
): Promise<PatchApiWorkspacesByWorkspaceIdItemsByItemIdResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiWorkspacesByWorkspaceIdItemsByItemId({
    client,
    path: { workspaceId, itemId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateWorkspaceItemStatusWithHeyApi(
  workspaceId: number,
  itemId: number,
  body: Parameters<typeof patchApiWorkspacesByWorkspaceIdItemsByItemIdStatus>[0]['body'],
): Promise<PatchApiWorkspacesByWorkspaceIdItemsByItemIdStatusResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiWorkspacesByWorkspaceIdItemsByItemIdStatus({
    client,
    path: { workspaceId, itemId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateWorkspaceItemAssigneeWithHeyApi(
  workspaceId: number,
  itemId: number,
  body: Parameters<typeof patchApiWorkspacesByWorkspaceIdItemsByItemIdAssignee>[0]['body'],
): Promise<PatchApiWorkspacesByWorkspaceIdItemsByItemIdAssigneeResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiWorkspacesByWorkspaceIdItemsByItemIdAssignee({
    client,
    path: { workspaceId, itemId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function updateWorkspaceItemAttributeWithHeyApi(
  workspaceId: number,
  itemId: number,
  attribute: string,
  body: Parameters<typeof patchApiWorkspacesByWorkspaceIdItemsByItemIdByAttr>[0]['body'],
): Promise<PatchApiWorkspacesByWorkspaceIdItemsByItemIdByAttrResponse> {
  const client = await createHeyApiClient();
  const response = await patchApiWorkspacesByWorkspaceIdItemsByItemIdByAttr({
    client,
    path: { workspaceId, itemId, attr: attribute },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function getWorkspaceItemDocumentSuggestionWithHeyApi(
  workspaceId: number,
  body: Parameters<typeof postApiWorkspacesByWorkspaceIdItemsDocumentSuggestion>[0]['body'],
): Promise<PostApiWorkspacesByWorkspaceIdItemsDocumentSuggestionResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItemsDocumentSuggestion({
    client,
    path: { workspaceId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function addWorkspaceItemPinWithHeyApi(
  workspaceId: number,
  itemId: number,
): Promise<PostApiWorkspacesByWorkspaceIdItemsByItemIdPinResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItemsByItemIdPin({
    client,
    path: { workspaceId, itemId },
    throwOnError: true,
  });
  return response.data;
}

export async function removeWorkspaceItemPinWithHeyApi(
  workspaceId: number,
  itemId: number,
): Promise<DeleteApiWorkspacesByWorkspaceIdItemsByItemIdPinResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiWorkspacesByWorkspaceIdItemsByItemIdPin({
    client,
    path: { workspaceId, itemId },
    throwOnError: true,
  });
  return response.data;
}

export async function addWorkspaceItemRelationWithHeyApi(
  workspaceId: number,
  itemId: number,
  body: Parameters<typeof postApiWorkspacesByWorkspaceIdItemsByItemIdRelations>[0]['body'],
): Promise<PostApiWorkspacesByWorkspaceIdItemsByItemIdRelationsResponse> {
  const client = await createHeyApiClient();
  const response = await postApiWorkspacesByWorkspaceIdItemsByItemIdRelations({
    client,
    path: { workspaceId, itemId },
    body,
    throwOnError: true,
  });
  return response.data;
}

export async function removeWorkspaceItemRelationWithHeyApi(
  workspaceId: number,
  itemId: number,
  relationId: number,
): Promise<DeleteApiWorkspacesByWorkspaceIdItemsByItemIdRelationsByRelationIdResponse> {
  const client = await createHeyApiClient();
  const response = await deleteApiWorkspacesByWorkspaceIdItemsByItemIdRelationsByRelationId({
    client,
    path: { workspaceId, itemId, relationId },
    throwOnError: true,
  });
  return response.data;
}

/**
 * Get a user's achievements through Hey API.
 */
export async function getUserAchievementsWithHeyApi(userId: number): Promise<GetApiUsersByUserIdAchievementsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiUsersByUserIdAchievements({
    client,
    path: { userId },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get a user's skills through Hey API.
 */
export async function getUserSkillsWithHeyApi(userId: number): Promise<GetApiUsersByUserIdSkillsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiUsersByUserIdSkills({
    client,
    path: { userId },
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get workspace statistics through Hey API.
 */
export async function getWorkspaceStatisticsWithHeyApi(): Promise<GetApiWorkspacesStatisticsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiWorkspacesStatistics({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the master skill list through Hey API.
 */
export async function getMasterSkillsWithHeyApi(): Promise<GetApiMasterSkillsResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMasterSkills({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the master genre list through Hey API.
 */
export async function getMasterGenresWithHeyApi(): Promise<GetApiMasterGenresResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMasterGenres({
    client,
    throwOnError: true,
  });

  return response.data;
}

export async function getMasterRolesWithHeyApi(): Promise<GetApiMasterRolesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMasterRoles({ client, throwOnError: true });
  return response.data;
}

/**
 * Get the master task type list through Hey API.
 */
export async function getMasterTaskTypesWithHeyApi(): Promise<GetApiMasterTaskTypesResponse> {
  const client = await createHeyApiClient();
  const response = await getApiMasterTaskTypes({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Get the pending email change through Hey API.
 */
export async function getPendingEmailChangeWithHeyApi(): Promise<PendingEmailChangeResponse | null> {
  const client = await createHeyApiClient();
  const response = await getApiProfileEmailPending({
    client,
    throwOnError: true,
  });

  const data = response.data;
  if (isPendingEmailChangeResponse(data)) {
    return data;
  }

  return null;
}
