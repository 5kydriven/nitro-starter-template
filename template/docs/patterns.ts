// ─────────────────────────────────────────────────────────────────────────────
// NITRO + SUPABASE + DRIZZLE — CODE PATTERNS
// Copy these patterns for every new feature.
// ─────────────────────────────────────────────────────────────────────────────


// ── 1. ZOD SCHEMA  (server/schemas/posts.ts) ─────────────────────────────────

import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  published: z.boolean().default(false),
}).strict()

export const updatePostSchema = createPostSchema.partial().strict()

// Use z.infer — never write a manual interface for the same shape
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

// Strip sensitive / internal fields before returning to the client
export const postResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  published: z.boolean(),
  authorId: z.string().uuid(),
  createdAt: z.date(),
})
export type PostResponse = z.infer<typeof postResponseSchema>


// ── 2. DRIZZLE SCHEMA  (server/db/schema/posts.ts) ───────────────────────────

import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull(), // FK → profiles.id
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Always export inferred types from the schema file
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert


// ── 3. SERVICE  (server/services/posts.service.ts) ───────────────────────────
// Business logic lives here. No HTTP context. No req/res.

import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { posts } from '../db/schema'
import type { CreatePostInput, UpdatePostInput } from '../schemas/posts'

export const postService = {

  async findAll(authorId: string) {
    return db.query.posts.findMany({
      where: eq(posts.authorId, authorId),
      orderBy: desc(posts.createdAt),
      // Select only columns the route needs — no over-fetching
      columns: { id: true, title: true, published: true, createdAt: true },
    })
  },

  async findById(id: string, authorId: string) {
    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.authorId, authorId)),
    })

    if (!post) {
      // Use createError — Nitro formats it correctly for the client
      throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    return post
  },

  async create(input: CreatePostInput, authorId: string) {
    const [post] = await db
      .insert(posts)
      .values({ ...input, authorId })
      .returning()
    return post
  },

  async update(id: string, input: UpdatePostInput, authorId: string) {
    // Verify ownership before updating
    await postService.findById(id, authorId)

    const [updated] = await db
      .update(posts)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
      .returning()

    return updated
  },

  async delete(id: string, authorId: string) {
    await postService.findById(id, authorId)
    await db.delete(posts).where(
      and(eq(posts.id, id), eq(posts.authorId, authorId))
    )
  },
}


// ── 4. ROUTES ─────────────────────────────────────────────────────────────────

// server/api/posts/index.get.ts  →  GET /api/posts
import { requireAuth } from '../../middleware/auth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)                           // throws 401 if no token
  return postService.findAll(user.id)
})

// ─────────────────────────────────────────────────────────

// server/api/posts/index.post.ts  →  POST /api/posts
import { requireAuth } from '../../middleware/auth'
import { createPostSchema } from '../../schemas/posts'
import { postService } from '../../services/posts.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, createPostSchema.parse)   // Zod throws 400 on bad input
  const post = await postService.create(body, user.id)
  setResponseStatus(event, 201)
  return post
})

// ─────────────────────────────────────────────────────────

// server/api/posts/[id].get.ts  →  GET /api/posts/:id
import { requireAuth } from '../../../middleware/auth'
import { postService } from '../../../services/posts.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const { id } = getRouterParams(event)
  return postService.findById(id, user.id)
})

// ─────────────────────────────────────────────────────────

// server/api/posts/[id].patch.ts  →  PATCH /api/posts/:id
import { requireAuth } from '../../../middleware/auth'
import { updatePostSchema } from '../../../schemas/posts'
import { postService } from '../../../services/posts.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const { id } = getRouterParams(event)
  const body = await readValidatedBody(event, updatePostSchema.parse)
  return postService.update(id, body, user.id)
})

// ─────────────────────────────────────────────────────────

// server/api/posts/[id].delete.ts  →  DELETE /api/posts/:id
import { requireAuth } from '../../../middleware/auth'
import { postService } from '../../../services/posts.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const { id } = getRouterParams(event)
  await postService.delete(id, user.id)
  setResponseStatus(event, 204)
})


// ── 5. MULTI-TABLE TRANSACTION  (inside a service) ───────────────────────────
// When you write to more than one table, always wrap in a transaction.

async function createPostWithTag(input: CreatePostInput, tagName: string, authorId: string) {
  return db.transaction(async (tx) => {
    const [post] = await tx.insert(posts).values({ ...input, authorId }).returning()

    // upsert the tag, then link it — all or nothing
    const [tag] = await tx
      .insert(tags)
      .values({ name: tagName })
      .onConflictDoUpdate({ target: tags.name, set: { name: tagName } })
      .returning()

    await tx.insert(postTags).values({ postId: post.id, tagId: tag.id })

    return post
  })
}


// ── 6. PUBLIC ROUTE (no auth required) ───────────────────────────────────────
// Just omit requireAuth. The middleware still runs but skips if no token present.

// server/api/posts/public.get.ts  →  GET /api/posts/public
export default defineEventHandler(async (_event) => {
  return db.query.posts.findMany({
    where: eq(posts.published, true),
    orderBy: desc(posts.createdAt),
    columns: { id: true, title: true, createdAt: true },
  })
})
