# Ollama Model Initialization Script (Windows PowerShell)
# Run this after starting docker compose to pull the AI model

param(
    [string]$OllamaContainer = "e-learning-ollama",
    [string]$Model = "phi3:mini"
)

Write-Host "=== Ollama Model Initialization ===" -ForegroundColor Cyan
Write-Host "Container: $OllamaContainer"
Write-Host "Model: $Model"
Write-Host ""

# Check if container is running
Write-Host "1. Checking if Ollama container is running..." -ForegroundColor Yellow
$running = docker ps --format '{{.Names}}' | Select-String -Pattern "^${OllamaContainer}$"
if (-not $running) {
    Write-Host "   Error: Container '$OllamaContainer' is not running." -ForegroundColor Red
    Write-Host "   Start it with: docker compose up -d ollama"
    exit 1
}
Write-Host "   OK" -ForegroundColor Green

# Check Ollama API
Write-Host "2. Checking Ollama API..." -ForegroundColor Yellow
try {
    docker exec $OllamaContainer curl -sf http://localhost:11434/api/tags | Out-Null
    Write-Host "   OK" -ForegroundColor Green
} catch {
    Write-Host "   Error: Ollama API is not responding." -ForegroundColor Red
    Write-Host "   The container may still be starting. Wait a moment and try again."
    exit 1
}

# Pull model
Write-Host "3. Pulling model: $Model..." -ForegroundColor Yellow
Write-Host "   This may take several minutes depending on model size and internet speed."
docker exec $OllamaContainer ollama pull $Model
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Error: Failed to pull model" -ForegroundColor Red
    exit 1
}
Write-Host "   OK" -ForegroundColor Green

# Verify model
Write-Host "4. Verifying model is available..." -ForegroundColor Yellow
$listOutput = docker exec $OllamaContainer ollama list
if ($listOutput -match $Model) {
    Write-Host "   OK - Model $Model is ready" -ForegroundColor Green
} else {
    Write-Host "   Error: Model $Model not found after pull" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Initialization Complete ===" -ForegroundColor Cyan
Write-Host "Model: $Model"
Write-Host "Container: $OllamaContainer"
Write-Host ""
Write-Host "Test with: docker exec $OllamaContainer ollama run $Model 'Hello, test message'"
