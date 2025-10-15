set -e

# Always run from repository root
cd "$(dirname "$0")/.." || exit 1

echo "🔧 Running safe prepare..."

if pnpm ls prisma --depth -1 >/dev/null 2>&1; then
  echo "📦 Found Prisma package, running prepare..."
  pnpm --filter prisma prepare >/dev/null 2>&1 || echo "⚠️ Prisma prepare failed — continuing anyway."
else
  echo "ℹ️  No Prisma package found — skipping prepare."
fi

echo "✅ Safe prepare complete."