'use server';

import { getApiBaseUrl } from '@/libs/env';
import { getAccessToken } from './api/auth';
import { getApiAchievements } from './hey-api-axios';
import { type Client, createClient } from './hey-api-axios/client';
import type { GetApiAchievementsResponse } from './hey-api-axios/types.gen';

/**
 * Hey API Axios client for migration experiments.
 *
 * This client is intentionally separate from the existing API client until
 * authentication and error behavior are verified.
 */
export async function createHeyApiExperimentalClient(): Promise<Client> {
  return createClient({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    throwOnError: true,
    auth: async () => (await getAccessToken()) ?? undefined,
  });
}

/**
 * Read-only migration probe for the generated Hey API client.
 */
export async function getAchievementsWithHeyApi(): Promise<GetApiAchievementsResponse> {
  const client = await createHeyApiExperimentalClient();
  const response = await getApiAchievements({
    client,
    throwOnError: true,
  });

  return response.data;
}
