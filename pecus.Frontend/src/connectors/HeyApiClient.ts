"use server";

import { getApiBaseUrl } from "@/libs/env";
import { getAccessToken } from "./api/auth";
import { getApiAchievements } from "./hey-api-axios";
import { type Client, createClient } from "./hey-api-axios/client";
import type { GetApiAchievementsResponse } from "./hey-api-axios/types.gen";

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
