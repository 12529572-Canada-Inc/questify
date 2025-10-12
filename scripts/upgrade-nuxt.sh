#!/usr/bin/env bash
set -e

echo "🚀 Starting Nuxt v3 → v4 upgrade for Questify monorepo..."

# 1. Ensure running from root
cd "$(dirname "$0")/.."

# 2. Disable Corepack signature verification (bug workaround)
echo "🔧 Disabling Corepack signature enforcement..."
corepack disable || true

# 3. Ensure latest pnpm installed globally
echo "⬆️  Installing latest pnpm..."
npm install -g pnpm@latest

# 4. Bump Nuxt + related packages
echo "📦 Upgrading Nuxt packages..."
pnpm up nuxt @nuxt/kit @nuxt/schema @nuxt/test-utils --filter nuxt

# 5. Clear caches
echo "🧹 Clearing caches..."
pnpm store prune
pnpm cache clean --all
rm -rf ~/.cache/nuxi ~/.local/share/nuxi || true

# 6. Prepare Nuxt
echo "⚙️  Running nuxi prepare..."
pnpm --filter nuxt exec nuxi prepare

# 7. Verify version
echo "🔍 Nuxt version check:"
pnpm --filter nuxt dlx nuxi info

echo "✅ Nuxt upgrade complete!"
