# syntax = docker/dockerfile:1

# Use a small Node.js image
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production

# Copy only the manifests for clean install
COPY --link package.json package-lock.json* pnpm-lock.yaml* ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy prebuilt worker dist + prisma client + any runtime files
COPY --link dist ./dist
COPY --link prisma ./prisma
COPY --link node_modules/.prisma ./node_modules/.prisma

# Start the worker
CMD ["node", "dist/index.js"]
