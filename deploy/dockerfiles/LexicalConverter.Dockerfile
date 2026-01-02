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
WORKDIR /app

# Copy root package.json and lock file
COPY package.json package-lock.json ./

# Copy @coati/editor package (ビルド済み dist を含む)
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

# Copy LexicalConverter package.json
COPY pecus.LexicalConverter/package*.json ./pecus.LexicalConverter/

# Install production dependencies for LexicalConverter
RUN npm ci --workspace=pecus.LexicalConverter --omit=dev

# ============================================
# Build stage
# ============================================
FROM base AS build
WORKDIR /app

# Copy root package.json and lock file
COPY package.json package-lock.json ./

# Copy @coati/editor package (ビルド済み dist を含む)
COPY packages/coati-editor/package.json ./packages/coati-editor/
COPY packages/coati-editor/dist ./packages/coati-editor/dist

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
COPY packages/coati-editor/dist ./node_modules/@coati/editor/dist
COPY packages/coati-editor/package.json ./node_modules/@coati/editor/

# Copy production dependencies (hoisted to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy built files
COPY --from=build /app/pecus.LexicalConverter/dist ./dist

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "dist/main.js"]
