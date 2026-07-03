#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║           📱 WAMORGAN Android Build                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Check Vercel URL ────────────────────────────────────
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_API_URL is not set."
  echo "   This should point to your Vercel backend URL."
  echo "   Example: https://wamorgan.vercel.app"
  echo ""
  read -p "   Enter your Vercel URL (or press Enter to skip): " vercel_url
  if [ -n "$vercel_url" ]; then
    export NEXT_PUBLIC_API_URL="$vercel_url"
    echo "   ✓ Using: $NEXT_PUBLIC_API_URL"
  else
    echo "   ⚠️  Continuing without API URL — API calls will fail at runtime."
    echo "      Set NEXT_PUBLIC_API_URL for next time."
  fi
  echo ""
fi

# ─── Step 1: Temporarily move API routes outside src/app/ ──
API_BACKUP="/tmp/wamorgan-api-backup"
echo "📂 Moving API routes aside (not needed in the APK)..."
rm -rf "$API_BACKUP"
mkdir -p "$API_BACKUP"
mv src/app/api "$API_BACKUP/api"
echo "   ✓ API routes moved to $API_BACKUP/api"

# Cleanup handler: always restore API routes
cleanup() {
  echo ""
  echo "📂 Restoring API routes..."
  if [ -d "$API_BACKUP/api" ]; then
    rm -rf src/app/api 2>/dev/null
    mv "$API_BACKUP/api" src/app/api
    rm -rf "$API_BACKUP"
    echo "   ✓ API routes restored"
  fi
}
trap cleanup EXIT

# ─── Step 2: Build Next.js static export ──────────────────
echo ""
echo "🏗️  Building Next.js static export..."
echo "   (BUILD_FOR_MOBILE=true, output: export)"
export BUILD_FOR_MOBILE=true
npm run build
echo "   ✓ Build complete — static files in ./out/"

# ─── Step 3: Sync with Capacitor ──────────────────────────
echo ""
echo "⚡ Syncing with Capacitor..."
npx cap copy
echo "   ✓ Web assets copied to android/app/src/main/assets/public"

# ─── Step 4: Build Android APK ────────────────────────────
echo ""
echo "📱 Open Android Studio to build the APK:"
echo "   ───────────────────────────────────────────────"
echo "   npm run cap:open    (opens Android Studio)"
echo "   Then: Build → Build APK(s) or Build Bundle(s)"
echo "   ───────────────────────────────────────────────"
echo ""
echo "   Or build from command line:"
echo "   cd android && ./gradlew assembleRelease"
echo "   (APK at: android/app/build/outputs/apk/release/)"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║           ✅ Mobile build complete!                  ║"
echo "╚══════════════════════════════════════════════════════╝"
