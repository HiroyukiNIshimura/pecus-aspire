# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
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
WORKDIR /app

# Copy @coati/editor package (built)
COPY --from=editor-build /app/packages/coati-editor/dist ./packages/coati-editor/dist
COPY --from=editor-build /app/packages/coati-editor/package.json ./packages/coati-editor/

# Copy root package.json and lock file
COPY package.json package-lock.json ./

# Copy LexicalConverter package.json
COPY pecus.LexicalConverter/package*.json ./pecus.LexicalConverter/

# Install production dependencies for LexicalConverter
RUN npm ci --workspace=pecus.LexicalConverter --omit=dev

# ============================================
# Build stage
# ============================================
FROM base AS build
WORKDIR /app

# Copy @coati/editor package (built)
COPY --from=editor-build /app/packages/coati-editor/dist ./packages/coati-editor/dist
COPY --from=editor-build /app/packages/coati-editor/package.json ./packages/coati-editor/

# Copy root package.json and lock file
COPY package.json package-lock.json ./

# Copy LexicalConverter package.json
COPY pecus.LexicalConverter/package*.json ./pecus.LexicalConverter/

# Install all dependencies (including dev for build)
RUN npm ci --workspace=pecus.LexicalConverter

COPY pecus.LexicalConverter/ ./pecus.LexicalConverter/
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

# Copy @coati/editor package
COPY --from=editor-build /app/packages/coati-editor/dist ./node_modules/@coati/editor/dist
COPY --from=editor-build /app/packages/coati-editor/package.json ./node_modules/@coati/editor/

# Copy production dependencies
COPY --from=deps /app/pecus.LexicalConverter/node_modules ./node_modules

# Copy built files
COPY --from=build /app/pecus.LexicalConverter/dist ./dist

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "dist/main.js"]
