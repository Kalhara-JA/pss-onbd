# Profit Shareholder™ System (PSS) – Contributor Onboarding (Tier 2)

A secure, production-ready NestJS backend module for inviting and registering platform contributors.
Implements JWT-based auth, RBAC, rate limiting, audit trails, AES-256 encryption, and non-root Docker builds.

---

## Table of Contents

- [Features](#features)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

  - [Clone & Install](#clone--install)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Seed Admin User](#seed-admin-user)
  - [Run Locally](#run-locally)

- [Docker](#docker)
- [API Reference](#api-reference)

  - [Auth](#auth)

    - `POST /auth/login`

  - [Contributors](#contributors)

    - `POST /invite-contributor`
    - `POST /register`
    - `GET /registration-status/:id`

- [Security & Compliance](#security--compliance)
- [Testing](#testing)
- [Assumptions & Notes](#assumptions--notes)

---

## Features

- **Invite Flow**: Admin-only endpoint to generate time-limited invitation tokens
- **Registration**: Token-based contributor signup with `pending_approval` status
- **JWT Auth**: Passport + `@nestjs/jwt`
- **RBAC**: Route-level guard for Admin, Contributor, Auditor roles
- **Rate Limiting**: 10 requests/minute per IP via `@nestjs/throttler`
- **Audit Trail**: Middleware logs every request (timestamp, user ID, IP, endpoint, status)
- **AES-256 Encryption**: Sensitive fields (e.g. bank account) encrypted at rest
- **Non-Root Docker**: Secure container user setup
- **OpenAPI (Swagger)**: Full API docs under `/api`
- **Unit Tests**: Jest coverage for services, controllers, guards, middleware

---

## Directory Structure

```
pss-contributor-onboarding/
├── Dockerfile
├── .env.example
├── README.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── roles.decorator.ts
│   │   ├── roles.guard.ts
│   │   └── rate-limit.guard.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── contributor/
│   │   ├── contributor.module.ts
│   │   ├── contributor.service.ts
│   │   ├── contributor.controller.ts
│   │   └── dto/
│   │       ├── invite-contributor.dto.ts
│   │       └── register-contributor.dto.ts
│   └── audit/
│       ├── audit.module.ts
│       └── audit.service.ts
└── test/
    ├── contributor.service.spec.ts
    ├── contributor.controller.spec.ts
    ├── auth.service.spec.ts
    ├── roles.guard.spec.ts
    └── audit.middleware.spec.ts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 8 (or Yarn)
- **PostgreSQL** ≥ 12 (or SQLite for in-memory simulation)
- **Docker** & **Docker Compose** (optional)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```dotenv
# Server
PORT=3000

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600s

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/pss?schema=public

# AES Encryption Key (32 bytes hex)
AES_KEY=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff
```

---

## Getting Started

### Clone & Install

```bash
git clone https://github.com/Kalhara-JA/pss-onbd.git
cd pss-onbd
npm install
```

### Database Setup & Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (PostgreSQL) or use SQLite in-memory
npx prisma migrate dev --name init
```

### Seed Admin User

Create an initial Admin contributor for testing:

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('AdminPassword123', 10);
  await prisma.contributor.upsert({
    where: { email: 'admin@pss.com' },
    update: {},
    create: {
      email: 'admin@pss.com',
      name: 'Platform Admin',
      password,
      role: 'Admin',
      status: 'approved',
      bankAccount: '',
    },
  });
}

main();
```

Run:

```bash
npm run db:seed
```

### Run Locally

```bash
npm run start:dev
```

- Swagger UI: `http://localhost:3000/api`
- Invite endpoint protected by Bearer token

---

## Docker

Build and run:

```bash
docker build -t pss-onbd .
docker run --env-file .env -p 3000:3000 pss-onbd
```

**Non-root user** is configured in the `Dockerfile` for improved security.

---

## API Reference

### Auth

#### `POST /auth/login`

Authenticate and receive JWT.

- **Body**

  ```json
  {
    "email": "admin@pss.com",
    "password": "AdminPassword123"
  }
  ```

- **Response**

  ```json
  {
    "access_token": "eyJ..."
  }
  ```

### Contributors

All `/invite-contributor` endpoints require `Authorization: Bearer <token>` with an Admin JWT.

#### `POST /invite-contributor`

Invite a new contributor.

- **Body**

  ```json
  {
    "email": "user@example.com",
    "role": "pgc",
    "department": "dev-team"
  }
  ```

- **Response**

  ```json
  {
    "token": "abc123...",
    "expiresAt": "2025-05-16T12:00:00.000Z"
  }
  ```

#### `POST /register`

Register using invitation token.

- **Body**

  ```json
  {
    "token": "abc123...",
    "name": "Alice",
    "password": "securePass",
    "role": "npgc"
  }
  ```

- **Response**

  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "status": "pending_approval"
  }
  ```

#### `GET /registration-status/:id`

Check contributor’s registration status.

- **Response**

  ```json
  { "status": "pending_approval" }
  ```

---

## Security & Compliance

- **JWT** with Passport and strong secret
- **RBAC** via custom `RolesGuard`
- **Rate Limiting** (10 req/min)
- **Input Validation** with `class-validator`
- **Audit Trail** logs in `AuditLog` table
- **AES-256 Encryption** for sensitive data
- **Non-Root Docker** user

---

## Testing

Run unit tests:

```bash
npm run test
```

Tests cover:

- Service methods (`invite`, `register`, `status`)
- Controllers delegation
- AuthService token issuance
- RolesGuard logic
- Audit middleware logging

---

Happy coding! 🚀 If you run into issues, please open a GitHub issue in the repository.
