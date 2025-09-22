# syntax = docker/dockerfile:1

# Use a small Node.js image
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production

# Copy only worker package.json (for runtime deps)
COPY apps/worker/package.json ./
COPY pnpm-lock.yaml ./

# Install only production deps
RUN npm install --omit=dev

# Copy prebuilt worker output
COPY apps/worker/dist ./dist

# Start worker
CMD ["node", "dist/index.js"]