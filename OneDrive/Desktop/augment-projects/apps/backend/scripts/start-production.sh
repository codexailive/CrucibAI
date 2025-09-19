#!/bin/bash

# Production startup script for CrucibleAI

echo "🚀 Starting CrucibleAI in production mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your production configuration."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "STRIPE_SECRET_KEY" "OPENAI_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push

# Seed database if needed
echo "🌱 Seeding database..."
npx ts-node scripts/seed-database.ts

# Build the application
echo "🔨 Building application..."
npm run build

# Start the production server
echo "🚀 Starting production server..."
NODE_ENV=production npm start
