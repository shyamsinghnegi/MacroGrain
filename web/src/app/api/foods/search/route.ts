import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { like, inArray } from "drizzle-orm"
import { searchFoodsByName } from "@/lib/open-food-facts"
import { NextRequest } from "next/server"

const PAGE_SIZE = 15

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
  const { results: hits, totalCount, rawHitCount } = await searchFoodsByName(q, offPage, PAGE_SIZE)

  console.log(
    `[foods/search] q="${q}" page=${offPage} -> OFF raw hits=${rawHitCount}, usable (complete nutrition)=${hits.length}, OFF total matches=${totalCount}`
  )

  const barcodes = hits.map((h) => h.barcode)

  const alreadyCached = barcodes.length
    ? await db.query.foods.findMany({ where: inArray(foods.barcode, barcodes) })
    : []
  const cachedBarcodes = new Set(alreadyCached.map((f) => f.barcode))

  const toInsert = hits.filter((h) => !cachedBarcodes.has(h.barcode))

  // D1's real ceiling is ~100 bound params per statement (confirmed
  // directly: 7 rows x 14 params = 98 succeeds, 8 rows x 14 = 112 fails with
  // "too many SQL variables"). Computing the chunk size from the actual
  // column count instead of a hardcoded row count, so adding another column
  // later (like saturatedFatPer100g/fiber/sugars/sodium just did - which
  // silently broke the previous hardcoded chunk-of-8) can't reintroduce
  // this bug without also shrinking the chunk size automatically.
  const D1_PARAM_LIMIT = 90 // leaves headroom under the ~100 ceiling
  // Drizzle binds every column as a param, including $defaultFn ones (id,
  // createdAt) - so this is the *full* row width, not just the fields set
  // explicitly below: id, barcode, name, brand, 4 core macros, 4 extended
  // nutrition fields, source, createdAt = 14.
  const COLUMNS_PER_ROW = 14
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

  // On the very first page only, also surface local-only matches (manually
  // created foods, or past barcode scans) that OFF's text search didn't
  // return - covers foods that exist in this app's own catalog but aren't
  // phrased the way OFF indexes them.
  let localOnly: typeof offOrdered = []
  if (offset === 0) {
    // Postgres's `ilike` doesn't exist in SQLite (D1) - it's a hard SQL
    // syntax error there. SQLite's plain `LIKE` is already case-insensitive
    // for ASCII by default, so `like()` is the correct equivalent here.
    const localMatches = await db
      .select()
      .from(foods)
      .where(like(foods.name, `%${q}%`))
      .limit(PAGE_SIZE)
    const offIds = new Set(offOrdered.map((f) => f.id))
    localOnly = localMatches.filter((f) => !offIds.has(f.id))
  }

  const merged = [...localOnly, ...offOrdered]
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
