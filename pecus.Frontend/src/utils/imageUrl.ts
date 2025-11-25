/**
 * 画像URL変換ユーティリティ
 *
 * バックエンドから返される画像URLをフロントエンドのプロキシAPI経由のURLに変換します。
 */

/**
 * バックエンドの画像URLをプロキシAPI経由のURLに変換
 *
 * @param url - バックエンドから返されるURL（例: "/api/downloads/avatar/3/filename.webp"）
 * @returns プロキシAPI経由のURL（例: "/api/images/avatar/3/filename.webp"）
 *
 * @example
 * ```ts
 * const proxyUrl = toProxyImageUrl("/api/downloads/avatar/3/profile.webp");
 * // => "/api/images/avatar/3/profile.webp"
 * ```
 */
export function toProxyImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  // 既にプロキシURL形式の場合はそのまま返す
  if (url.startsWith("/api/images/")) {
    return url;
  }

  // バックエンドのダウンロードURL形式をプロキシURL形式に変換
  if (url.startsWith("/api/downloads/")) {
    return url.replace("/api/downloads/", "/api/images/");
  }

  // 外部URL（Gravatar等）はそのまま返す
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Data URL はそのまま返す
  if (url.startsWith("data:")) {
    return url;
  }

  // その他の形式はそのまま返す
  return url;
}

/**
 * アイデンティティアイコンURLを取得（プロキシ対応）
 *
 * バックエンドから返される identityIconUrl をプロキシAPI経由に変換します。
 * Gravatar等の外部URLはそのまま返します。
 *
 * @param identityIconUrl - バックエンドから返されるidentityIconUrl
 * @returns 表示用のURL
 */
export function getDisplayIconUrl(
  identityIconUrl: string | null | undefined,
): string {
  return toProxyImageUrl(identityIconUrl);
}
