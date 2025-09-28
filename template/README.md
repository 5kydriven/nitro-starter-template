# Nitro starter

Look at the [nitro quick start](https://nitro.build/guide#quick-start) to learn more how to get started.

---

## 🔑 Environment Variables

Nitro automatically loads environment variables from `.env` and environment-specific files like `.env.development` or `.env.production`.

- Use **`.env`** for local development defaults (safe values).
- Create a **`.env.production`** file for secrets and production-only values.

Example:

```env
# .env
NITRO_SUPABASE_URL=http://localhost:54321
NITRO_SUPABASE_KEY=dev-key
```

---

# Run Supabase with Docker Locally

This guide helps you run a local Supabase stack (Postgres + Studio) using Docker.

---

## 🐳 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

---

## ⚙️ Setup

1. Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.6'

services:
  db:
    image: supabase/postgres:15.1.0.108
    ports:
      - '54322:5432'
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: postgres

  studio:
    image: supabase/studio:20250109-24efb39
    ports:
      - '54323:3000'
    environment:
      SUPABASE_URL: http://localhost:54321
      SUPABASE_ANON_KEY: dev-key
      SUPABASE_SERVICE_ROLE_KEY: dev-role-key
    depends_on:
      - db
```
