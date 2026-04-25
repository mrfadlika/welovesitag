#!/bin/sh
set -e

echo "🚀 Starting SITAG backend..."

echo "📦 Running Prisma generate..."
npx prisma generate

echo "🗄 Running database migrations..."
npx prisma migrate deploy

echo "🔥 Starting server..."
npm start
