#!/usr/bin/env bash
set -e

echo "🚀 Starting Nuxt upgrade for Questify monorepo..."

# 1. Move to repo root
cd "$(dirname "$0")/.."

# 2. Disable Corepack signature checks (safe workaround for key errors)
echo "🔧 Disabling Corepack signature enforcement..."
corepack disable || true

# 3. Update pnpm globally
echo "⬆️  Ensuring latest pnpm..."
npm install -g pnpm@latest

# 4. Clean caches and node_modules
echo "🧹 Cleaning node_modules and pnpm store..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf ~/.cache/pnpm ~/.pnpm-store ~/.cache/nuxi ~/.local/share/nuxi
pnpm store prune --force

# 5. Remove & reinstall Nuxt + Nuxi
echo "📦 Upgrading Nuxt packages..."
pnpm up nuxt @nuxt/kit @nuxt/schema --filter nuxt
pnpm remove nuxi --filter nuxt || true
pnpm add -D nuxi@latest --filter nuxt

# 6. Reinstall all workspace deps
echo "📥 Reinstalling all dependencies..."
pnpm install

# 7. Regenerate Prisma Client
echo "🧩 Regenerating Prisma client..."
pnpm --filter prisma exec prisma generate || true

# 8. Rebuild native bindings (OXC, etc.)
echo "🔧 Rebuilding native bindings..."
pnpm rebuild -r

# 9. Prepare Nuxt
echo "⚙️  Preparing Nuxt..."
pnpm --filter nuxt exec nuxi prepare

# 10. Verify versions
echo "🔍 Nuxt environment info:"
pnpm --filter nuxt exec nuxi info

echo "✅ Nuxt upgrade complete!"
