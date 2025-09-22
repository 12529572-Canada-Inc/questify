FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps/worker ./apps/worker/
COPY packages ./packages/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter prisma generate

# Build worker
RUN pnpm --filter worker build

WORKDIR /app/apps/worker

# Debug: check bullmq
# RUN ls -l /app/node_modules/.pnpm | grep bullmq || echo "⚠️ bullmq not found!"

CMD ["node", "dist/index.js"]