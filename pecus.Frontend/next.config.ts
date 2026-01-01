import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: 'build',
  output: 'standalone', // Docker デプロイ用
  turbopack: {
    root: __dirname, // pecus.Frontend をルートとして明示指定
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
      allowedOrigins: [process.env.NEXT_ALLOW_DOMAIN || 'localhost'],
    },
  },
};

export default nextConfig;
