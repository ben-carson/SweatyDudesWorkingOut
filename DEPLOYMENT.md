# SweatyDudes Deployment Guide for Proxmox

This guide covers deploying the SweatyDudes application to a Proxmox server using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Proxmox Setup](#proxmox-setup)
3. [Initial Deployment](#initial-deployment)
4. [Configuration](#configuration)
5. [Common Operations](#common-operations)
6. [Troubleshooting](#troubleshooting)
7. [Production Considerations](#production-considerations)

## Prerequisites

### On Your Proxmox Server

You need a Linux container (LXC) or VM with:

- **OS**: Ubuntu 22.04 or Debian 12 (recommended)
- **CPU**: 2 cores minimum (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB minimum (more depending on database size)
- **Docker**: Version 24.0 or newer
- **Docker Compose**: Version 2.0 or newer

### Required Services

- **Stack Auth Account**: Sign up at https://stack-auth.com for authentication
- **Internet Access**: For downloading Docker images and Stack Auth API

## Proxmox Setup

### Option 1: LXC Container (Recommended for efficiency)

1. Create a new privileged LXC container in Proxmox:
   ```bash
   # In Proxmox shell
   pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
     --hostname sweatydudes \
     --memory 4096 \
     --cores 2 \
     --rootfs local-lvm:20 \
     --net0 name=eth0,bridge=vmbr0,ip=dhcp \
     --features nesting=1
   ```

2. Enable nesting for Docker support:
   ```bash
   pct set 100 -features nesting=1
   ```

3. Start the container:
   ```bash
   pct start 100
   pct enter 100
   ```

### Option 2: Virtual Machine

1. Create a VM through Proxmox web UI
2. Install Ubuntu Server 22.04 or Debian 12
3. Configure network settings
4. SSH into the VM

### Install Docker

Once inside your container/VM:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Initial Deployment

### 1. Clone or Copy Repository

Transfer your code to the Proxmox server:

```bash
# Option A: Clone from Git
git clone https://github.com/yourusername/SweatyDudesWorkingOut.git
cd SweatyDudesWorkingOut

# Option B: Copy files via SCP from your local machine
# scp -r /path/to/SweatyDudesWorkingOut user@proxmox-ip:/home/user/
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your settings
nano .env.production
```

Configure the following (see [Configuration](#configuration) section for details):

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Stack Auth
VITE_STACK_PROJECT_ID=your-stack-project-id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key
STACK_SECRET_SERVER_KEY=your-stack-secret-key

# Application
APP_PORT=5000
```

### 3. Deploy

```bash
# Make deployment script executable
chmod +x deploy.sh

# Build Docker images
./deploy.sh build

# Start services
./deploy.sh start

# Check status
./deploy.sh status

# View logs
./deploy.sh logs
```

### 4. Push Database Schema

After the application starts, initialize the database schema:

```bash
./deploy.sh push-schema
```

### 5. Access Your Application

The application should now be available at:
- **From Proxmox host**: `http://container-ip:5000`
- **From local network**: `http://proxmox-ip:5000`

To find your container IP:
```bash
hostname -I
```

## Configuration

### Environment Variables

Edit `.env.production` to configure:

#### Database Settings

```env
# Use built-in PostgreSQL container
POSTGRES_DB=sweatydudes          # Database name
POSTGRES_USER=sweatydudes        # Database user
POSTGRES_PASSWORD=secure_password # CHANGE THIS!
```

**OR** use external PostgreSQL (like Neon):

```env
# Comment out POSTGRES_* variables and use:
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

#### Stack Auth Configuration

1. Go to https://stack-auth.com/dashboard
2. Create a new project or select existing
3. Copy credentials:

```env
VITE_STACK_PROJECT_ID=proj_xxxxxxxxxxxxx
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxxxxxxxxxx
STACK_SECRET_SERVER_KEY=sk_xxxxxxxxxxxxx
```

4. Configure allowed origins in Stack Auth dashboard:
   - Add `http://your-proxmox-ip:5000`
   - Add any custom domains

#### Application Settings

```env
APP_PORT=5000           # Port to expose
DB_MODE=neon           # Database mode (neon or sqlite-file)
```

### Firewall Configuration

On your Proxmox host, ensure port 5000 is accessible:

```bash
# For UFW
sudo ufw allow 5000/tcp

# For iptables
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### Reverse Proxy Setup (Optional but Recommended)

For production, use Nginx or Caddy as a reverse proxy:

#### Nginx Example

```nginx
server {
    listen 80;
    server_name sweatydudes.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy Example (Auto HTTPS)

```caddy
sweatydudes.yourdomain.com {
    reverse_proxy localhost:5000
}
```

## Common Operations

### View Logs

```bash
# All services
./deploy.sh logs

# Specific service
docker compose logs -f app
docker compose logs -f postgres
```

### Restart Services

```bash
./deploy.sh restart
```

### Create Database Backup

```bash
# Creates timestamped backup in ./backups/
./deploy.sh backup
```

### Restore from Backup

```bash
./deploy.sh restore backups/db_backup_20240115_120000.sql.gz
```

### Update Application

```bash
# This will:
# 1. Create backup
# 2. Pull latest code (if git repo)
# 3. Rebuild images
# 4. Restart services
./deploy.sh update
```

### Push Schema Changes

After modifying `shared/schema.ts`:

```bash
./deploy.sh push-schema
```

### Access Database

```bash
# PostgreSQL shell
docker compose exec postgres psql -U sweatydudes -d sweatydudes

# View tables
\dt

# Exit
\q
```

### Access Application Shell

```bash
./deploy.sh shell
```

### Stop Services

```bash
./deploy.sh stop
```

### Complete Cleanup

**Warning**: This removes all data!

```bash
./deploy.sh clean
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker compose logs app
```

Common issues:
- Missing environment variables → Check `.env.production`
- Port already in use → Change `APP_PORT` in `.env.production`
- Database connection failed → Verify `DATABASE_URL` or PostgreSQL container

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test connection manually
docker compose exec postgres pg_isready -U sweatydudes
```

### Application Crashes After Schema Changes

```bash
# Rebuild the application
./deploy.sh stop
./deploy.sh build
./deploy.sh start

# Push schema changes
./deploy.sh push-schema
```

### Can't Access from Network

1. Check firewall:
   ```bash
   sudo ufw status
   ```

2. Verify container is listening:
   ```bash
   docker compose ps
   netstat -tulpn | grep 5000
   ```

3. Check if bound to correct interface:
   ```bash
   # Should show 0.0.0.0:5000
   docker compose port app 5000
   ```

### Out of Disk Space

Check disk usage:
```bash
df -h
docker system df
```

Clean up unused Docker resources:
```bash
docker system prune -a --volumes
```

### Stack Auth Errors

Common issues:
- **403 Forbidden**: Check allowed origins in Stack Auth dashboard
- **401 Unauthorized**: Verify `STACK_SECRET_SERVER_KEY` is correct
- **CORS errors**: Add your domain to allowed origins

### Performance Issues

Monitor resources:
```bash
# Container stats
docker stats

# Check Proxmox host resources
htop
```

Increase container resources in Proxmox if needed.

## Production Considerations

### Security

1. **Use strong passwords**:
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

2. **Enable firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 5000/tcp  # Application (only if not using reverse proxy)
   ```

3. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Use HTTPS** with reverse proxy (Nginx/Caddy + Let's Encrypt)

5. **Restrict PostgreSQL** access (already isolated in Docker network)

### Backups

Set up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /home/user/SweatyDudesWorkingOut && ./deploy.sh backup

# Keep only last 7 backups
0 3 * * * find /home/user/SweatyDudesWorkingOut/backups -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### Monitoring

Consider setting up:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Log aggregation**: Loki, ELK stack
- **Metrics**: Prometheus + Grafana
- **Alerts**: Email/SMS on service failures

### Resource Limits

Edit `docker-compose.yml` to add resource constraints:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### High Availability

For critical deployments:
- Use external PostgreSQL (Neon, AWS RDS, etc.)
- Deploy multiple app instances behind a load balancer
- Regular automated backups to external storage
- Set up monitoring and alerting

### Updates

Keep Docker images updated:

```bash
# Pull latest base images
docker compose pull

# Rebuild and restart
./deploy.sh update
```

## Support

For issues specific to:
- **Application**: See main README.md
- **Docker**: https://docs.docker.com
- **Proxmox**: https://pve.proxmox.com/wiki/Main_Page
- **Stack Auth**: https://docs.stack-auth.com

## License

Same as main application (MIT)
