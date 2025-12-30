# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
COPY pecus.LexicalConverter/package*.json ./
RUN npm ci --only=production

# ============================================
# Build stage
# ============================================
FROM base AS build
COPY pecus.LexicalConverter/package*.json ./
RUN npm ci

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

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built files
COPY --from=build /app/dist ./dist

# Copy proto files
COPY pecus.Protos/ /app/protos/

EXPOSE 5100

CMD ["node", "dist/main.js"]
