#!/bin/bash
# Merge dev to main script
# Usage: ./scripts/merge-to-main.sh

set -e

echo "Merging dev to main..."

# Ensure we're on dev and it's up to date
git checkout dev
git pull origin dev

# Run tests and lint
echo "Running lint..."
npm run lint

echo "Running build..."
npm run build

# Switch to main and merge
git checkout main
git pull origin main

# Merge dev into main (no-ff to preserve history)
git merge --no-ff dev -m "Merge dev into main: $(date +%Y-%m-%d)"

# Push to main
git push origin main

# Go back to dev
git checkout dev

echo "Merge complete! dev merged into main."
echo "Don't forget to deploy main to production:"
echo "  ./scripts/deploy.sh prod"