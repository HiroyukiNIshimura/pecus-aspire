import Redis, { type RedisOptions } from 'ioredis';

// 環境変数から接続情報を取得
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

if (!REDIS_HOST) {
  throw new Error('環境変数 REDIS_HOST が設定されていません');
}

if (!REDIS_PORT) {
  throw new Error('環境変数 REDIS_PORT が設定されていません');
}

const REDIS_PORT_NUMBER = Number.parseInt(REDIS_PORT, 10);

if (Number.isNaN(REDIS_PORT_NUMBER)) {
  throw new Error(`環境変数 REDIS_PORT の値が不正です: ${REDIS_PORT}`);
}

// シングルトンインスタンスを保持
let redisInstance: Redis | null = null;

/**
 * Redisクライアントのオプション設定
 */
const redisOptions: RedisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT_NUMBER,
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
  // TLS設定（本番環境で必要に応じて設定）
  // tls: process.env.NODE_ENV === 'production' ? {} : undefined,
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
    console.log(`Redis connected to ${REDIS_HOST}:${REDIS_PORT_NUMBER}`);
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
