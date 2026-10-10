'use server';

import { getApiBaseUrl } from '@/libs/env';
import { getAccessToken } from './auth';
import {
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
  getApiAdminWorkspaces,
  getApiAdminWorkspacesById,
  getApiBackendMonitoringHangfireStats,
  getApiBackofficeNotifications,
  getApiBackofficeNotificationsById,
  getApiBackofficeOrganizations,
  getApiBackofficeOrganizationsById,
  getApiBackofficeOrganizationsByIdBots,
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
  getApiProfile,
  getApiProfileAppSettings,
  getApiProfileDevices,
  getApiProfileEmailPending,
  getApiUsersByUserIdAchievements,
  getApiUsersByUserIdSkills,
  getApiWorkspaces,
  getApiWorkspacesById,
  getApiWorkspacesByWorkspaceIdItems,
  getApiWorkspacesByWorkspaceIdItemsByItemId,
  getApiWorkspacesByWorkspaceIdItemsByItemIdActivities,
  getApiWorkspacesCodeByCode,
  getApiWorkspacesStatistics,
  postApiEntranceAuthLogin,
} from './hey-api-axios';
import { type Client, createClient } from './hey-api-axios/client';
import type {
  ActivityPeriod,
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
  GetApiAdminUsersResponse,
  GetApiAdminWorkspacesByIdResponse,
  GetApiAdminWorkspacesResponse,
  GetApiBackendMonitoringHangfireStatsResponse,
  GetApiBackofficeNotificationsByIdResponse,
  GetApiBackofficeNotificationsResponse,
  GetApiBackofficeOrganizationsByIdBotsResponse,
  GetApiBackofficeOrganizationsByIdResponse,
  GetApiBackofficeOrganizationsResponse,
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
  GetApiProfileDevicesResponse,
  GetApiProfileResponse,
  GetApiUsersByUserIdAchievementsResponse,
  GetApiUsersByUserIdSkillsResponse,
  GetApiWorkspacesByIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdActivitiesResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsResponse,
  GetApiWorkspacesCodeByCodeResponse,
  GetApiWorkspacesResponse,
  GetApiWorkspacesStatisticsResponse,
  PendingEmailChangeResponse,
  PostApiEntranceAuthLoginResponse,
  TaskPriority,
} from './hey-api-axios/types.gen';
import type { AppPublicSettingsResponse } from './legacy-api/pecus';

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

export async function getAdminExternalApiKeysWithHeyApi(): Promise<GetApiAdminExternalApiKeysResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAdminExternalApiKeys({
    client,
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
