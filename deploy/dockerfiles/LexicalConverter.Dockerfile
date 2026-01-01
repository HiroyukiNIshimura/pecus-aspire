# ============================================
# pecus.LexicalConverter Dockerfile (gRPC Service)
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Build @coati/editor package
# ============================================
FROM base AS editor-build
WORKDIR /app/packages/coati-editor
COPY packages/coati-editor/package*.json ./
RUN npm ci
COPY packages/coati-editor/ ./
RUN npm run build

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
WORKDIR /app

# Copy @coati/editor package (built)
COPY --from=editor-build /app/packages/coati-editor/dist ./packages/coati-editor/dist
COPY --from=editor-build /app/packages/coati-editor/package.json ./packages/coati-editor/

# Copy LexicalConverter package.json
COPY pecus.LexicalConverter/package*.json ./pecus.LexicalConverter/

# Create workspace structure for npm to resolve local package
COPY package.json ./
RUN cd pecus.LexicalConverter && npm ci --only=production

# ============================================
# Build stage
# ============================================
FROM base AS build
WORKDIR /app

# Copy @coati/editor package (built)
COPY --from=editor-build /app/packages/coati-editor/dist ./packages/coati-editor/dist
COPY --from=editor-build /app/packages/coati-editor/package.json ./packages/coati-editor/

# Copy and build LexicalConverter
COPY pecus.LexicalConverter/package*.json ./pecus.LexicalConverter/
COPY package.json ./
RUN cd pecus.LexicalConverter && npm ci

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
