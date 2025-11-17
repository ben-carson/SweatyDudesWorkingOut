#!/bin/bash

# SweatyDudes Client Setup Script
# This script configures your local machine to access SweatyDudes via HTTPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="sweatydudes.local"
PROXMOX_IP="192.168.1.201"
CA_CERT_PATH="/tmp/sweatydudes-ca.pem"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SweatyDudes Client Setup Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Helper functions
log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[→]${NC} $1"
}

# Step 1: Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please don't run this script as root (use your normal user account)"
    exit 1
fi

# Step 2: Check prerequisites
log_step "Checking prerequisites..."

if ! command -v sudo &> /dev/null; then
    log_error "sudo is required but not installed"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    log_warn "ssh is not installed - you won't be able to fetch the CA certificate automatically"
fi

log_info "Prerequisites check complete"
echo ""

# Step 3: Hosts file configuration
log_step "Configuring hosts file..."

if grep -q "sweatydudes.local" /etc/hosts 2>/dev/null; then
    log_info "Domain already in hosts file"
else
    log_warn "Adding $DOMAIN to /etc/hosts (requires sudo)"
    echo "$PROXMOX_IP  $DOMAIN" | sudo tee -a /etc/hosts > /dev/null
    log_info "Added $DOMAIN → $PROXMOX_IP to hosts file"
fi

# Verify hosts entry
if ping -c 1 -W 2 "$DOMAIN" &> /dev/null; then
    log_info "DNS resolution working: $DOMAIN resolves to $PROXMOX_IP"
else
    log_warn "Could not ping $DOMAIN - check network connectivity"
fi
echo ""

# Step 4: Fetch CA certificate
log_step "Fetching CA certificate from Proxmox server..."

if [ -f "$CA_CERT_PATH" ]; then
    log_info "CA certificate already exists at $CA_CERT_PATH"
else
    if command -v ssh &> /dev/null; then
        log_warn "Attempting to fetch CA certificate via SSH..."
        if ssh root@$PROXMOX_IP "cat \$(mkcert -CAROOT)/rootCA.pem" > "$CA_CERT_PATH" 2>/dev/null; then
            log_info "CA certificate downloaded successfully"
        else
            log_error "Failed to fetch CA certificate via SSH"
            echo ""
            echo "Please manually copy the certificate:"
            echo "  ssh root@$PROXMOX_IP \"cat \\\$(mkcert -CAROOT)/rootCA.pem\" > $CA_CERT_PATH"
            exit 1
        fi
    else
        log_error "Cannot fetch certificate - ssh not available"
        exit 1
    fi
fi
echo ""

# Step 5: Install CA certificate
log_step "Installing CA certificate to system trust store..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi

case "$OS" in
    ubuntu|debian|pop)
        log_info "Detected Debian/Ubuntu-based system"

        # Install to system certificate store
        sudo cp "$CA_CERT_PATH" /usr/local/share/ca-certificates/sweatydudes-ca.crt
        sudo update-ca-certificates

        log_info "CA certificate installed to system trust store"

        # Check for Firefox
        if command -v firefox &> /dev/null; then
            log_warn "Firefox detected - it uses its own certificate store"
            echo ""
            echo "  To trust certificates in Firefox:"
            echo "  1. Open Firefox"
            echo "  2. Settings → Privacy & Security → Certificates → View Certificates"
            echo "  3. Click 'Authorities' tab → Import"
            echo "  4. Select: $CA_CERT_PATH"
            echo "  5. Check 'Trust this CA to identify websites'"
            echo ""
        fi
        ;;

    fedora|rhel|centos)
        log_info "Detected Red Hat-based system"
        sudo cp "$CA_CERT_PATH" /etc/pki/ca-trust/source/anchors/sweatydudes-ca.crt
        sudo update-ca-trust
        log_info "CA certificate installed to system trust store"
        ;;

    arch|manjaro)
        log_info "Detected Arch-based system"
        sudo cp "$CA_CERT_PATH" /etc/ca-certificates/trust-source/anchors/sweatydudes-ca.crt
        sudo trust extract-compat
        log_info "CA certificate installed to system trust store"
        ;;

    darwin)
        log_info "Detected macOS"
        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CA_CERT_PATH"
        log_info "CA certificate installed to macOS Keychain"
        ;;

    *)
        log_error "Unsupported OS: $OS"
        echo ""
        echo "Please manually install the certificate:"
        echo "  Certificate location: $CA_CERT_PATH"
        exit 1
        ;;
esac
echo ""

# Step 6: Test connection
log_step "Testing HTTPS connection..."

if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" | grep -q "200"; then
        log_info "Successfully connected to https://$DOMAIN"
        log_info "HTTP/2 support: $(curl -s -I --http2 "https://$DOMAIN/api/health" 2>/dev/null | grep -i "HTTP/2" > /dev/null && echo "Yes" || echo "No")"
    else
        log_warn "Could not connect to https://$DOMAIN"
        echo "  Try accessing manually: https://$DOMAIN"
    fi
else
    log_warn "curl not installed - skipping connection test"
fi
echo ""

# Step 7: Summary
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete! 🎉                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Your SweatyDudes app is now accessible at:"
echo -e "  ${BLUE}https://sweatydudes.local${NC}"
echo ""
echo -e "Alternative access methods:"
echo -e "  • https://192.168.1.201 (certificate for sweatydudes.local)"
echo -e "  • http://192.168.1.236:5000 (direct, no proxy)"
echo ""
echo -e "Troubleshooting:"
echo -e "  • If you see certificate warnings, restart your browser"
echo -e "  • Check setup details: ~/dev/REVERSE_PROXY_SETUP.md"
echo -e "  • View this script: ~/dev/setup-sweatydudes-client.sh"
echo ""
echo -e "${GREEN}Happy working out! 💪${NC}"
