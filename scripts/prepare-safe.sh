#!/usr/bin/env bash
set -e

echo "🔧 Running safe prepare..."
if pnpm ls prisma --depth -1 >/dev/null 2>&1; then
  echo "📦 Found Prisma package, running prepare..."
  pnpm --filter prisma prepare || echo "⚠️ Prisma prepare failed — continuing anyway."
else
  echo "ℹ️  No Prisma package found — skipping prepare."
fi
echo "✅ Safe prepare complete."