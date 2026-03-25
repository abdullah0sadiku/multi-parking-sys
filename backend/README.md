# Parking Management API

Node.js (Express) + MySQL REST API for a multi-level parking system: levels, spots, vehicles, customers, sessions, subscriptions, billing, barriers, and incidents.

## Setup

1. Create a MySQL database and apply the schema:

   ```bash
   mysql -u root -p < sql/schema.sql
   ```

2. Copy `.env.example` to `.env` and set `MYSQL_*` and `JWT_SECRET`.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Create the first admin (only when `users` is empty):

   ```http
   POST /api/auth/bootstrap
   Content-Type: application/json

   { "email": "admin@example.com", "password": "your-secure-password" }
   ```

5. Login:

   ```http
   POST /api/auth/login
   Content-Type: application/json

   { "email": "admin@example.com", "password": "your-secure-password" }
   ```

Use `Authorization: Bearer <token>` on protected routes.

## Architecture

- **Controllers** — HTTP handling
- **Services** — business rules (sessions, subscriptions, invoicing, payments)
- **Repositories** — MySQL access (`mysql2` pool, parameterized queries)
- **Validation** — Zod
- **Auth** — JWT; roles: `admin`, `staff`

## Main endpoints

| Resource | Base path |
|----------|-----------|
| Auth | `/api/auth` |
| Parking levels | `/api/parking-levels` |
| Parking spots | `/api/parking-spots` |
| Customers | `/api/customers` |
| Vehicles | `/api/vehicles` |
| Tariffs | `/api/tariffs` |
| Sessions | `/api/sessions` |
| Subscriptions | `/api/subscriptions` |
| Invoices | `/api/invoices` |
| Payments | `/api/payments` |
| Barriers | `/api/barriers` |
| Incidents | `/api/incidents` |

### Session flow

- `POST /api/sessions` — start (assigns spot, marks occupied; optional `spot_id`, `level_id`, `tariff_id`).
- `PATCH /api/sessions/:id/end` — end (duration, tariff-based invoice, frees or re-reserves spot if subscription applies).

### Subscriptions

- `POST /api/subscriptions/:id/generate-invoice` — create a pending invoice from `monthly_fee` and VAT (tariff VAT or `VAT_DEFAULT_PERCENT`).

Health check: `GET /health`.
