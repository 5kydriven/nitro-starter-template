# Architecture & coding standards

Stack: **NitroJS · Supabase (Auth + Postgres) · Drizzle ORM · Zod · TypeScript**  
Team: 1–2 devs · Scrum · MVP-first, built to scale

---

## Philosophy

> Two layers, not five. Routes call services. Services call Drizzle or Supabase. That's it.

This architecture is deliberately flat. No repository layer, no use-case classes, no DI containers. If the project grows and a third layer becomes necessary, add it then — not now.

---

## Folder structure

```
server/
├── api/                    # Route handlers — one file per endpoint
│   ├── auth/
│   │   ├── register.post.ts
│   │   ├── login.post.ts
│   │   └── logout.post.ts
│   └── users/
│       └── me.get.ts
│
├── middleware/
│   └── auth.ts             # JWT verification — runs on every request
│
├── services/               # Business logic — called by routes
│   └── auth.service.ts
│
├── db/
│   ├── index.ts            # Single Drizzle instance export
│   └── schema/
│       ├── index.ts
│       └── profiles.ts     # One file per table
│
├── schemas/                # All Zod schemas — single source of truth
│   └── auth.ts
│
├── lib/
│   └── supabase.ts         # Supabase client singletons (admin + anon)
│
└── config.ts               # Reads + validates all env vars with Zod

drizzle/                    # Migration files — always committed
drizzle.config.ts
.env.example
```

---

## The two-layer rule

```
Request
  └─▶ middleware/auth.ts      (verify JWT, attach user to context)
        └─▶ api/**/*.ts       (validate input with Zod, call service, return)
              └─▶ services/   (business logic — calls Drizzle or Supabase)
                    ├─▶ db/   (Drizzle queries)
                    └─▶ lib/supabase.ts  (Supabase Auth calls)
```

**Hard rules:**
- Routes never query Drizzle directly
- Routes never call Supabase directly
- Services never read `event` or HTTP headers
- Middleware never contains business logic

---

## Route conventions

File naming drives HTTP method registration automatically in Nitro:

```
api/users/index.get.ts      → GET  /api/users
api/users/index.post.ts     → POST /api/users
api/users/[id].get.ts       → GET  /api/users/:id
api/users/[id].delete.ts    → DELETE /api/users/:id
```

Every route follows the same 3-line pattern:

```ts
// 1. validate input
// 2. call service
// 3. return result
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createUserSchema.parse)
  const result = await userService.create(body)
  setResponseStatus(event, 201)
  return result
})
```

Routes that require auth call `requireAuth(event)` at the top — it throws 401 if no valid token.

---

## Service conventions

Services are plain objects with async methods. No classes, no decorators.

```ts
export const thingService = {
  async findById(id: string) { ... },
  async create(input: CreateThingInput) { ... },
}
```

- Throw `createError({ statusCode, statusMessage })` for expected failures (not found, conflict, etc.)
- Let unexpected errors bubble up — Nitro catches and returns 500
- Never accept raw `event` as a parameter

---

## Zod conventions

- All schemas live in `server/schemas/`
- Use `z.infer<typeof schema>` for types — never duplicate with a manual interface
- Input schemas use `.strict()` to reject unexpected fields
- Output schemas use `.omit()` to strip sensitive fields before returning

```ts
export const createUserSchema = z.object({ ... }).strict()
export type CreateUserInput = z.infer<typeof createUserSchema>
```

---

## Drizzle conventions

- One file per table in `server/db/schema/`
- Use `typeof table.$inferSelect` and `.$inferInsert` for types
- Always commit migration files — never use `drizzle-kit push` in production
- `drizzle.config.ts` uses `DATABASE_DIRECT_URL` (port 5432) for migrations
- Runtime queries use `DATABASE_URL` (pooled, port 6543)
- Wrap multi-table writes in `db.transaction()`

---

## Supabase conventions

- `supabaseAdmin` (service role) — for user creation, JWT verification, session revocation
- `supabaseAnon` (anon key) — for sign in / sign out
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to any client
- `profiles` table is linked to `auth.users.id` — Supabase owns identity, Drizzle owns profile data

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Route files | Nitro method suffix | `[id].get.ts` |
| Service files | `name.service.ts` | `auth.service.ts` |
| Schema files | domain name | `auth.ts`, `posts.ts` |
| Zod schemas | `camelCase` + `Schema` | `createPostSchema` |
| Inferred types | `PascalCase` | `CreatePostInput` |
| Drizzle tables | `camelCase` export | `profiles`, `posts` |
| Boolean vars | `is/has/can` prefix | `isExpired`, `hasProfile` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |

---

## Git workflow

### Branch naming
```
feat/PROJ-12-user-profile
fix/PROJ-34-jwt-expiry
chore/PROJ-40-upgrade-drizzle
```

### Commit format
```
feat(auth): add logout endpoint
fix(profiles): return 404 when profile missing
chore(deps): upgrade drizzle-orm
```

### PR checklist
- [ ] Ticket ID in branch name and PR title
- [ ] Zod schema covers all inputs
- [ ] Migration file committed (if schema changed)
- [ ] No `console.log`, no `process.env` outside `config.ts`
- [ ] CI green (lint + typecheck)

---

## Definition of Done

- Feature works end to end
- Input validated with Zod
- Errors use `createError()`
- No Drizzle queries in route files
- Migration committed if schema changed
- ESLint + `tsc --noEmit` pass

---

## Adding a new feature

1. Add Zod schema to `server/schemas/your-feature.ts`
2. Add Drizzle schema to `server/db/schema/your-feature.ts`, run `drizzle-kit generate`
3. Add service to `server/services/your-feature.service.ts`
4. Add routes to `server/api/your-feature/`
5. Done — no other files to touch

---

## What deliberately doesn't exist

| Pattern | Why skipped |
|---|---|
| Repository layer | Services + Drizzle is flat enough for 1–2 devs |
| Dependency injection | Adds ceremony with no benefit at this scale |
| Event bus / queue | Add when you have an async workload that needs it |
| Separate DTO classes | `z.infer<>` covers it |
| Global error handler class | Nitro's built-in + `createError()` is sufficient |
