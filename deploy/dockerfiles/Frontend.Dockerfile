# ============================================
# pecus.Frontend Dockerfile (Next.js)
# ============================================

FROM node:22-alpine AS base
WORKDIR /app

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY pecus.Frontend/package*.json ./
RUN npm ci

# ============================================
# Build stage
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY pecus.Frontend/ ./

# Build arguments for public env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
# Note: Requires output: 'standalone' in next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/build/static ./build/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
