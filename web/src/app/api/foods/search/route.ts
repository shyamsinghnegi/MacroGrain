import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { like, inArray } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { searchFoodsByName } from "@/lib/open-food-facts"
import { searchUsdaFoods } from "@/lib/usda"
import { NextRequest } from "next/server"

const PAGE_SIZE = 15

type Food = InferSelectModel<typeof foods>

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response(null, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q) {
    return Response.json({ results: [], nextOffset: null })
  }

  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0") || 0

  // Every page queries Open Food Facts for that same page (its `page` is
  // 1-indexed, ours is an offset), not just the first - otherwise "See more
  // results" ran out after one page's worth of hits ever got cached, even
  // though OFF has far more matches available (confirmed directly: OFF's
  // page 2 for "dal" returns different real hits, not a repeat of page 1).
  const offPage = Math.floor(offset / PAGE_SIZE) + 1

  // USDA doesn't depend on OFF's results (or vice versa) - firing both
  // requests together instead of sequentially roughly halves the external
  // API wait on the first page, which is the dominant cost of every search.
  const usdaEnabled = offset === 0 && !!process.env.USDA_API_KEY
  const [{ results: hits, totalCount, rawHitCount }, usdaOutcome] = await Promise.all([
    searchFoodsByName(q, offPage, PAGE_SIZE),
    usdaEnabled
      ? searchUsdaFoods(q, PAGE_SIZE).catch((e) => {
          console.error("[foods/search] USDA lookup failed:", e)
          return null
        })
      : Promise.resolve(null),
  ])

  console.log(
    `[foods/search] q="${q}" page=${offPage} -> OFF raw hits=${rawHitCount}, usable (complete nutrition)=${hits.length}, OFF total matches=${totalCount}`
  )

  const barcodes = hits.map((h) => h.barcode)
  const usdaHits = usdaOutcome?.results ?? []
  const fdcIds = usdaHits.map((h) => h.fdcId)

  // These three D1 round-trips are independent of each other (OFF-barcode
  // cache lookup, USDA-fdcId cache lookup, local name search) - running them
  // together instead of one-after-another cuts this handler's D1 wait
  // roughly to the cost of the single slowest one instead of the sum of all
  // three, on top of the OFF/USDA fetch already parallelized above.
  const [alreadyCached, cachedUsda, localMatches] = await Promise.all([
    barcodes.length
      ? db.query.foods.findMany({ where: inArray(foods.barcode, barcodes) })
      : Promise.resolve<Food[]>([]),
    fdcIds.length
      ? db.query.foods.findMany({ where: inArray(foods.fdcId, fdcIds) })
      : Promise.resolve<Food[]>([]),
    offset === 0
      ? // Postgres's `ilike` doesn't exist in SQLite (D1) - it's a hard SQL
        // syntax error there. SQLite's plain `LIKE` is already case-insensitive
        // for ASCII by default, so `like()` is the correct equivalent here.
        db.select().from(foods).where(like(foods.name, `%${q}%`)).limit(PAGE_SIZE)
      : Promise.resolve<Food[]>([]),
  ])
  const cachedBarcodes = new Set(alreadyCached.map((f) => f.barcode))

  const toInsert = hits.filter((h) => !cachedBarcodes.has(h.barcode))

  // D1 caps ~100 bound params per statement - chunk size computed from
  // actual column count (15) so adding a column can't silently break this.
  const D1_PARAM_LIMIT = 90
  const COLUMNS_PER_ROW = 15
  const CHUNK_SIZE = Math.max(1, Math.floor(D1_PARAM_LIMIT / COLUMNS_PER_ROW))
  const inserted: typeof alreadyCached = []
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE)
    const rows = await db
      .insert(foods)
      .values(
        chunk.map((h) => ({
          barcode: h.barcode,
          name: h.name,
          brand: h.brand,
          caloriesPer100g: h.caloriesPer100g,
          proteinPer100g: h.proteinPer100g,
          carbsPer100g: h.carbsPer100g,
          fatPer100g: h.fatPer100g,
          saturatedFatPer100g: h.saturatedFatPer100g,
          fiberPer100g: h.fiberPer100g,
          sugarsPer100g: h.sugarsPer100g,
          sodiumPer100g: h.sodiumPer100g,
          source: "off" as const,
        }))
      )
      .returning()
    inserted.push(...rows)
  }

  // Order results by barcode-order-from-OFF (relevance), not insertion
  // order, since `alreadyCached` and `inserted` come back in different
  // orders than the hits themselves.
  const byBarcode = new Map([...alreadyCached, ...inserted].map((f) => [f.barcode, f]))
  const offOrdered = hits
    .map((h) => byBarcode.get(h.barcode))
    .filter((f): f is NonNullable<typeof f> => f !== undefined)

  let localOnly: typeof offOrdered = []
  let usdaOrdered: typeof offOrdered = []
  if (offset === 0) {
    const offIds = new Set(offOrdered.map((f) => f.id))
    localOnly = localMatches.filter((f) => !offIds.has(f.id))

    if (usdaHits.length) {
      const cachedByFdcId = new Map(cachedUsda.map((f) => [f.fdcId, f]))
      const toInsertUsda = usdaHits.filter((h) => !cachedByFdcId.has(h.fdcId))

      const insertedUsda: typeof cachedUsda = []
      for (let i = 0; i < toInsertUsda.length; i += CHUNK_SIZE) {
        const chunk = toInsertUsda.slice(i, i + CHUNK_SIZE)
        const rows = await db
          .insert(foods)
          .values(
            chunk.map((h) => ({
              fdcId: h.fdcId,
              barcode: h.barcode,
              name: h.name,
              brand: h.brand,
              caloriesPer100g: h.caloriesPer100g,
              proteinPer100g: h.proteinPer100g,
              carbsPer100g: h.carbsPer100g,
              fatPer100g: h.fatPer100g,
              saturatedFatPer100g: h.saturatedFatPer100g,
              fiberPer100g: h.fiberPer100g,
              sugarsPer100g: h.sugarsPer100g,
              sodiumPer100g: h.sodiumPer100g,
              source: "usda" as const,
            }))
          )
          .returning()
        insertedUsda.push(...rows)
      }

      const byFdcId = new Map([...cachedUsda, ...insertedUsda].map((f) => [f.fdcId, f]))
      usdaOrdered = usdaHits
        .map((h) => byFdcId.get(h.fdcId))
        .filter((f): f is NonNullable<typeof f> => f !== undefined)
    }
  }

  const merged = [...localOnly, ...usdaOrdered, ...offOrdered]
  // Based on the raw hit count OFF actually returned, not how many of those
  // survived the completeness filter - a page can have fewer than PAGE_SIZE
  // usable results (some hits missing nutrition data) while OFF still has
  // more real pages left to give (confirmed: OFF reports 10000 total matches
  // for some queries, so stopping pagination just because one page filtered
  // down to 9 usable items was cutting it off with plenty of data left).
  const nextOffset = rawHitCount === PAGE_SIZE ? offset + PAGE_SIZE : null

  return Response.json({
    results: merged,
    nextOffset,
    debug: { rawHitCount, usableCount: hits.length, offTotalCount: totalCount },
  })
}
