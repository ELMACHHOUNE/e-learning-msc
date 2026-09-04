#!/bin/bash
# Ollama Model Initialization Script
# Run this after starting docker compose to pull the AI model

set -e

OLLAMA_CONTAINER="${OLLAMA_CONTAINER:-e-learning-ollama}"
MODEL="${OLLAMA_MODEL:-phi3:mini}"

echo "=== Ollama Model Initialization ==="
echo "Container: $OLLAMA_CONTAINER"
echo "Model: $MODEL"
echo ""

# Check if container is running
echo "1. Checking if Ollama container is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${OLLAMA_CONTAINER}$"; then
  echo "   Error: Container '$OLLAMA_CONTAINER' is not running."
  echo "   Start it with: docker compose up -d ollama"
  exit 1
fi
echo "   OK"

# Check Ollama API
echo "2. Checking Ollama API..."
if ! docker exec "$OLLAMA_CONTAINER" curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "   Error: Ollama API is not responding."
  echo "   The container may still be starting. Wait a moment and try again."
  exit 1
fi
echo "   OK"

# Pull model
echo "3. Pulling model: $MODEL..."
echo "   This may take several minutes depending on model size and internet speed."
docker exec "$OLLAMA_CONTAINER" ollama pull "$MODEL"
echo "   OK"

# Verify model
echo "4. Verifying model is available..."
if docker exec "$OLLAMA_CONTAINER" ollama list | grep -q "$MODEL"; then
  echo "   OK - Model $MODEL is ready"
else
  echo "   Error: Model $MODEL not found after pull"
  exit 1
fi

echo ""
echo "=== Initialization Complete ==="
echo "Model: $MODEL"
echo "Container: $OLLAMA_CONTAINER"
echo ""
echo "Test with: docker exec $OLLAMA_CONTAINER ollama run $MODEL 'Hello, test message'"
