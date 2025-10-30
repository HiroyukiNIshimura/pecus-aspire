#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * PecusApiClient.ts を自動生成するスクリプト
 * pecus/apis/ ディレクトリから API クラスを検出して生成します
 */

const PECUS_APIS_DIR = path.join(__dirname, '..', 'src', 'connectors', 'api', 'pecus', 'apis');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'connectors', 'api', 'PecusApiClient.ts');

// API クラス名をファイル名から生成
function getApiClassName(fileName) {
  // .ts 拡張子を除去
  return fileName.replace('.ts', '');
}

// インポート文を生成
function generateImports(apiClasses) {
  let imports = `import * as PecusApis from "./pecus";
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAccessToken, refreshAccessToken } from "./auth";

// 主要なAPIクラスをインポートして型安全にする
import {
  Configuration,
`;

  // Configuration の後に API クラスを追加
  apiClasses.forEach((className, index) => {
    imports += `  ${className}`;
    if (index < apiClasses.length - 1) {
      imports += ',';
    }
    imports += '\n';
  });

  imports += `} from "./pecus";

`;

  return imports;
}

// axios インスタンス作成関数を生成
function generateCreateAxiosInstance() {
  return `// axiosインスタンスを作成（インターセプター付き）
const createAxiosInstance = (enableRefresh: boolean = true): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.API_BASE_URL || 'https://localhost:7265',
  });

  // リクエストインターセプター: アクセストークンをAuthorizationヘッダーにセット
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = \`Bearer \${token}\`;
      }
    } catch (error) {
      // トークンがない場合はヘッダーをセットしない（ログインエンドポイントなど）
    }
    return config;
  });

  // レスポンスインターセプター: 401エラー時の処理
  if (enableRefresh) {
    // トークンリフレッシュを試みる（クライアントサイド・サーバーサイド共通）
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
            try {
            const result = await refreshAccessToken();
            const newToken = result.accessToken;
            originalRequest.headers.Authorization = \`Bearer \${newToken}\`;
            return instance(originalRequest);
          } catch (refreshError) {
            throw error; // 元の401エラーを投げる
          }
        }
        throw error;
      }
    );
  }

  return instance;
};

`;
}

// createPecusApiClients 関数を生成
function generateCreatePecusApiClients(apiClasses) {
  let code = `export function createPecusApiClients() {
  // サーバーサイドでもトークンリフレッシュを有効にする
  const enableRefresh = true;
  const axiosInstance = createAxiosInstance(enableRefresh);
  const config = new PecusApis.Configuration({
    basePath: process.env.API_BASE_URL || 'https://localhost:7265',
  });

  return {
`;

  // API インスタンスを生成
  apiClasses.forEach((className) => {
    // クラス名からプロパティ名を生成（例: AdminOrganizationApi -> adminOrganization）
    let propertyName = className.charAt(0).toLowerCase() + className.slice(1);
    // 'Api' 接尾辞を除去
    if (propertyName.endsWith('Api')) {
      propertyName = propertyName.slice(0, -3);
    }
    code += `    ${propertyName}: new ${className}(config, undefined, axiosInstance),\n`;
  });

  code += `  };
}

`;

  return code;
}

// メイン処理
function main() {
  try {
    console.log('🔍 Scanning pecus/apis directory...');

    // apis ディレクトリのファイルを取得
    const files = fs.readdirSync(PECUS_APIS_DIR)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
      .sort();

    console.log(`📋 Found ${files.length} API files:`);
    files.forEach(file => console.log(`  - ${file}`));

    // API クラス名を生成
    const apiClasses = files.map(getApiClassName);
    console.log(`🏗️  Generated ${apiClasses.length} API class names`);

    // ファイル内容を生成
    let content = '';
    content += generateImports(apiClasses);
    content += generateCreateAxiosInstance();
    content += generateCreatePecusApiClients(apiClasses);

    // ファイルを書き込み
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

    console.log(`✅ PecusApiClient.ts generated successfully at: ${OUTPUT_FILE}`);
    console.log(`📊 Generated ${apiClasses.length} API client instances`);

  } catch (error) {
    console.error('❌ Error generating PecusApiClient.ts:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main };