# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
# ビルド済み @coati/editor/dist を使用（Docker ビルド高速化）
# ============================================

FROM node:24-alpine AS base
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
# Build stage - deps を直接継承してコピーを削減
# ============================================
FROM deps AS build

# LexicalConverter のソースをコピー（node_modules は deps から継承済み）
COPY pecus.LexicalConverter/ ./pecus.LexicalConverter/

WORKDIR /app/pecus.LexicalConverter
RUN npm run build
RUN test -f dist/main.js && test -f dist/ignore-css-loader.js

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
ENV NODE_ENV=production

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy packages (実ファイルのみ、シンボリックリンク問題を回避)
COPY --from=deps /app/packages/coati-editor/package.json ./packages/coati-editor/
COPY --from=deps /app/packages/coati-editor/dist ./packages/coati-editor/dist
COPY --from=deps /app/packages/coati-editor/node_modules ./packages/coati-editor/node_modules

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# ワークスペース固有の node_modules（バージョン競合で hoist されなかった依存、例: @nestjs/core）
COPY --from=deps /app/pecus.LexicalConverter/node_modules ./pecus.LexicalConverter/node_modules

# Copy built files
COPY --from=build /app/pecus.LexicalConverter/dist ./pecus.LexicalConverter/dist
COPY pecus.LexicalConverter/package.json ./pecus.LexicalConverter/
RUN test -f /app/pecus.LexicalConverter/dist/main.js && test -f /app/pecus.LexicalConverter/dist/ignore-css-loader.js

WORKDIR /app/pecus.LexicalConverter

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "--experimental-loader", "./dist/ignore-css-loader.js", "./dist/main.js"]
