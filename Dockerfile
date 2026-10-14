# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies only (with native build toolchain if any package needs it)
# Never pin openssl here: the Alpine repo moves faster than this file, and a stale
# pin makes `apk add` unsatisfiable as soon as the base image is re-pulled.
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# Cap the heap explicitly: `next build` on the analytics-heavy app can exceed the
# default limit on a small VPS and die with "JavaScript heap out of memory".
ENV NODE_OPTIONS=--max-old-space-size=2048

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set runtime env needed at build time so the standalone trace can prerender the standalone output
ENV NEXT_PUBLIC_DEPLOY_URL=http://localhost:3000

RUN npm run build

# ---- Runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk upgrade --no-cache \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Public assets (certificates, images, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Standalone server + traced server files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]