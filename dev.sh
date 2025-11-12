#!/bin/bash
# One script to rule them all: Clear cache, init DB, build, and start dev server

set -e  # Exit on error

echo "🧹 Step 1/4: Clearing build caches..."
rm -rf dist .astro node_modules/.vite

# Remove .wrangler but preserve D1 database
if [ -d ".wrangler" ]; then
  echo "  Preserving D1 database..."
  if [ -d ".wrangler/state/v3/d1" ]; then
    mkdir -p .d1-backup
    cp -r .wrangler/state/v3/d1 .d1-backup/ 2>/dev/null || true
  fi
  rm -rf .wrangler
  if [ -d ".d1-backup/d1" ]; then
    mkdir -p .wrangler/state/v3
    cp -r .d1-backup/d1 .wrangler/state/v3/ 2>/dev/null || true
    rm -rf .d1-backup
  fi
fi

echo "✅ Cache cleared!"
echo ""

echo "🗄️  Step 2/4: Initializing database..."
npx wrangler d1 execute solana_builders --local --file=./schema.sql > /dev/null 2>&1
echo "✅ Database initialized!"
echo ""

echo "🔨 Step 3/4: Building project..."
npm run build
echo "✅ Build complete!"
echo ""

echo "🚀 Step 4/4: Starting dev server..."
echo "   Server will be available at http://localhost:8788"
echo ""
npx wrangler pages dev dist --local

