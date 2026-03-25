import { NextRequest, NextResponse } from "next/server"
import { executeQuery, initSqlJsAsync, selectRows } from "@/lib/sqlite"
import { requireCSRF } from "@/lib/security"
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit"
import { reviewCreateSchema, validateWithSchema } from "@/lib/validations"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TableColumn = { name?: string }

function hasColumn(columns: TableColumn[], columnName: string): boolean {
  return columns.some((col) => String(col.name || "").toLowerCase() === columnName.toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const ip = getClientIp(request)
    const rl = consumePublicRateLimit(`api:review:${ip}`, 8, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "RATE_LIMIT" },
        {
          status: 429,
          headers: rl.retryAfterSec ? { "Retry-After": String(rl.retryAfterSec) } : {},
        }
      )
    }

    const raw = await request.json().catch(() => null)
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 })
    }

    const parsed = validateWithSchema(reviewCreateSchema, raw)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_FAILED", details: parsed.errors },
        { status: 422 }
      )
    }

    const { productId, name, rating, comment } = parsed.data

    await initSqlJsAsync()

    executeQuery(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const columns = selectRows("PRAGMA table_info(reviews)") as TableColumn[]
    const idColumn = hasColumn(columns, "product_id")
      ? "product_id"
      : hasColumn(columns, "bijou_id")
        ? "bijou_id"
        : "product_id"
    const hasName = hasColumn(columns, "name")

    if (!hasName) {
      try {
        executeQuery("ALTER TABLE reviews ADD COLUMN name TEXT")
      } catch {
        // no-op
      }
    }

    const finalColumns = selectRows("PRAGMA table_info(reviews)") as TableColumn[]
    const finalHasName = hasColumn(finalColumns, "name")
    const safeName = (name && name.length > 0 ? name : "Client").slice(0, 80)

    if (finalHasName) {
      executeQuery(
        `INSERT INTO reviews (${idColumn}, name, rating, comment, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [productId, safeName, rating, comment]
      )
    } else {
      executeQuery(
        `INSERT INTO reviews (${idColumn}, rating, comment, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [productId, rating, comment]
      )
    }

    const createdReviewRows = selectRows(
      `
      SELECT id, ${idColumn} AS product_id, ${finalHasName ? "COALESCE(name, 'Client')" : "'Client'"} AS name, rating, comment, created_at
      FROM reviews
      WHERE CAST(${idColumn} AS TEXT) = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 1
      `,
      [productId]
    )

    const createdReview = createdReviewRows[0] ?? null
    return NextResponse.json({ ok: true, review: createdReview }, { status: 200 })
  } catch (err) {
    logger.error("[POST /api/reviews/create]", err)
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
