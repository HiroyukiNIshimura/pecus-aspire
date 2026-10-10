"use server";

import { getApiBaseUrl } from "@/libs/env";
import Axios, { AxiosError } from "axios";
import {
  createPecusApiClients,
  detect401ValidationError,
  detectConcurrencyError,
} from "./api/PecusApiClient";
import { getAccessToken } from "./api/auth";
import { getApiAchievements, getApiProfile } from "./hey-api-axios";
import { type Client, createClient } from "./hey-api-axios/client";
import type {
  GetApiAchievementsResponse,
  GetApiProfileResponse,
} from "./hey-api-axios/types.gen";

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

export async function getProfileWithHeyApi(): Promise<GetApiProfileResponse> {
  const client = await createHeyApiExperimentalClient();
  const response = await getApiProfile({
    client,
    throwOnError: true,
  });

  return response.data;
}

/**
 * Compare the existing and Hey API clients without changing application
 * call paths. This is intended for a manual migration check only.
 */
export async function compareAchievementsWithHeyApi() {
  const current =
    await createPecusApiClients().achievement.getApiAchievements();
  const heyApi = await getAchievementsWithHeyApi();

  return {
    current,
    heyApi,
    identical: JSON.stringify(current) === JSON.stringify(heyApi),
  };
}

export async function compareProfileWithHeyApi() {
  const current = await createPecusApiClients().profile.getApiProfile();
  const heyApi = await getProfileWithHeyApi();

  return {
    current,
    heyApi,
    identical: JSON.stringify(current) === JSON.stringify(heyApi),
  };
}

export async function probeHeyApiErrors() {
  const unauthorizedClient = createClient({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    throwOnError: true,
    auth: "invalid-token-for-hey-api-probe",
  });

  let unauthorizedError: unknown;
  try {
    await getApiProfile({
      client: unauthorizedClient,
      throwOnError: true,
    });
  } catch (error) {
    unauthorizedError = error;
  }

  const conflictError = new AxiosError("Conflict");
  Object.defineProperty(conflictError, "response", {
    value: {
      status: 409,
      data: { message: "migration probe conflict" },
    },
  });

  return {
    unauthorized: {
      isAxiosError: Axios.isAxiosError(unauthorizedError),
      status: Axios.isAxiosError(unauthorizedError)
        ? unauthorizedError.response?.status
        : undefined,
      detectedByCurrentHandler: detect401ValidationError(unauthorizedError),
    },
    conflict: {
      isAxiosError: Axios.isAxiosError(conflictError),
      status: conflictError.response?.status,
      detectedByCurrentHandler: detectConcurrencyError(conflictError) !== null,
    },
  };
}
