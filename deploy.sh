#!/bin/bash

# SweatyDudes Deployment Script for Proxmox
# This script helps manage Docker-based deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sweatydudes"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_info "All requirements met!"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found!"
        log_info "Please copy .env.production.example to .env.production and configure it."
        exit 1
    fi
}

build() {
    log_info "Building Docker images..."
    docker compose --env-file "$ENV_FILE" build --no-cache
    log_info "Build complete!"
}

start() {
    log_info "Starting services..."
    check_env_file
    docker compose --env-file "$ENV_FILE" up -d
    log_info "Services started!"
    log_info "Application should be available at http://localhost:${APP_PORT:-5000}"
}

stop() {
    log_info "Stopping services..."
    docker compose --env-file "$ENV_FILE" down
    log_info "Services stopped!"
}

restart() {
    log_info "Restarting services..."
    stop
    start
}

logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    docker compose --env-file "$ENV_FILE" logs -f
}

status() {
    log_info "Service status:"
    docker compose --env-file "$ENV_FILE" ps
}

backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

    # Backup PostgreSQL database
    docker compose --env-file "$ENV_FILE" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-sweatydudes}" \
        "${POSTGRES_DB:-sweatydudes}" > "$BACKUP_FILE"

    log_info "Backup created: $BACKUP_FILE"

    # Compress backup
    gzip "$BACKUP_FILE"
    log_info "Backup compressed: $BACKUP_FILE.gz"
}

restore() {
    if [ -z "$1" ]; then
        log_error "Please specify backup file to restore"
        log_info "Usage: $0 restore <backup-file.sql.gz>"
        exit 1
    fi

    BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_warn "This will replace the current database. Are you sure? (yes/no)"
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi

    log_info "Restoring from backup: $BACKUP_FILE"

    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" exec -T postgres \
        psql -U "${POSTGRES_USER:-sweatydudes}" "${POSTGRES_DB:-sweatydudes}"

    log_info "Restore complete!"
}

update() {
    log_info "Updating application..."

    # Create backup before update
    log_info "Creating backup before update..."
    backup

    # Pull latest code (if using git)
    if [ -d .git ]; then
        log_info "Pulling latest code..."
        git pull
    fi

    # Rebuild and restart
    build
    stop
    start

    log_info "Update complete!"
}

push_schema() {
    log_info "Pushing database schema..."
    check_env_file

    # Run db:push in the app container
    docker compose --env-file "$ENV_FILE" exec app npm run db:push

    log_info "Schema push complete!"
}

shell() {
    log_info "Opening shell in app container..."
    docker compose --env-file "$ENV_FILE" exec app sh
}

clean() {
    log_warn "This will remove all containers, volumes, and images. Are you sure? (yes/no)"
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        log_info "Clean cancelled."
        exit 0
    fi

    log_info "Cleaning up..."
    docker compose --env-file "$ENV_FILE" down -v --rmi all
    log_info "Cleanup complete!"
}

# Main command handler
case "$1" in
    build)
        check_requirements
        build
        ;;
    start)
        check_requirements
        start
        ;;
    stop)
        stop
        ;;
    restart)
        check_requirements
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    update)
        check_requirements
        update
        ;;
    push-schema)
        push_schema
        ;;
    shell)
        shell
        ;;
    clean)
        clean
        ;;
    *)
        echo "SweatyDudes Deployment Manager"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  build        - Build Docker images"
        echo "  start        - Start all services"
        echo "  stop         - Stop all services"
        echo "  restart      - Restart all services"
        echo "  logs         - View service logs"
        echo "  status       - Show service status"
        echo "  backup       - Create database backup"
        echo "  restore      - Restore from backup"
        echo "  update       - Update application (backup, pull, rebuild, restart)"
        echo "  push-schema  - Push database schema changes"
        echo "  shell        - Open shell in app container"
        echo "  clean        - Remove all containers, volumes, and images"
        echo ""
        exit 1
        ;;
esac
