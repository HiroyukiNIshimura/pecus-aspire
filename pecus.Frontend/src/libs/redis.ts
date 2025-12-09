import Redis, { type RedisOptions } from 'ioredis';

// Aspire から提供される接続文字列を取得
// 形式: "localhost:port,password=xxx" または "host:port,password=xxx"
const REDIS_CONNECTION_STRING = process.env.ConnectionStrings__redisFrontend;

if (!REDIS_CONNECTION_STRING) {
  throw new Error('環境変数 ConnectionStrings__redisFrontend が設定されていません');
}

/**
 * Aspire の Redis 接続文字列をパースする
 * 形式: "host:port,password=xxx" または "host:port,password=xxx,ssl=true"
 */
function parseRedisConnectionString(connectionString: string): RedisOptions {
  const parts = connectionString.split(',');
  const hostPort = parts[0];
  const [host, portStr] = hostPort.split(':');
  const port = Number.parseInt(portStr || '6379', 10);

  if (Number.isNaN(port)) {
    throw new Error(`Redis接続文字列のポート番号が不正です: ${portStr}`);
  }

  const options: RedisOptions = {
    host,
    port,
  };

  // その他のオプションをパース (password=xxx, ssl=true など)
  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    if (key === 'password') {
      options.password = value;
    } else if (key === 'ssl' && value === 'true') {
      options.tls = {};
    }
  }

  return options;
}

const parsedOptions = parseRedisConnectionString(REDIS_CONNECTION_STRING);

// シングルトンインスタンスを保持
let redisInstance: Redis | null = null;

/**
 * Redisクライアントのオプション設定
 */
const redisOptions: RedisOptions = {
  ...parsedOptions,
  // 再接続時の設定
  retryStrategy: (times: number) => {
    // 最大10回まで再接続を試行
    if (times > 10) {
      console.error('Redis connection failed after 10 retries');
      return null; // 再接続を停止
    }
    // 指数バックオフで再接続間隔を設定（最大3秒）
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  // 接続タイムアウト
  connectTimeout: 10000,
  // コマンドタイムアウト
  commandTimeout: 5000,
  // 最大再接続回数
  maxRetriesPerRequest: 3,
  // 接続が切れた場合にエラーをスローする
  enableOfflineQueue: true,
};

/**
 * Redisクライアントのシングルトンインスタンスを取得
 * Next.jsのホットリロード時にインスタンスが重複作成されることを防ぐ
 */
export function getRedisClient(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  redisInstance = new Redis(redisOptions);

  // 接続イベントのハンドリング
  redisInstance.on('connect', () => {
    console.log(`Redis connected to ${parsedOptions.host}:${parsedOptions.port}`);
  });

  redisInstance.on('ready', () => {
    console.log('Redis client is ready');
  });

  redisInstance.on('error', (err: Error) => {
    console.error('Redis client error:', err.message);
  });

  redisInstance.on('close', () => {
    console.log('Redis connection closed');
  });

  redisInstance.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
  });

  return redisInstance;
}

/**
 * Redisクライアントを安全に終了
 */
export async function closeRedisClient(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    console.log('Redis client closed gracefully');
  }
}

/**
 * Redisの接続状態を確認
 */
export async function isRedisConnected(): Promise<boolean> {
  if (!redisInstance) {
    return false;
  }
  try {
    const pong = await redisInstance.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

// 開発環境でのホットリロード対策
// グローバルにインスタンスを保持してホットリロード時の再作成を防ぐ
declare global {
  var __redisClient: Redis | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (globalThis.__redisClient) {
    redisInstance = globalThis.__redisClient;
  }
}

// グローバルインスタンスの更新用ヘルパー
export function initRedisClient(): Redis {
  const client = getRedisClient();
  if (process.env.NODE_ENV === 'development') {
    globalThis.__redisClient = client;
  }
  return client;
}

// デフォルトエクスポート - 即座に使用可能なクライアント
export default getRedisClient();
