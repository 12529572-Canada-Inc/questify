FROM node:20-alpine AS runner
WORKDIR /app

# Copy only built output and runtime deps
COPY apps/worker/package.json ./
COPY apps/worker/dist ./dist
COPY node_modules ./node_modules

CMD ["node", "dist/index.js"]