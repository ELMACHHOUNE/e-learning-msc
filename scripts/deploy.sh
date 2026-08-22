#!/bin/bash
# Deployment script for production
# Usage: ./scripts/deploy.sh [prod|dev]

set -e

ENV=${1:-prod}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

if [ "$ENV" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    ENV_FILE=".env.development"
    echo "Deploying DEVELOPMENT environment..."
else
    echo "Deploying PRODUCTION environment..."
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    echo "Copy from template: cp .env.$ENV $ENV_FILE"
    echo "Then edit with your values."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Build and start
echo "Building and starting containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build

echo "Waiting for services to be healthy..."
sleep 10

# Check health
docker compose -f $COMPOSE_FILE ps

echo "Deployment complete!"
echo "App running at: http://localhost${HTTP_PORT:+:$HTTP_PORT}"
if [ "$ENV" = "prod" ]; then
    echo "App running at: https://${DOMAIN:-e-teaching.tech}"
fi