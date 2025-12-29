/**
 * 環境変数の統一アクセスレイヤー
 *
 * このファイルは config/settings.base.json から生成される環境変数と
 * Aspire が自動注入する環境変数を統一的に扱うためのユーティリティです。
 *
 * 優先順位:
 * 1. Aspire 環境変数 (services__pecusapi__https__0 など)
 * 2. Docker/本番環境変数 (PECUS_API_URL など)
 * 3. フォールバック値
 */

/**
 * WebAPI のベース URL を取得
 *
 * 優先順位:
 * 1. Aspire が注入する services__pecusapi__https__0
 * 2. Aspire が注入する services__pecusapi__http__0
 * 3. Docker Compose で設定される PECUS_API_URL
 * 4. フォールバック: https://localhost:7265
 */
export function getApiBaseUrl(): string {
  return (
    process.env.services__pecusapi__https__0 ||
    process.env.services__pecusapi__http__0 ||
    process.env.PECUS_API_URL ||
    'https://localhost:7265'
  );
}

/**
 * クライアントサイドで使用可能な API URL を取得
 *
 * NEXT_PUBLIC_ プレフィックスの環境変数はビルド時に埋め込まれ、
 * クライアントサイドでも参照可能。
 *
 * 優先順位:
 * 1. NEXT_PUBLIC_API_URL (ビルド時に埋め込み)
 * 2. フォールバック: https://localhost:7265
 */
export function getPublicApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7265';
}

/**
 * Redis 接続文字列を取得
 *
 * 優先順位:
 * 1. Aspire が注入する ConnectionStrings__redisFrontend
 * 2. Docker Compose で設定される REDIS_URL
 *
 * @throws 環境変数が設定されていない場合
 */
export function getRedisConnectionString(): string {
  const connectionString = process.env.ConnectionStrings__redisFrontend || process.env.REDIS_URL;

  if (!connectionString) {
    throw new Error('環境変数 ConnectionStrings__redisFrontend または REDIS_URL が設定されていません');
  }

  return connectionString;
}

/**
 * 現在の実行環境を判定
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
}

/**
 * Aspire 環境で実行中かどうかを判定
 */
export function isAspireEnvironment(): boolean {
  return !!(
    process.env.services__pecusapi__https__0 ||
    process.env.services__pecusapi__http__0 ||
    process.env.ConnectionStrings__redisFrontend
  );
}

/**
 * Docker 環境で実行中かどうかを判定
 */
export function isDockerEnvironment(): boolean {
  return !!(process.env.PECUS_API_URL || process.env.REDIS_URL);
}
