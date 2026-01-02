# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
# ビルド済み @coati/editor/dist を使用（Docker ビルド高速化）
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

# ルートのワークスペース設定をコピー
COPY package.json package-lock.json ./

# エディタパッケージ（ビルド済み dist を含む）
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

# LexicalConverter の package.json をコピー
COPY pecus.LexicalConverter/package.json ./pecus.LexicalConverter/

# ワークスペース全体の依存関係をインストール
RUN npm ci --workspace=pecus.LexicalConverter

# ============================================
# Build stage
# ============================================
FROM base AS build
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# LexicalConverter のソースをコピー
COPY pecus.LexicalConverter/ ./pecus.LexicalConverter/

# Build (ルートの node_modules を参照するためルートで実行)
RUN cd pecus.LexicalConverter && npm run build

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
ENV NODE_ENV=production

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy built files
COPY --from=build /app/pecus.LexicalConverter/dist ./dist

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "-e", "require.extensions['.css']=()=>{};require('./dist/main.js')"]
