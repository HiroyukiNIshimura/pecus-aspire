# ============================================
# pecus.Frontend Dockerfile (Next.js) - モノレポ対応版
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Build @coati/editor package (npm workspaces 使用)
# ============================================
FROM base AS editor-build
WORKDIR /app

# ルートの package.json と lock ファイルをコピー
COPY package.json package-lock.json ./

# coati-editor パッケージをコピー
COPY packages/coati-editor/ ./packages/coati-editor/

# ワークスペースで @coati/editor の依存関係をインストール
RUN npm ci --workspace=@coati/editor

# @coati/editor をビルド
RUN npm run build --workspace=@coati/editor

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

# ルートのワークスペース設定をコピー
COPY package.json package-lock.json ./

# エディタパッケージ（ビルド済み）
COPY --from=editor-build /app/packages/coati-editor/package.json ./packages/coati-editor/
COPY --from=editor-build /app/packages/coati-editor/dist ./packages/coati-editor/dist

# Frontend の package.json をコピー
COPY pecus.Frontend/package.json ./pecus.Frontend/

# ワークスペース全体の依存関係をインストール
RUN npm ci --workspace=pecus.Frontend

# ============================================
# Build stage
# ============================================
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/pecus.Frontend/node_modules ./pecus.Frontend/node_modules

# Frontend のソースをコピー
COPY pecus.Frontend/ ./pecus.Frontend/

# Build arguments for public env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build-time dummy values for SSR pages that check env vars
# These are only used during build, not at runtime
ENV ConnectionStrings__redisFrontend="localhost:6379"
ENV PECUS_API_URL="http://localhost:5000"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-dummy-secret"

# Build Next.js application
WORKDIR /app/pecus.Frontend
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/pecus.Frontend/public ./public

# Create .next directory with proper permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
# Note: Requires output: 'standalone' in next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/pecus.Frontend/build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/pecus.Frontend/build/static ./build/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
