# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
# ビルド済み @coati/editor/dist を使用（Docker ビルド高速化）
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Build stage
# ============================================
FROM base AS build
WORKDIR /app

# Copy LexicalConverter package.json (workspace から独立してインストール)
COPY pecus.LexicalConverter/package*.json ./

# @coati/editor をローカルパッケージとしてセットアップ
COPY packages/coati-editor/package.json ./node_modules/@coati/editor/
COPY packages/coati-editor/dist ./node_modules/@coati/editor/dist

# package.json から @coati/editor の参照を削除して npm install
# （@coati/editor は既に node_modules にコピー済み）
RUN sed -i '/"@coati\/editor"/d' package.json && npm install

COPY pecus.LexicalConverter/ ./
RUN npm run build

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
ENV NODE_ENV=production

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy all dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy built files
COPY --from=build /app/dist ./dist

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "dist/main.js"]
