# Dockerfile

FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile


FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=true && yarn cache clean

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000

CMD ["node", "/app/.next/standalone/server.js"]
