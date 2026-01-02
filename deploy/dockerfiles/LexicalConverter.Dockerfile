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

# @coati/editor をローカルパッケージとしてセットアップ
RUN mkdir -p /app/packages/coati-editor
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

# Copy LexicalConverter package.json
COPY pecus.LexicalConverter/package*.json ./

# @coati/editor をファイルプロトコルで参照するように変更して npm install
RUN sed -i 's|"@coati/editor": "\*"|"@coati/editor": "file:./packages/coati-editor"|' package.json && \
    npm install && \
    npm install @lexical/html@0.39.0

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
