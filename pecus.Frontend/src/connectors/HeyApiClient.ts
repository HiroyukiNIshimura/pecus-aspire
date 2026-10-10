'use server';

import { getApiBaseUrl } from '@/libs/env';
import { getAccessToken } from './api/auth';
import type { AppPublicSettingsResponse } from './api/pecus';
import {
  getApiAchievements,
  getApiAchievementsRanking,
  getApiAdminExternalApiKeys,
  getApiAdminOrganization,
  getApiAdminSkills,
  getApiAdminTags,
  getApiAdminWorkspaces,
  getApiAdminWorkspacesById,
  getApiBackendMonitoringHangfireStats,
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
  getApiMasterSkills,
  getApiMasterTaskTypes,
  getApiProfile,
  getApiProfileAppSettings,
  getApiProfileDevices,
  getApiProfileEmailPending,
  getApiWorkspaces,
  getApiWorkspacesById,
  getApiWorkspacesByWorkspaceIdItems,
  getApiWorkspacesByWorkspaceIdItemsByItemId,
  getApiWorkspacesCodeByCode,
  getApiWorkspacesStatistics,
} from './hey-api-axios';
import { type Client, createClient } from './hey-api-axios/client';
import type {
  GetApiAchievementsRankingResponse,
  GetApiAchievementsResponse,
  GetApiAdminExternalApiKeysResponse,
  GetApiAdminOrganizationResponse,
  GetApiAdminSkillsResponse,
  GetApiAdminTagsResponse,
  GetApiAdminWorkspacesByIdResponse,
  GetApiAdminWorkspacesResponse,
  GetApiBackendMonitoringHangfireStatsResponse,
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
  GetApiMasterSkillsResponse,
  GetApiMasterTaskTypesResponse,
  GetApiProfileDevicesResponse,
  GetApiProfileResponse,
  GetApiWorkspacesByIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsByItemIdResponse,
  GetApiWorkspacesByWorkspaceIdItemsResponse,
  GetApiWorkspacesCodeByCodeResponse,
  GetApiWorkspacesResponse,
  GetApiWorkspacesStatisticsResponse,
  PendingEmailChangeResponse,
  TaskPriority,
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
export async function getAchievementsRankingWithHeyApi(): Promise<GetApiAchievementsRankingResponse> {
  const client = await createHeyApiClient();
  const response = await getApiAchievementsRanking({
    client,
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
