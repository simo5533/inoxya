import { NextRequest, NextResponse } from "next/server"
import { executeQuery, initSqlJsAsync, selectRows } from "@/lib/sqlite"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TableColumn = { name?: string }

function hasColumn(columns: TableColumn[], columnName: string): boolean {
  return columns.some((col) => String(col.name || "").toLowerCase() === columnName.toLowerCase())
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = String(searchParams.get("productId") || "").trim()

  if (!productId) {
    return NextResponse.json({ error: "productId requis" }, { status: 400 })
  }

  try {
    await initSqlJsAsync()

    // Table standard locale (n'affecte pas les tables existantes avec autre structure).
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
      : (hasColumn(columns, "bijou_id") ? "bijou_id" : "product_id")
    const hasName = hasColumn(columns, "name")
    const hasCreatedAt = hasColumn(columns, "created_at")

    const reviews = selectRows(
      `
      SELECT
        id,
        ${idColumn} AS product_id,
        ${hasName ? "COALESCE(name, 'Client')" : "'Client'"} AS name,
        rating,
        comment,
        ${hasCreatedAt ? "created_at" : "CURRENT_TIMESTAMP"} AS created_at
      FROM reviews
      WHERE CAST(${idColumn} AS TEXT) = ?
      ORDER BY ${hasCreatedAt ? "datetime(created_at) DESC," : ""} id DESC
      `,
      [productId]
    )

    return NextResponse.json({ reviews }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
