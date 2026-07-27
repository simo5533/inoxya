import { NextRequest, NextResponse } from "next/server"
import { getProductReviews } from "@/lib/reviews"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = String(searchParams.get("productId") || "").trim()

  if (!productId) {
    return NextResponse.json({ error: "productId requis" }, { status: 400 })
  }

  try {
    const reviews = await getProductReviews(productId)
    return NextResponse.json({ reviews }, { status: 200 })
  } catch (err) {
    logger.error("[GET /api/reviews]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
