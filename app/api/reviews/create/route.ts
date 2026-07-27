import { NextRequest, NextResponse } from "next/server"
import { createProductReview } from "@/lib/reviews"
import { requireCSRF } from "@/lib/security"
import { consumePublicRateLimit, getClientIp } from "@/lib/public-rate-limit"
import { reviewCreateSchema, validateWithSchema } from "@/lib/validations"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    const review = await createProductReview({ productId, name, rating, comment })

    return NextResponse.json({ ok: true, review }, { status: 200 })
  } catch (err) {
    logger.error("[POST /api/reviews/create]", err)
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
