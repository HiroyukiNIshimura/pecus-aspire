import type { NextConfig } from "next";
import path from "node:path";

// Next.js 設定ファイルは pecus.Frontend ディレクトリから実行される
const projectRoot = process.cwd();
const workspaceRoot = path.resolve(projectRoot, '..');

const nextConfig: NextConfig = {
  /* config options here */
  distDir: 'build',
  output: 'standalone', // Docker デプロイ用
  turbopack: {
    // モノレポのルートを指定して、packages/coati-editor などの
    // ワークスペースパッケージを正しく解決する
    root: workspaceRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
      allowedOrigins: [process.env.NEXT_ALLOW_DOMAIN || 'localhost'],
    },
  },
};

export default nextConfig;
