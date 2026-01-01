import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: 'build',
  output: 'standalone', // Docker デプロイ用
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
      allowedOrigins: [process.env.NEXT_ALLOW_DOMAIN || 'localhost'],
    },
  },
  turbopack: {
    // モノレポ環境でのワークスペースルートを明示（警告抑止）
    root: '..',
  },
};

export default nextConfig;
