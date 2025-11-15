# SweatyDudes - Quick Deployment Guide

## Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Verify Docker is installed
docker --version
docker compose version
```

### 2. Configure
```bash
# Copy and edit environment file
cp .env.production.example .env.production
nano .env.production  # Set POSTGRES_PASSWORD and Stack Auth keys
```

### 3. Deploy
```bash
# Make script executable
chmod +x deploy.sh

# Build and start
./deploy.sh build
./deploy.sh start

# Initialize database
./deploy.sh push-schema

# Check status
./deploy.sh status
```

### 4. Access
```bash
# Find your IP
hostname -I

# Access at: http://YOUR_IP:5000
```

## Common Commands

```bash
./deploy.sh start         # Start services
./deploy.sh stop          # Stop services
./deploy.sh restart       # Restart services
./deploy.sh logs          # View logs
./deploy.sh status        # Check status
./deploy.sh backup        # Backup database
./deploy.sh update        # Update app (backup + rebuild + restart)
./deploy.sh push-schema   # Push database schema changes
./deploy.sh shell         # Access app container shell
```

## Environment Variables (Required)

Edit `.env.production`:

```env
# Database (REQUIRED)
POSTGRES_PASSWORD=your_secure_password

# Stack Auth (REQUIRED - get from https://stack-auth.com)
VITE_STACK_PROJECT_ID=proj_xxxxxxxxxxxxx
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxxxxxxxxxx
STACK_SECRET_SERVER_KEY=sk_xxxxxxxxxxxxx

# Optional
APP_PORT=5000
DB_MODE=neon
```

## Troubleshooting

### Can't access app?
```bash
# Check if running
./deploy.sh status

# View logs
./deploy.sh logs

# Check firewall
sudo ufw allow 5000/tcp
```

### Database errors?
```bash
# Restart database
docker compose restart postgres

# Push schema
./deploy.sh push-schema
```

### Start fresh?
```bash
./deploy.sh clean  # ⚠️ Deletes all data!
./deploy.sh build
./deploy.sh start
./deploy.sh push-schema
```

## Daily Operations

### Backups (Automated)
```bash
# Set up daily backups
crontab -e

# Add this line for daily 2 AM backups:
0 2 * * * cd /path/to/SweatyDudesWorkingOut && ./deploy.sh backup

# Clean old backups (keep 7 days):
0 3 * * * find /path/to/SweatyDudesWorkingOut/backups -name "*.sql.gz" -mtime +7 -delete
```

### Updates
```bash
# Pull latest code (if git repo)
git pull

# Update app (creates backup automatically)
./deploy.sh update
```

### Monitoring
```bash
# Watch logs in real-time
./deploy.sh logs

# Check resource usage
docker stats

# Check disk space
df -h
docker system df
```

## Production Checklist

- [ ] Strong database password set
- [ ] Stack Auth configured with correct origins
- [ ] Firewall configured
- [ ] Automated backups set up
- [ ] HTTPS configured (reverse proxy)
- [ ] Monitoring set up
- [ ] Regular updates scheduled

## Need Help?

- **Full Guide**: See `DEPLOYMENT.md`
- **App Documentation**: See `README.md` and `CLAUDE.md`
- **Docker Issues**: `docker compose logs`
- **Database Issues**: `docker compose exec postgres psql -U sweatydudes`

## Quick Links

- Stack Auth Dashboard: https://stack-auth.com/dashboard
- Docker Documentation: https://docs.docker.com
- Proxmox Wiki: https://pve.proxmox.com/wiki
