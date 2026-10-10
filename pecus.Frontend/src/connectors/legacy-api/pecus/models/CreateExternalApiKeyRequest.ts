/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalApiKeyRole } from './ExternalApiKeyRole';
/**
 * APIキー発行リクエスト
 */
export type CreateExternalApiKeyRequest = {
  /**
   * キー名（用途識別用）
   */
  name: string;
  role: ExternalApiKeyRole;
  expirationDays?: number | null;
};
