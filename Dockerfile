FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Workspace manifests (root + every package) are needed for npm to link workspaces.
COPY package.json package-lock.json* ./
COPY apps/reference/package.json ./apps/reference/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/core/package.json ./packages/core/
COPY packages/admin/package.json ./packages/admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/cms-bridge/package.json ./packages/cms-bridge/
COPY packages/wse-cli/package.json ./packages/wse-cli/
COPY packages/templates ./packages/templates
COPY packages/plugins ./packages/plugins
RUN npm install --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p uploads

# Set environment variables for build
ARG DATABASE_URL="mongodb://localhost:27017/krausz"
ARG AUTH_GOOGLE_ID="placeholder"
ARG AUTH_GOOGLE_SECRET="placeholder"
ARG AUTH_SECRET="placeholder"
ARG NEXTAUTH_URL="https://placeholder.com"
ARG AUTH_TRUST_HOST="true"
ARG SITE_APP="apps/reference"

ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET
ENV AUTH_SECRET=$AUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV AUTH_TRUST_HOST=$AUTH_TRUST_HOST
ENV SITE_APP=$SITE_APP

RUN npm run build --workspace=$SITE_APP

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ARG SITE_APP="apps/reference"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/$SITE_APP/public ./public
RUN mkdir -p uploads
COPY --from=builder /app/uploads ./uploads

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone output preserves the monorepo layout (outputFileTracingRoot = repo root).
COPY --from=builder --chown=nextjs:nodejs /app/$SITE_APP/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/$SITE_APP/.next/static ./$SITE_APP/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
# Auth.js settings should be provided at runtime (docker-compose/k8s/secrets),
# so redirects and cookies always match the actual deployed host.

ARG SITE_APP_SERVER="apps/reference/server.js"
ENV SITE_APP_SERVER=$SITE_APP_SERVER
CMD node $SITE_APP_SERVER
