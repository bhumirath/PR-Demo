#!/bin/bash
set -e

echo "==> Installing backend dependencies"
cd "$DEPLOYMENT_TARGET" 2>/dev/null || cd .
npm install --production=false

# Build frontend only if the frontend directory exists alongside backend
FRONTEND_DIR="$(cd .. 2>/dev/null && pwd)/frontend"
if [ -d "$FRONTEND_DIR" ]; then
  echo "==> Building frontend"
  cd "$FRONTEND_DIR"
  npm install
  npm run build
  cd "$DEPLOYMENT_TARGET" 2>/dev/null || cd .
  rm -rf public
  cp -r "$FRONTEND_DIR/dist" ./public
  echo "==> Frontend build copied to public/"
else
  echo "==> Skipping frontend build (directory not found, using committed public/)"
fi

echo "==> Building NestJS backend"
npm run build

echo "==> Generating Prisma Client"
npx prisma generate

echo "==> Deploy done"
