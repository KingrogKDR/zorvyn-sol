# zorvyn-sol

A backend API for a financial dashboard system, including JWT auth, role-based access, pagination, rate limiting, soft deletes, and scheduled cleanup.

---

## Table of Contents

- [zorvyn-sol](#zorvyn-sol)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
  - [Design Decisions](#design-decisions)
  - [Database Schema](#database-schema)
    - [Users](#users)
    - [Role](#role)
    - [Records](#records)
  - [Setup](#setup)
  - [API Reference](#api-reference)
    - [Auth](#auth)
    - [Records](#records-1)
    - [Users](#users-1)
    - [Dashboard Analytics](#dashboard-analytics)
  - [Tradeoffs](#tradeoffs)
  - [Assumptions](#assumptions)

---

## Architecture

![Architecture](images/architecture.png)

---

## Design Decisions

**Layered architecture** — controllers handle request/response, services own business logic, repositories abstract the database.

**JWT authentication** — stateless, token passed via `Authorization` header. No server-side sessions. Tokens are valid until expiry; no blacklist is implemented.

**Token bucket rate limiting** — allows controlled bursts, applied at the middleware level. In future, a shared store (e.g. Redis) can be used for scaling to production.

**Pagination** — `page` and `limit` query params on all list endpoints. Simple offset-based; not optimal for very large datasets.

**Soft delete + scheduled cleanup** — deletion sets `deleted_at`. All queries filter `WHERE deleted_at IS NULL`. A cron job permanently removes records older than 30 days.

---

## Database Schema

### Users

| Field      | Type     | Description                              |
| ---------- | -------- | ---------------------------------------- |
| id         | integer  | Primary key (auto-incremented)           |
| email      | string   | Unique (unless soft-deleted)             |
| password   | string   | Hashed                                   |
| role_id    | integer  | maps to `VIEWER` / `ANLAYST` / `ADMIN`   |
| status     | enum     | `active` / `inactive` (default `active`) |
| deleted_at | datetime | Soft delete marker                       |
| created_at | datetime | Audit timestamp                          |

### Role

| Field     | Type    | Description                    |
| --------- | ------- | ------------------------------ |
| id        | integer | Primary key (auto-incremented) |
| role_name | string  | `viewer` / `analyst` / `admin` |

### Records

| Field      | Type     | Description                                              |
| ---------- | -------- | -------------------------------------------------------- |
| id         | integer  | Primary key (auto-incremented)                           |
| user_id    | integer  | Owner reference                                          |
| amount     | number   | Transaction value (>= 0)                                 |
| type       | enum     | `INCOME` / `EXPENSE`                                     |
| category   | string   | User-defined                                             |
| date       | integer  | user can define as a string value in `dd-mm-yyyy` format |
| notes      | string   | Optional                                                 |
| created_at | datetime | Audit timestamp                                          |
| updated_at | datetime | Update marker                                            |
| deleted_at | datetime | Soft delete marker                                       |

> Used indexes:
> `idx_user_type ON records(user_id, type)`,
> `idx_user_category ON records(user_id, category)`,
> `idx_user_date ON records(user_id, date)`,
> `idx_users_email_active ON users(email) WHERE deleted_at IS NULL` (makes active emails unique)

---

## Setup

```bash
git clone git@github.com:KingrogKDR/vyn-sol.git
# if ssh is not configured: git clone https://github.com/KingrogKDR/vyn-sol.git
npm install
```

Create a `.env` file and copy the `.env.example` file format:

```env
PORT=YOUR_PORT
JWT_SECRET=YOUR_JWT_SECRET
ADMIN_EMAIl=ADMIN_EMAIl
ADMIN_PASSWORD=ADMIN_PASSWORD
```

```bash
npm run dev         # start server
npm test            # run tests
sqlite3 ./zorvyn.db # to access the database in the cli
```

> The cron job currently runs only when the server runs and not in the background.

---

## API Reference

All record and summary routes require `Authorization: Bearer <token>`.

### Auth

```
POST /api/auth/register   { email, password } -> { token } stored as a cookie
{
  "email": "user@test.com",
  "password": "password123"
}

POST /api/auth/login      → { token } stored as a cookie
{
  "email": "user@test.com",
  "password": "password123"
}

POST /api/auth/logout     → removes { token }
```

### Records

```
POST   /api/records
{
  "amount": 500,
  "type": "EXPENSE",
  "category": "food",
  "date": 1710000000,
  "notes": "Lunch"
}

GET    /api/records?type=EXPENSE&category=Food&page=1&limit=10
PATCH  /api/records/:id
DELETE /api/records/:id (soft-delete)
```

### Users

```
POST    /api/users
{
  "email": "newuser@test.com",
  "password": "password123",
  "role": "admin"
}

GET     /api/users
GET     /api/users/:id
PATCH   /api/users/:id
{
  "role": "analyst",
  "status": "inactive"
}

DELETE  /api/users/:id
```

### Dashboard Analytics

```
GET /api/dashboard/summary
GET /api/dashboard/categories
GET /api/dashboard/recent
GET /api/dashboard/monthly-trends
GET /api/dashboard/weekly-trends

```

---

## Tradeoffs

| Decision                   | Pro                                  | Con                                       |
| -------------------------- | ------------------------------------ | ----------------------------------------- |
| JWT auth                   | Stateless, scalable                  | Hard to revoke; requires expiry handling  |
| Token bucket rate limiting | Handles bursts                       | Needs shared store (Redis); adds overhead |
| Offset pagination          | Simple                               | Degrades at large offsets                 |
| Soft delete                | Recovery window, audit trail         | Queries need consistent filtering         |
| Cron cleanup               | Offloads deletion from request cycle | Storage overhead; requires monitoring     |

---

## Assumptions

- Single currency
- Categories are free-form strings
- Rate limiting is per user for private routes and IP for public routes
- No concurrency control
- Moderate dataset size — no sharding needed
