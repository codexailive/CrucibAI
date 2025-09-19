#!/bin/bash

# Database migration script for CrucibleAI

echo "🔄 Running database migrations..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your database configuration."
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env file"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🗄️ Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "🌱 Seeding database with initial data..."
npx ts-node scripts/seed-database.ts

echo "✅ Database migration completed successfully!"
echo "🚀 You can now start the server with: npm start"
