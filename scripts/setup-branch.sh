#!/bin/bash
# Branch setup script
# Usage: ./scripts/setup-branch.sh [dev|main]

set -e

BRANCH=${1:-dev}

echo "Setting up $BRANCH branch..."

# Switch to branch
git checkout $BRANCH

# Pull latest changes
git pull origin $BRANCH

# Install dependencies
npm ci

# Setup environment
if [ "$BRANCH" = "dev" ]; then
    if [ ! -f ".env.local" ]; then
        cp .env.development .env.local
        echo "Created .env.local from .env.development"
        echo "Please edit .env.local with your local settings"
    fi
    echo "Development environment ready!"
    echo "Run: npm run dev"
    echo "Or with Docker: docker compose -f docker-compose.dev.yml --env-file .env.development up -d"
else
    if [ ! -f ".env" ]; then
        cp .env.production .env
        echo "Created .env from .env.production"
        echo "Please edit .env with your production settings"
    fi
    echo "Production environment ready!"
    echo "Deploy with: ./scripts/deploy.sh prod"
fi