#!/usr/bin/env node
/**
 * config/settings.base.json から各プロジェクト用の appsettings.json と deploy/.env を生成するスクリプト
 *
 * 使い方:
 *   node scripts/generate-appsettings.js           # base のみ（開発用）
 *   node scripts/generate-appsettings.js -D        # base + settings.base.dev.json をマージ
 *   node scripts/generate-appsettings.js -P        # base + settings.base.prod.json をマージ（本番用）
 *   node scripts/generate-appsettings.js --env dev # 上記 -D と同じ
 *
 * 生成されるファイル:
 *   - pecus.AppHost/appsettings.json   (Aspire 開発環境用)
 *   - pecus.WebApi/appsettings.json
 *   - pecus.BackFire/appsettings.json
 *   - pecus.DbManager/appsettings.json
 *   - deploy/.env                      (Docker Compose 本番環境用、-P 指定時のみ)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const BASE_CONFIG_PATH = path.join(CONFIG_DIR, 'settings.base.json');

function parseArgs() {
  const args = process.argv.slice(2);
  let env = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-D' || args[i] === '--dev') {
      env = 'dev';
    } else if (args[i] === '-P' || args[i] === '--prod') {
      env = 'prod';
    } else if (args[i] === '--env' && args[i + 1]) {
      env = args[i + 1];
      i++;
    }
  }

  return { env };
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function applyEnvOverrides(config) {
  // Infrastructure (PostgreSQL)
  if (process.env.POSTGRES_USER) {
    config._infrastructure.postgres.user = process.env.POSTGRES_USER;
  }
  if (process.env.POSTGRES_PASSWORD) {
    config._infrastructure.postgres.password = process.env.POSTGRES_PASSWORD;
  }
  if (process.env.DATA_PATH) {
    config._infrastructure.dataPath = process.env.DATA_PATH;
  }

  // URLs
  if (process.env.FRONTEND_URL) {
    config._infrastructure.urls.frontend = process.env.FRONTEND_URL;
  }
  if (process.env.WEBAPI_PUBLIC_URL) {
    config._infrastructure.urls.webapiPublic = process.env.WEBAPI_PUBLIC_URL;
  }

  // Ports
  if (process.env.WEBAPI_PORT) {
    config._infrastructure.ports.webapi = parseInt(process.env.WEBAPI_PORT, 10);
  }
  if (process.env.FRONTEND_PORT) {
    config._infrastructure.ports.frontend = parseInt(process.env.FRONTEND_PORT, 10);
  }

  // Email
  if (process.env.SMTP_HOST) {
    config._shared.Email.SmtpHost = process.env.SMTP_HOST;
  }
  if (process.env.SMTP_PORT) {
    config._shared.Email.SmtpPort = parseInt(process.env.SMTP_PORT, 10);
  }
  if (process.env.SMTP_USERNAME) {
    config._shared.Email.Username = process.env.SMTP_USERNAME;
  }
  if (process.env.SMTP_PASSWORD) {
    config._shared.Email.Password = process.env.SMTP_PASSWORD;
  }
  if (process.env.SMTP_FROM_EMAIL) {
    config._shared.Email.FromEmail = process.env.SMTP_FROM_EMAIL;
  }
  if (process.env.SMTP_FROM_NAME) {
    config._shared.Email.FromName = process.env.SMTP_FROM_NAME;
  }

  // Default AI
  if (process.env.AI_PROVIDER) {
    config._shared.DefaultAi.Provider = process.env.AI_PROVIDER;
  }
  if (process.env.AI_MODEL) {
    config._shared.DefaultAi.Model = process.env.AI_MODEL;
  }
  if (process.env.AI_API_KEY) {
    config._shared.DefaultAi.ApiKey = process.env.AI_API_KEY;
  }

  // JWT (WebApi only)
  if (process.env.JWT_ISSUER_SIGNING_KEY) {
    config.webapi.Pecus.Jwt.IssuerSigningKey = process.env.JWT_ISSUER_SIGNING_KEY;
  }
  if (process.env.JWT_VALID_ISSUER) {
    config.webapi.Pecus.Jwt.ValidIssuer = process.env.JWT_VALID_ISSUER;
  }
  if (process.env.JWT_VALID_AUDIENCE) {
    config.webapi.Pecus.Jwt.ValidAudience = process.env.JWT_VALID_AUDIENCE;
  }

  return config;
}

function loadConfig(env) {
  console.log('Reading base config from:', BASE_CONFIG_PATH);

  if (!fs.existsSync(BASE_CONFIG_PATH)) {
    console.error('Error: config/settings.base.json not found');
    process.exit(1);
  }

  let config = JSON.parse(fs.readFileSync(BASE_CONFIG_PATH, 'utf8'));

  // 環境別オーバーライドファイルをマージ
  if (env) {
    const overridePath = path.join(CONFIG_DIR, `settings.base.${env}.json`);
    if (fs.existsSync(overridePath)) {
      console.log(`Merging override config: ${overridePath}`);
      const override = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
      config = deepMerge(config, override);
    } else {
      console.warn(`Warning: Override file not found: ${overridePath}`);
    }
  }

  // 環境変数で上書き（最優先）
  config = applyEnvOverrides(config);

  return config;
}

function generate() {
  const { env } = parseArgs();

  if (env) {
    console.log(`Environment: ${env}`);
  }

  const config = loadConfig(env);

  const { _comment, _infrastructure, _shared, ...projects } = config;

  // pecus.AppHost/appsettings.json (Aspire 開発環境用)
  const appHostConfig = {
    Infrastructure: _infrastructure,
  };
  const appHostPath = path.join(ROOT_DIR, 'pecus.AppHost', 'appsettings.json');
  fs.writeFileSync(appHostPath, JSON.stringify(appHostConfig, null, 2) + '\n');
  console.log('Generated:', appHostPath);

  // pecus.WebApi/appsettings.json
  // _shared.Application を Pecus.Application にマージ
  const { Application: sharedApplication, ...restShared } = _shared;
  const webapiConfig = {
    ...restShared,
    ...projects.webapi,
    Pecus: {
      ...projects.webapi.Pecus,
      Application: sharedApplication,
    },
    // Frontend URL を追加
    Frontend: {
      Endpoint: _infrastructure.urls.frontend,
    },
  };
  const webapiPath = path.join(ROOT_DIR, 'pecus.WebApi', 'appsettings.json');
  fs.writeFileSync(webapiPath, JSON.stringify(webapiConfig, null, 2) + '\n');
  console.log('Generated:', webapiPath);

  // pecus.BackFire/appsettings.json
  const backfireConfig = {
    ...restShared,
    ...projects.backfire,
    Pecus: {
      Application: sharedApplication,
    },
    // Frontend URL を追加
    Frontend: {
      Endpoint: _infrastructure.urls.frontend,
    },
  };
  const backfirePath = path.join(ROOT_DIR, 'pecus.BackFire', 'appsettings.json');
  fs.writeFileSync(backfirePath, JSON.stringify(backfireConfig, null, 2) + '\n');
  console.log('Generated:', backfirePath);

  // pecus.DbManager/appsettings.json
  const dbmanagerConfig = {
    ...projects.dbmanager,
    LexicalConverter: _shared.LexicalConverter,
  };
  const dbmanagerPath = path.join(ROOT_DIR, 'pecus.DbManager', 'appsettings.json');
  fs.writeFileSync(dbmanagerPath, JSON.stringify(dbmanagerConfig, null, 2) + '\n');
  console.log('Generated:', dbmanagerPath);

  // pecus.Frontend/.env.local
  // 開発環境・本番環境ともに生成（Next.js ビルド時に NEXT_PUBLIC_* を埋め込むために必要）
  generateFrontendEnv(_infrastructure, env);

  // deploy/.env (本番用、-P 指定時のみ生成)
  if (env === 'prod') {
    generateDockerEnv(_infrastructure, _shared, projects);
  }

  // 生成ファイル数をカウント
  const baseCount = 5; // AppHost, WebApi, BackFire, DbManager, Frontend .env.local
  const dockerEnvCount = env === 'prod' ? 2 : 0; // deploy/.env
  const totalCount = baseCount + dockerEnvCount;

  console.log(`\nDone! Generated ${totalCount} files.`);
}

/**
 * Docker Compose 用の .env ファイルを生成
 */
function generateDockerEnv(infra, _shared, _projects) {
  const docker = infra.docker || {};
  const lexicalConverterPort = infra.ports.lexicalConverter || 5100;
  const nginxHttpPort = process.env.NGINX_HTTP_PORT || '80';
  const backupKeepDays = process.env.BACKUP_KEEP_DAYS || '14';

  const lines = [
    '# ============================================',
    '# Generated from config/settings.base.prod.json',
    '# Do NOT edit this file directly!',
    '# ============================================',
    '',
    '# PostgreSQL',
    `POSTGRES_USER=${infra.postgres.user}`,
    `POSTGRES_PASSWORD=${infra.postgres.password}`,
    `POSTGRES_DB=${infra.postgres.db}`,
    '',
    '# Data Path (host directory for volumes)',
    `DATA_PATH=${infra.dataPath}`,
    '',
    '# Ports (external)',
    `WEBAPI_PORT=${infra.ports.webapi}`,
    `FRONTEND_PORT=${infra.ports.frontend}`,
    '',
    '# URLs (public)',
    `FRONTEND_URL=${infra.urls.frontend}`,
    `NEXT_PUBLIC_API_URL=${infra.urls.webapiPublic}`,
    '',
    '# API URL (server-side SSR/Server Actions)',
    `PECUS_API_URL=${infra.urls.webapiInternal || `http://${docker.webapiHost || 'pecusapi'}:${infra.ports.webapi}`}`,
    '',
    '# Redis Ports',
    `REDIS_PORT=${infra.redis.port}`,
    `REDIS_FRONTEND_PORT=${infra.redisFrontend.port}`,
    '',
    '# Docker internal hosts and URLs',
    `LEXICAL_CONVERTER_URL=http://${docker.lexicalConverterHost || 'lexicalconverter'}:${lexicalConverterPort}`,
    `POSTGRES_HOST=${docker.postgresHost || 'postgres'}`,
    `REDIS_HOST=${docker.redisHost || 'redis'}`,
    `REDIS_FRONTEND_HOST=${docker.redisFrontendHost || 'redis-frontend'}`,
    `WEBAPI_HOST=${docker.webapiHost || 'pecusapi'}`,
    '',
    '# Frontend Redis URL (redis:// format for Docker environment)',
    '# Docker 内部通信は常にポート 6379 を使用（redisFrontend.port はホストマッピング用）',
    `REDIS_URL=redis://${docker.redisFrontendHost || 'redis-frontend'}:6379`,
    '',

    '# Optional: Nginx public port (blue/green switch only)',
    `NGINX_HTTP_PORT=${nginxHttpPort}`,
    '',

    '# Optional: Postgres backup retention days',
    `BACKUP_KEEP_DAYS=${backupKeepDays}`,
    '',
  ];

  const deployEnvPath = path.join(ROOT_DIR, 'deploy', '.env');
  fs.writeFileSync(deployEnvPath, lines.join('\n') + '\n');
  console.log('Generated:', deployEnvPath);
}

/**
 * Frontend 用の .env.local ファイルを生成
 * Aspire 未使用時（Next.js 単体開発）のフォールバック用
 * @param {object} infra - インフラ設定
 * @param {string|null} env - 環境 ('dev' | 'prod' | null)
 */
function generateFrontendEnv(infra, env) {
  const isDev = env === 'dev' || env === null; // dev または未指定の場合は開発環境扱い

  const lines = [
    '# ============================================',
    '# Generated from config/settings.base.json',
    '# Do NOT edit this file directly!',
    '# ============================================',
    '# This file is used when running Next.js standalone (without Aspire)',
    '# In Aspire environment, these values are automatically injected',
    '',
  ];

  // 開発環境のみ: 自己署名証明書を許可
  if (isDev) {
    lines.push(
      '# Development: Allow self-signed certificates (Aspire uses HTTPS with self-signed certs)',
      'NODE_TLS_REJECT_UNAUTHORIZED=0',
      '',
    );
  }

  lines.push(
    '# APP DOMAIN (server-side, used by next.config.ts)',
    `NEXT_ALLOW_DOMAIN=${infra.urls.allowDomain || 'localhost'}`,
    '',
    '# API URL (server-side, used by src/libs/env.ts)',
    `PECUS_API_URL=${infra.urls.webapiPublic}`,
    '',
    '# API URL (client-side, embedded at build time)',
    `NEXT_PUBLIC_API_URL=${infra.urls.webapiPublic}`,
    '',
  );

  // Redis 接続設定は開発環境のみ
  // 本番環境では Docker Compose が REDIS_URL を環境変数として注入するため不要
  if (isDev) {
    lines.push(
      '# Redis connection (Aspire format: host:port)',
      `ConnectionStrings__redisFrontend=localhost:${infra.redisFrontend.port}`,
      '',
    );
  }

  const envPath = path.join(ROOT_DIR, 'pecus.Frontend', '.env.local');
  fs.writeFileSync(envPath, lines.join('\n') + '\n');
  console.log('Generated:', envPath);
}

generate();
