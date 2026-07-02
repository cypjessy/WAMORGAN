#!/bin/bash
set -e

echo "[mobile-build] Building Next.js for production..."
npx next build

echo ""
echo "=== Build complete! ==="
echo "To sync with Capacitor, first build a static export:"
echo "  1. Add 'output: \"export\"' to next.config.ts"
echo "  2. Handle dynamic routes (see docs)"
echo "  3. Run: npm run build:mobile"
echo ""
echo "Open Android Studio:  npm run cap:open"
echo "Build APK from Studio: npm run cap:build"
echo ""
echo "NOTE: Static export with dynamic routes requires refactoring"
echo "[id] pages to use useSearchParams() instead of useParams()."
echo "For now, deploy frontend + API together on Vercel."
