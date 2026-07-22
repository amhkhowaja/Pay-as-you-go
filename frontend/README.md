# Pay As You Go - Frontend

Modern React frontend for the Pay As You Go SaaS platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Update Keycloak settings in `src/App.jsx`
- Update Stripe publishable key in `src/pages/Payment.jsx`

3. Run development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Features

- **Authentication**: Keycloak integration
- **Subscription Plans**: Browse and select plans
- **Payment**: Stripe payment integration
- **Dashboard**: View subscription status and use test service

## Architecture

- Black and white minimalist design
- Responsive layout
- Proxy configuration for backend services
- Secure payment flow with Stripe Elements
