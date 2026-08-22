# E-Learning MSC - Branching Strategy & Deployment

## Branching Strategy

### `main` (Production)
- **Purpose**: Production-ready code
- **Deploy**: Directly to VPS (e-teaching.tech)
- **Protection**: Requires PR review, passes CI
- **Config**: `.env.production` → `.env`, `docker-compose.prod.yml`, `nginx/nginx.conf`

### `dev` (Development)
- **Purpose**: Active development, feature branches merge here
- **Deploy**: Local development, staging
- **Config**: `.env.development` → `.env.local`, `docker-compose.dev.yml`, `nginx/nginx.dev.conf`

### Feature Branches
- Create from `dev`: `git checkout -b feature/my-feature dev`
- Merge back to `dev` via PR
- Never merge directly to `main`

## Quick Start

### Local Development (dev branch)
```bash
# Switch to dev branch
git checkout dev

# Setup environment
./scripts/setup-branch.sh dev

# Option 1: Run locally (hot reload)
npm run dev

# Option 2: Run with Docker (matches production)
docker compose -f docker-compose.dev.yml --env-file .env.development up -d
# Access at http://localhost
```

### Production Deployment (main branch)
```bash
# On VPS, switch to main
git checkout main
git pull origin main

# Setup environment (first time only)
cp .env.production .env
# Edit .env with your production values

# Deploy
./scripts/deploy.sh prod
# Access at https://e-teaching.tech
```

## Merging dev → main

```bash
# Run the merge script (includes lint & build checks)
./scripts/merge-to-main.sh
```

## Environment Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.example` | Template for local dev | Yes |
| `.env.development` | Dev Docker Compose template | Yes |
| `.env.production` | Prod Docker Compose template | Yes |
| `.env.local` | Your local overrides | No (gitignored) |
| `.env` | Production overrides | No (gitignored) |

## Docker Compose Files

| File | Environment | Nginx Config |
|------|-------------|--------------|
| `docker-compose.dev.yml` | Development | `nginx/nginx.dev.conf` (HTTP only) |
| `docker-compose.prod.yml` | Production | `nginx/nginx.conf` (HTTPS with SSL) |
| `docker-compose.yml` | Legacy (use prod) | `nginx/nginx.conf` |

## Nginx SSL Setup (Production)

The production nginx config expects Let's Encrypt certificates at:
```
/etc/letsencrypt/live/e-teaching.tech/fullchain.pem
/etc/letsencrypt/live/e-teaching.tech/privkey.pem
```

### First-time SSL Setup on VPS:
```bash
# 1. Start with HTTP only (for certbot challenge)
docker compose -f docker-compose.prod.yml up -d nginx

# 2. Get certificates
sudo certbot certonly --standalone -d e-teaching.tech -d www.e-teaching.tech

# 3. Restart nginx with SSL
docker compose -f docker-compose.prod.yml restart nginx
```

### Auto-renewal:
```bash
# Add to crontab
0 0 * * * certbot renew --quiet && docker compose -f /path/to/docker-compose.prod.yml restart nginx
```

## Project Structure

```
├── nginx/
│   ├── nginx.conf              # Production (main branch)
│   ├── nginx.dev.conf          # Development (dev branch)
│   └── nginx.prod.conf.template # Template with ${DOMAIN} variable
├── docker-compose.yml          # Legacy production
├── docker-compose.dev.yml      # Development
├── docker-compose.prod.yml     # Production
├── Dockerfile                  # Production build
├── Dockerfile.dev              # Development (hot reload)
├── .env.development            # Dev environment template
├── .env.production             # Prod environment template
└── scripts/
    ├── deploy.sh               # Deploy script
    ├── setup-branch.sh         # Branch setup helper
    └── merge-to-main.sh        # Merge dev→main with checks
```

## Best Practices

1. **Always work on `dev` branch** - create feature branches from `dev`
2. **Test locally with Docker** - `docker-compose.dev.yml` matches production setup
3. **Run lint & build before merge** - `./scripts/merge-to-main.sh` does this
4. **Use environment templates** - never commit real secrets
5. **SSL handled by certbot on host** - nginx container mounts `/etc/letsencrypt`