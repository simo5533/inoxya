/**
 * Avis clients (notes 1–5) — Postgres / Supabase / SQLite
 */
import 'server-only'

import { Pool } from 'pg'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IS_PRODUCTION } from '@/lib/env'
import { logger } from '@/lib/logger'

export type ProductReview = {
  id: string | number
  name: string
  rating: number
  comment: string
  created_at?: string
}

export type ProductRatingStats = {
  rating: number
  reviewsCount: number
}

let pgPool: Pool | null = null
let supabaseClient: SupabaseClient | null = null

function getPgPool(): Pool | null {
  const url = process.env['DATABASE_URL']?.trim()
  if (!url || !/^postgres/i.test(url)) return null
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: url,
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return pgPool
}

function getSupabase(): SupabaseClient | null {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim()
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim()
  if (!url || !key) return null
  if (!supabaseClient) {
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

async function ensurePgReviewsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id TEXT,
      bijou_id INTEGER,
      name TEXT DEFAULT 'Client',
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      is_approved BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  // Colonnes optionnelles si table déjà existante (schéma historique)
  await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id TEXT`)
  await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS name TEXT`)
  await pool.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE`)
}

async function refreshProductRatingPg(pool: Pool, productId: string): Promise<ProductRatingStats> {
  const stats = await pool.query<{ avg: string | null; count: string }>(
    `
    SELECT AVG(rating)::float AS avg, COUNT(*)::text AS count
    FROM reviews
    WHERE (
      CAST(COALESCE(product_id, '') AS TEXT) = $1
      OR CAST(COALESCE(bijou_id, 0) AS TEXT) = $1
    )
    AND COALESCE(is_approved, TRUE) = TRUE
    `,
    [productId]
  )
  const row = stats.rows[0]
  const reviewsCount = Number(row?.count || 0)
  const rating = reviewsCount > 0 ? Math.round((Number(row?.avg) || 0) * 10) / 10 : 0

  try {
    await pool.query(
      `UPDATE products SET rating = $1, reviews_count = $2 WHERE CAST(id AS TEXT) = $3`,
      [rating, reviewsCount, productId]
    )
  } catch (e) {
    logger.warn('[reviews] Impossible de mettre à jour products.rating', {
      error: e instanceof Error ? e.message : String(e),
    })
  }

  return { rating, reviewsCount }
}

async function listReviewsPg(pool: Pool, productId: string): Promise<ProductReview[]> {
  await ensurePgReviewsTable(pool)
  const result = await pool.query<{
    id: number
    name: string | null
    rating: number
    comment: string | null
    created_at: Date | string | null
  }>(
    `
    SELECT id, COALESCE(NULLIF(TRIM(name), ''), 'Client') AS name, rating, COALESCE(comment, '') AS comment, created_at
    FROM reviews
    WHERE (
      CAST(COALESCE(product_id, '') AS TEXT) = $1
      OR CAST(COALESCE(bijou_id, 0) AS TEXT) = $1
    )
    AND COALESCE(is_approved, TRUE) = TRUE
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 100
    `,
    [productId]
  )
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name || 'Client',
    rating: Number(r.rating) || 0,
    comment: r.comment || '',
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
  }))
}

async function createReviewPg(
  pool: Pool,
  input: { productId: string; name: string; rating: number; comment: string }
): Promise<ProductReview> {
  await ensurePgReviewsTable(pool)
  const productIdNum = Number(input.productId)
  const hasNumericId = Number.isFinite(productIdNum) && productIdNum > 0

  const result = await pool.query<{
    id: number
    name: string | null
    rating: number
    comment: string | null
    created_at: Date | string | null
  }>(
    `
    INSERT INTO reviews (product_id, bijou_id, name, rating, comment, is_approved, created_at)
    VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
    RETURNING id, name, rating, comment, created_at
    `,
    [
      input.productId,
      hasNumericId ? Math.floor(productIdNum) : null,
      input.name,
      input.rating,
      input.comment,
    ]
  )

  await refreshProductRatingPg(pool, input.productId)
  const row = result.rows[0]
  return {
    id: row?.id ?? Date.now(),
    name: row?.name || input.name,
    rating: Number(row?.rating) || input.rating,
    comment: row?.comment || input.comment,
    created_at: row?.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }
}

async function listReviewsSupabase(
  client: SupabaseClient,
  productId: string
): Promise<ProductReview[]> {
  const idNum = Number(productId)
  let query = client
    .from('reviews')
    .select('id, name, rating, comment, created_at, product_id, bijou_id, is_approved')
    .order('created_at', { ascending: false })
    .limit(100)

  if (Number.isFinite(idNum) && idNum > 0) {
    query = query.or(`product_id.eq.${productId},bijou_id.eq.${Math.floor(idNum)}`)
  } else {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query
  if (error) {
    logger.warn('[reviews] Supabase list:', { error: error.message })
    return []
  }

  return (data || [])
    .filter((r) => r.is_approved !== false)
    .map((r) => ({
      id: r.id as string | number,
      name: (r.name as string) || 'Client',
      rating: Number(r.rating) || 0,
      comment: (r.comment as string) || '',
      created_at: r.created_at ? String(r.created_at) : undefined,
    }))
}

async function createReviewSupabase(
  client: SupabaseClient,
  input: { productId: string; name: string; rating: number; comment: string }
): Promise<ProductReview> {
  const idNum = Number(input.productId)
  const payload: Record<string, unknown> = {
    product_id: input.productId,
    name: input.name,
    rating: input.rating,
    comment: input.comment,
    is_approved: true,
  }
  if (Number.isFinite(idNum) && idNum > 0) {
    payload['bijou_id'] = Math.floor(idNum)
  }

  const { data, error } = await client.from('reviews').insert(payload).select('id, name, rating, comment, created_at').single()
  if (error) {
    // Schéma sans product_id / name
    const fallback: Record<string, unknown> = {
      rating: input.rating,
      comment: input.comment,
      is_approved: true,
    }
    if (Number.isFinite(idNum) && idNum > 0) fallback['bijou_id'] = Math.floor(idNum)
    const retry = await client.from('reviews').insert(fallback).select('id, rating, comment, created_at').single()
    if (retry.error) throw new Error(retry.error.message)
    await refreshProductRatingSupabase(client, input.productId)
    return {
      id: retry.data?.id ?? Date.now(),
      name: input.name,
      rating: Number(retry.data?.rating) || input.rating,
      comment: (retry.data?.comment as string) || input.comment,
      created_at: retry.data?.created_at ? String(retry.data.created_at) : new Date().toISOString(),
    }
  }

  await refreshProductRatingSupabase(client, input.productId)
  return {
    id: data?.id ?? Date.now(),
    name: (data?.name as string) || input.name,
    rating: Number(data?.rating) || input.rating,
    comment: (data?.comment as string) || input.comment,
    created_at: data?.created_at ? String(data.created_at) : new Date().toISOString(),
  }
}

async function refreshProductRatingSupabase(
  client: SupabaseClient,
  productId: string
): Promise<ProductRatingStats> {
  const reviews = await listReviewsSupabase(client, productId)
  const reviewsCount = reviews.length
  const rating =
    reviewsCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount) * 10) / 10
      : 0
  await client
    .from('products')
    .update({ rating, reviews_count: reviewsCount })
    .eq('id', Number.isFinite(Number(productId)) ? Number(productId) : productId)
  return { rating, reviewsCount }
}

async function listReviewsSqlite(productId: string): Promise<ProductReview[]> {
  const { executeQuery, initSqlJsAsync, selectRows } = await import('@/lib/sqlite')
  await initSqlJsAsync()
  executeQuery(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const columns = selectRows('PRAGMA table_info(reviews)') as Array<{ name?: string }>
  const names = columns.map((c) => String(c.name || '').toLowerCase())
  const idColumn = names.includes('product_id')
    ? 'product_id'
    : names.includes('bijou_id')
      ? 'bijou_id'
      : 'product_id'
  const hasName = names.includes('name')
  const hasCreatedAt = names.includes('created_at')
  const rows = selectRows(
    `
    SELECT
      id,
      ${hasName ? "COALESCE(NULLIF(TRIM(name), ''), 'Client')" : "'Client'"} AS name,
      rating,
      COALESCE(comment, '') AS comment,
      ${hasCreatedAt ? 'created_at' : 'CURRENT_TIMESTAMP'} AS created_at
    FROM reviews
    WHERE CAST(${idColumn} AS TEXT) = ?
    ORDER BY ${hasCreatedAt ? 'datetime(created_at) DESC,' : ''} id DESC
    LIMIT 100
    `,
    [productId]
  ) as Array<{ id: number; name: string; rating: number; comment: string; created_at?: string }>

  return rows.map((r) => ({
    id: r.id,
    name: r.name || 'Client',
    rating: Number(r.rating) || 0,
    comment: r.comment || '',
    created_at: r.created_at,
  }))
}

async function createReviewSqlite(input: {
  productId: string
  name: string
  rating: number
  comment: string
}): Promise<ProductReview> {
  const { executeQuery, initSqlJsAsync, selectRows } = await import('@/lib/sqlite')
  await initSqlJsAsync()
  executeQuery(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const columns = selectRows('PRAGMA table_info(reviews)') as Array<{ name?: string }>
  const names = columns.map((c) => String(c.name || '').toLowerCase())
  if (!names.includes('name')) {
    try {
      executeQuery('ALTER TABLE reviews ADD COLUMN name TEXT')
    } catch {
      /* ignore */
    }
  }
  const idColumn = names.includes('product_id')
    ? 'product_id'
    : names.includes('bijou_id')
      ? 'bijou_id'
      : 'product_id'

  executeQuery(
    `INSERT INTO reviews (${idColumn}, name, rating, comment, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [input.productId, input.name, input.rating, input.comment]
  )

  const stats = selectRows(
    `SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE CAST(${idColumn} AS TEXT) = ?`,
    [input.productId]
  ) as Array<{ avg?: number; count?: number }>
  const reviewsCount = Number(stats[0]?.count || 0)
  const rating = reviewsCount > 0 ? Math.round((Number(stats[0]?.avg) || 0) * 10) / 10 : 0
  try {
    executeQuery(`UPDATE products SET rating = ?, reviews_count = ? WHERE CAST(id AS TEXT) = ?`, [
      rating,
      reviewsCount,
      input.productId,
    ])
  } catch {
    /* colonne absente */
  }

  const created = selectRows(
    `SELECT id, name, rating, comment, created_at FROM reviews WHERE CAST(${idColumn} AS TEXT) = ? ORDER BY id DESC LIMIT 1`,
    [input.productId]
  ) as Array<ProductReview>

  return (
    created[0] || {
      id: Date.now(),
      name: input.name,
      rating: input.rating,
      comment: input.comment,
      created_at: new Date().toISOString(),
    }
  )
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const id = String(productId || '').trim()
  if (!id) return []

  const pool = getPgPool()
  if (pool) {
    try {
      return await listReviewsPg(pool, id)
    } catch (e) {
      logger.error('[getProductReviews] Postgres:', e)
      if (IS_PRODUCTION) return []
    }
  }

  const supabase = getSupabase()
  if (supabase) {
    try {
      return await listReviewsSupabase(supabase, id)
    } catch (e) {
      logger.error('[getProductReviews] Supabase:', e)
      if (IS_PRODUCTION) return []
    }
  }

  if (IS_PRODUCTION) return []
  try {
    return await listReviewsSqlite(id)
  } catch (e) {
    logger.error('[getProductReviews] SQLite:', e)
    return []
  }
}

export async function getProductRatingStats(productId: string): Promise<ProductRatingStats> {
  const reviews = await getProductReviews(productId)
  const reviewsCount = reviews.length
  if (reviewsCount === 0) return { rating: 0, reviewsCount: 0 }
  const rating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount) * 10) / 10
  return { rating, reviewsCount }
}

export async function createProductReview(input: {
  productId: string
  name?: string | null
  rating: number
  comment?: string | null
}): Promise<ProductReview> {
  const productId = String(input.productId || '').trim()
  const name = (input.name && input.name.trim()) || 'Client'
  const rating = Math.max(1, Math.min(5, Math.floor(Number(input.rating) || 0)))
  const comment = (input.comment && input.comment.trim()) || 'Note uniquement'

  if (!productId || rating < 1) {
    throw new Error('INVALID_REVIEW')
  }

  const payload = { productId, name: name.slice(0, 80), rating, comment: comment.slice(0, 2000) }

  const pool = getPgPool()
  if (pool) {
    return createReviewPg(pool, payload)
  }

  const supabase = getSupabase()
  if (supabase) {
    return createReviewSupabase(supabase, payload)
  }

  if (IS_PRODUCTION) {
    throw new Error('DB_UNAVAILABLE')
  }
  return createReviewSqlite(payload)
}
