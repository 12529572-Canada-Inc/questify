# --- Build stage ---
FROM node:24-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps/worker ./apps/worker/
COPY packages ./packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter prisma generate
RUN pnpm build

# --- Runtime stage ---
FROM node:24-alpine

WORKDIR /app

# Copy only built worker (and node_modules if needed)
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

WORKDIR /app/apps/worker

# ✅ Ensure dist exists
RUN ls -l dist || (echo "⚠️ dist missing!" && exit 1)

CMD ["npm", "start"]