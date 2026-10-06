# Pay As You Go

A microservices-based billing platform with Stripe integration, Keycloak authentication, and a React frontend.

## Services

| Service | Port | Description |
|---|---|---|
| Frontend | 3000 | React + Vite UI |
| User Service | 8081 | Java Spring Boot, user management |
| Billing Service | 8080 | Java Spring Boot, billing logic |
| Payment Service | 8082 | Java Spring Boot, Stripe integration |
| Cron Service | 8083 | Python, scheduled jobs |
| Keycloak | 8180 | Authentication |
| PostgreSQL | 5432 | Database |
| RabbitMQ | 5672 | Message broker |

## Requirements

- Java 21+
- Node.js 18+
- Docker and Docker Compose
- Stripe CLI (for webhooks)

## Setup

**1. Clone and configure environment**

```bash
cp .env.example .env
```

Edit `.env` and add your Stripe test keys from https://dashboard.stripe.com/test/apikeys.

**2. Build and start**

```bash
./build.sh build image up
```

This compiles all Java services and the frontend, builds Docker images, and starts all containers.

For a fresh environment, run `init` first to verify all prerequisites:

```bash
./build.sh init build image up
```

**3. Open the app**

```
http://localhost:3000
```

## Default Credentials

Keycloak Admin: http://localhost:8180/admin
- Username: `admin`
- Password: `admin`

App login:
- `testuser` / `test123`
- `admin` / `admin123`

## Build Commands

```bash
./build.sh clean          # Remove all build artifacts
./build.sh init           # Check prerequisites
./build.sh build          # Compile all services
./build.sh image          # Build Docker images
./build.sh up             # Start containers
./build.sh down           # Stop containers

# Build individual services
./build.sh build-payment
./build.sh build-billing
./build.sh build-user
./build.sh build-frontend
```

## Notes

- On Linux, `host.docker.internal` does not resolve inside containers. The `docker-compose.yml` uses the container name `payasyougo-keycloak` for JWT validation instead.
- Stripe webhook secret is automatically configured by `./build.sh up`.
- Port 8080 is used by billing-service. Stop any other container using that port before starting.
