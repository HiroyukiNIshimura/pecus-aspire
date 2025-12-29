#!/usr/bin/env node
/**
 * config/settings.base.json から各プロジェクト用の appsettings.json を生成するスクリプト
 *
 * 使い方:
 *   node scripts/generate-appsettings.js           # base のみ
 *   node scripts/generate-appsettings.js -D        # base + settings.base.dev.json をマージ
 *   node scripts/generate-appsettings.js -P        # base + settings.base.prod.json をマージ
 *   node scripts/generate-appsettings.js --env dev # 上記 -D と同じ
 *
 * 環境変数で値を上書き可能（本番用）:
 *   POSTGRES_USERNAME, POSTGRES_PASSWORD, FRONTEND_URL, LEXICAL_CONVERTER_URL, DATA_BASE_PATH
 *   SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME
 *   AI_PROVIDER, AI_MODEL, AI_API_KEY
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
  // Parameters
  if (process.env.POSTGRES_USERNAME) {
    config._parameters.username = process.env.POSTGRES_USERNAME;
  }
  if (process.env.POSTGRES_PASSWORD) {
    config._parameters.password = process.env.POSTGRES_PASSWORD;
  }
  if (process.env.DATA_BASE_PATH) {
    config._parameters.dataBasePath = process.env.DATA_BASE_PATH;
  }

  // Frontend & LexicalConverter
  if (process.env.FRONTEND_URL) {
    config._shared.Frontend.Endpoint = process.env.FRONTEND_URL;
  }
  if (process.env.LEXICAL_CONVERTER_URL) {
    config._shared.LexicalConverter.Endpoint = process.env.LEXICAL_CONVERTER_URL;
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

  // WeeklyReport (BackFire only)
  if (process.env.WEEKLY_REPORT_DASHBOARD_URL) {
    config.backfire.WeeklyReport.DashboardBaseUrl = process.env.WEEKLY_REPORT_DASHBOARD_URL;
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

  const { _comment, _parameters, _shared, ...projects } = config;

  // pecus.AppHost/appsettings.json
  const appHostConfig = {
    Parameters: _parameters,
  };
  const appHostPath = path.join(ROOT_DIR, 'pecus.AppHost', 'appsettings.json');
  fs.writeFileSync(appHostPath, JSON.stringify(appHostConfig, null, 2) + '\n');
  console.log('Generated:', appHostPath);

  // pecus.WebApi/appsettings.json
  const webapiConfig = deepMerge(_shared, projects.webapi);
  const webapiPath = path.join(ROOT_DIR, 'pecus.WebApi', 'appsettings.json');
  fs.writeFileSync(webapiPath, JSON.stringify(webapiConfig, null, 2) + '\n');
  console.log('Generated:', webapiPath);

  // pecus.BackFire/appsettings.json
  const backfireConfig = deepMerge(_shared, projects.backfire);
  const backfirePath = path.join(ROOT_DIR, 'pecus.BackFire', 'appsettings.json');
  fs.writeFileSync(backfirePath, JSON.stringify(backfireConfig, null, 2) + '\n');
  console.log('Generated:', backfirePath);

  // pecus.DbManager/appsettings.json
  const dbmanagerConfig = projects.dbmanager;
  const dbmanagerPath = path.join(ROOT_DIR, 'pecus.DbManager', 'appsettings.json');
  fs.writeFileSync(dbmanagerPath, JSON.stringify(dbmanagerConfig, null, 2) + '\n');
  console.log('Generated:', dbmanagerPath);

  console.log('\nDone! Generated 4 appsettings.json files.');
}

generate();
