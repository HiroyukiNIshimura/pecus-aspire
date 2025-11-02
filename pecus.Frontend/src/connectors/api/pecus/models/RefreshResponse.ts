/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * リフレッシュレスポンス
 */
export type RefreshResponse = {
  /**
   * JWTアクセストークン
   */
  accessToken: string | null;
  /**
   * トークンタイプ（常に "Bearer"）
   */
  tokenType?: string | null;
  /**
   * トークンの有効期限（UTC）
   */
  expiresAt?: string;
  /**
   * トークンの有効時間（秒）
   */
  expiresIn?: number;
  /**
   * リフレッシュトークン
   */
  refreshToken: string | null;
  /**
   * リフレッシュトークンの有効期限（UTC）
   */
  refreshExpiresAt?: string;
};
