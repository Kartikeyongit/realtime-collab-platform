FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma client + build Next.js
RUN npx prisma generate
ENV DOCKER=1
RUN npm run build

FROM base AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Next.js build output (static files, server chunks, etc.)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Prisma schema + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Integrated server entry point
COPY --from=builder /app/server/integrated.js ./server/integrated.js

# Yjs persistence dir
RUN mkdir -p yjs-data && chmod 777 yjs-data

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server/integrated.js"]
