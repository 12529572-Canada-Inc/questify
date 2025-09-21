# syntax = docker/dockerfile:1

# Use a small Node.js image
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production

# Copy the already built worker app from release pipeline
COPY . .

# Default command to run the app
CMD ["npm", "run", "start"]
