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

RUN npx prisma generate
RUN npx tsc --project tsconfig.server-prod.json

ENV DOCKER=1
RUN npm run build

FROM base AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY --from=builder /app/dist-server ./dist-server

COPY --from=builder /app/server/yjs-server.js ./server/yjs-server.js
COPY --from=builder /app/server/start.js ./server/start.js

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p yjs-data && chmod 777 yjs-data

EXPOSE 3000 3001 1234

ENV PORT=3000
ENV SOCKET_PORT=3001
ENV YJS_PORT=1234

CMD ["node", "server/start.js"]
