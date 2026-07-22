#!/bin/bash

# Build script for pay-as-you-go services
# Usage: ./build.sh [clean|init|build|image] [...]
# Example: ./build.sh clean init build image

set -e

BUILD_DIR=".build"
DEPS_DIR=".build/deps"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Clean build artifacts
clean() {
    print_header "Cleaning build artifacts..."
    
    # Remove .build directory
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Removed $BUILD_DIR directory"
    fi
    
    # Clean payment-service
    if [ -d "payment-service" ]; then
        cd payment-service
        if [ -f "gradlew" ]; then
            ./gradlew clean --no-daemon 2>/dev/null || true
        fi
        cd ..
        print_success "Cleaned payment-service"
    fi
    
    # Clean billing-service
    if [ -d "billing-service" ]; then
        cd billing-service
        if [ -f "gradlew" ]; then
            ./gradlew clean --no-daemon 2>/dev/null || true
        fi
        cd ..
        print_success "Cleaned billing-service"
    fi
    
    # Clean user-service
    if [ -d "user" ]; then
        cd user
        if [ -f "gradlew" ]; then
            ./gradlew clean --no-daemon 2>/dev/null || true
        fi
        cd ..
        print_success "Cleaned user-service"
    fi
    
    # Clean frontend
    if [ -d "frontend" ]; then
        cd frontend
        rm -rf dist node_modules 2>/dev/null || true
        cd ..
        print_success "Cleaned frontend"
    fi
    
    print_success "Clean complete!"
}

# Initialize dependencies
init() {
    print_header "Initializing dependencies..."
    
    # Check for required tools
    print_info "Checking required tools..."
    
    if ! command -v java &> /dev/null; then
        print_error "Java not found. Please install Java 21+"
        exit 1
    fi
    print_success "Java found: $(java -version 2>&1 | head -n 1)"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    # Create isolated deps directory
    mkdir -p "$DEPS_DIR"
    
    # Check for Stripe CLI
    if ! command -v stripe &> /dev/null; then
        print_info "Stripe CLI not found."
        print_info "Installing Stripe CLI..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - use Homebrew
            if command -v brew &> /dev/null; then
                brew install stripe/stripe-cli/stripe
                print_success "Stripe CLI installed"
            else
                print_error "Homebrew not found. Install Stripe CLI manually:"
                print_error "  brew install stripe/stripe-cli/stripe"
                print_error "Or visit: https://stripe.com/docs/stripe-cli"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux - provide instructions
            print_error "Please install Stripe CLI manually:"
            print_error "  curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg"
            print_error "  echo 'deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main' | sudo tee -a /etc/apt/sources.list.d/stripe.list"
            print_error "  sudo apt update && sudo apt install stripe"
            exit 1
        else
            print_error "Unsupported OS. Install Stripe CLI manually:"
            print_error "Visit: https://stripe.com/docs/stripe-cli"
            exit 1
        fi
    else
        print_success "Stripe CLI found: $(stripe --version)"
    fi
    
    # Install frontend dependencies in isolated location
    print_info "Installing frontend dependencies (isolated)..."
    mkdir -p "$DEPS_DIR/frontend"
    cd frontend
    npm install
    rm -rf "../$DEPS_DIR/frontend/node_modules"
    mv node_modules "../$DEPS_DIR/frontend/"
    cd ..
    print_success "Frontend dependencies installed"
    
    print_success "Initialization complete!"
}

# Build all services
build() {
    print_header "Building all services..."
    mkdir -p "$BUILD_DIR"
    
    build-payment
    build-billing
    build-user
    build-frontend
    
    print_success "All services built successfully!"
    echo ""
    print_info "Build artifacts stored in $BUILD_DIR/"
}

# Build individual services
build-payment() {
    print_info "Building payment-service..."
    mkdir -p "$BUILD_DIR/payment-service"
    cd payment-service
    GRADLE_USER_HOME="../$DEPS_DIR/gradle" ./gradlew bootJar --no-daemon
    cp build/libs/*.jar "../$BUILD_DIR/payment-service/"
    cd ..
    print_success "payment-service built"
}

build-billing() {
    print_info "Building billing-service..."
    mkdir -p "$BUILD_DIR/billing-service"
    cd billing-service
    GRADLE_USER_HOME="../$DEPS_DIR/gradle" ./gradlew bootJar --no-daemon
    cp build/libs/*.jar "../$BUILD_DIR/billing-service/"
    cd ..
    print_success "billing-service built"
}

build-user() {
    print_info "Building user-service..."
    mkdir -p "$BUILD_DIR/user-service"
    cd user
    GRADLE_USER_HOME="../$DEPS_DIR/gradle" ./gradlew bootJar --no-daemon
    cp build/libs/*.jar "../$BUILD_DIR/user-service/"
    cd ..
    print_success "user-service built"
}

build-frontend() {
    print_info "Building frontend..."
    mkdir -p "$BUILD_DIR/frontend"
    cd frontend
    if [ -d "../$DEPS_DIR/frontend/node_modules" ]; then
        ln -sf "../$DEPS_DIR/frontend/node_modules" node_modules 2>/dev/null || cp -r "../$DEPS_DIR/frontend/node_modules" .
    fi
    npm run build
    cp -r dist "../$BUILD_DIR/frontend/"
    rm -f node_modules 2>/dev/null || true
    cd ..
    print_success "frontend built"
}

# Build Docker images
image() {
    print_header "Building Docker images..."
    print_info "Building images with docker compose..."
    docker compose build --no-cache
    print_success "Docker images built successfully!"
}

# Build individual Docker images
image-payment() {
    print_info "Building payment-service image..."
    docker compose build --no-cache payment-service
    print_success "payment-service image built"
}

image-billing() {
    print_info "Building billing-service image..."
    docker compose build --no-cache billing-service
    print_success "billing-service image built"
}

image-user() {
    print_info "Building user-service image..."
    docker compose build --no-cache user-service
    print_success "user-service image built"
}

image-frontend() {
    print_info "Building frontend image..."
    docker compose build --no-cache frontend
    print_success "frontend image built"
}

# Setup Stripe webhooks
setup_stripe_webhooks() {
    if ! command -v stripe &> /dev/null; then
        print_error "Stripe CLI not found. Run: ./build.sh init"
        return 1
    fi
    
    print_header "Setting up Stripe Webhooks"
    
    # Check if webhook secret already exists in .env
    if grep -q "^STRIPE_WEBHOOK_SECRET=whsec_" .env 2>/dev/null; then
        print_success "Stripe webhook secret already configured"
        
        # Check if webhook listener is already running
        if [ -f /tmp/stripe_webhook.pid ] && ps -p $(cat /tmp/stripe_webhook.pid) > /dev/null 2>&1; then
            print_success "Stripe webhook listener already running"
            return 0
        fi
    fi
    
    print_info "Starting Stripe webhook listener..."
    
    # Start stripe listen in background
    stripe listen --forward-to localhost:8082/payments/webhook --print-secret > /tmp/stripe_webhook.log 2>&1 &
    STRIPE_PID=$!
    echo $STRIPE_PID > /tmp/stripe_webhook.pid
    
    # Wait for webhook secret to be generated
    sleep 3
    
    # Extract webhook secret from output
    WEBHOOK_SECRET=$(grep -o 'whsec_[a-zA-Z0-9]*' /tmp/stripe_webhook.log | head -1)
    
    if [ -n "$WEBHOOK_SECRET" ]; then
        # Update .env file
        if grep -q "^STRIPE_WEBHOOK_SECRET=" .env 2>/dev/null; then
            sed -i.bak "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
            rm -f .env.bak
        else
            echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env
        fi
        
        print_success "Stripe webhook secret configured: $WEBHOOK_SECRET"
        print_success "Stripe webhook listener running (PID: $STRIPE_PID)"
        
        # Recreate payment service to pick up new webhook secret
        print_info "Recreating payment service with webhook secret..."
        docker compose up -d --force-recreate payment-service > /dev/null 2>&1
        sleep 5
        print_success "Payment service recreated"
        return 0
    else
        print_error "Failed to get webhook secret"
        kill $STRIPE_PID 2>/dev/null
        rm -f /tmp/stripe_webhook.pid
        return 1
    fi
}

# Stop Stripe webhooks
stop_stripe_webhooks() {
    if [ -f /tmp/stripe_webhook.pid ]; then
        STRIPE_PID=$(cat /tmp/stripe_webhook.pid)
        if ps -p $STRIPE_PID > /dev/null 2>&1; then
            print_info "Stopping Stripe webhook listener (PID: $STRIPE_PID)..."
            kill $STRIPE_PID 2>/dev/null
            rm -f /tmp/stripe_webhook.pid /tmp/stripe_webhook.log
            print_success "Stripe webhook listener stopped"
        fi
    fi
}

# Start containers
up() {
    print_header "Starting containers..."
    
    print_info "Starting Keycloak and MongoDB first..."
    docker compose up -d keycloak mongodb
    
    print_info "Waiting for Keycloak to be ready..."
    until curl -sf http://localhost:8180/realms/payasyougo > /dev/null 2>&1; do
        echo -n "."
        sleep 3
    done
    echo ""
    print_success "Keycloak is ready!"
    
    print_info "Starting all services..."
    docker compose up -d
    
    print_success "All containers started!"
    
    # Setup Stripe webhooks
    setup_stripe_webhooks
    
    echo ""
    print_info "Services:"
    print_info "  - Frontend: http://localhost:3000"
    print_info "  - Keycloak Admin: http://localhost:8180/admin (admin/admin)"
    print_info "  - Login with: testuser/test123 or admin/admin123"
    echo ""
    print_info "Check status with: docker compose ps"
}

# Stop containers
down() {
    print_header "Stopping containers..."
    
    # Stop Stripe webhooks first
    stop_stripe_webhooks
    
    docker compose down
    
    print_success "All containers stopped!"
}

# Show usage
usage() {
    echo "Usage: $0 [command] [command] ..."
    echo ""
    echo "Commands:"
    echo "  clean            - Clean all build artifacts"
    echo "  init             - Initialize dependencies"
    echo "  build            - Build all services"
    echo "  build-payment    - Build payment-service only"
    echo "  build-billing    - Build billing-service only"
    echo "  build-user       - Build user-service only"
    echo "  build-frontend   - Build frontend only"
    echo "  image            - Build all Docker images"
    echo "  image-payment    - Build payment-service image only"
    echo "  image-billing    - Build billing-service image only"
    echo "  image-user       - Build user-service image only"
    echo "  image-frontend   - Build frontend image only"
    echo "  up               - Start containers"
    echo "  down             - Stop containers"
    echo ""
    echo "Examples:"
    echo "  $0 clean init build image up"
    echo "  $0 build-user image-user"
    echo "  $0 build-frontend image-frontend"
    echo "  $0 down"
}

# Main script
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

# Execute commands in sequence
for cmd in "$@"; do
    case "$cmd" in
        clean)
            clean
            ;;
        init)
            init
            ;;
        build)
            build
            ;;
        build-payment)
            build-payment
            ;;
        build-billing)
            build-billing
            ;;
        build-user)
            build-user
            ;;
        build-frontend)
            build-frontend
            ;;
        image)
            image
            ;;
        image-payment)
            image-payment
            ;;
        image-billing)
            image-billing
            ;;
        image-user)
            image-user
            ;;
        image-frontend)
            image-frontend
            ;;
        up)
            up
            ;;
        down)
            down
            ;;
        *)
            print_error "Unknown command: $cmd"
            echo ""
            usage
            exit 1
            ;;
    esac
done

print_header "All commands completed successfully!"
