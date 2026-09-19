import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { like, inArray, sql, asc } from "drizzle-orm"
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
  let [{ results: hits, totalCount, rawHitCount }, usdaOutcome] = await Promise.all([
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

  let usdaHits = usdaOutcome?.results ?? []
  const uniqueHits = []
  const seenBarcodes = new Set()
  for (const h of hits) {
    if (!seenBarcodes.has(h.barcode)) {
      seenBarcodes.add(h.barcode)
      uniqueHits.push(h)
    }
  }
  hits = uniqueHits

  const uniqueUsdaHits = []
  const seenFdcIds = new Set()
  for (const h of usdaHits) {
    if (!seenFdcIds.has(h.fdcId)) {
      seenFdcIds.add(h.fdcId)
      uniqueUsdaHits.push(h)
    }
  }
  usdaHits = uniqueUsdaHits

  const barcodes = hits.map((h) => h.barcode)
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
      ? db.select()
          .from(foods)
          .where(like(foods.name, `%${q}%`))
          .orderBy(sql`CASE WHEN ${foods.source} = 'ifct' THEN 0 ELSE 1 END`, asc(foods.name))
          .limit(PAGE_SIZE)
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
    if (usdaHits.length) {
      const cachedByFdcId = new Map(cachedUsda.map((f) => [f.fdcId, f]))
      let toInsertUsda = usdaHits.filter((h) => !cachedByFdcId.has(h.fdcId))

      // USDA items might have a gtinUpc (barcode) that already exists in the DB
      // (e.g., from OFF or a manual seed). This causes a UNIQUE constraint error
      // if we try to insert them again. We must query for these existing barcodes.
      const usdaBarcodes = toInsertUsda.map((h) => h.barcode).filter((b): b is string => Boolean(b))
      const existingByBarcode = usdaBarcodes.length > 0 
        ? await db.query.foods.findMany({ where: inArray(foods.barcode, usdaBarcodes) })
        : []
      
      const existingBarcodeSet = new Set(existingByBarcode.map(f => f.barcode))
      
      // We will treat these existing barcode rows as if they were cached by FDC ID,
      // so we add them to cachedUsda.
      cachedUsda.push(...existingByBarcode)
      
      // Now filter out the items we just found by barcode so we don't insert them
      toInsertUsda = toInsertUsda.filter((h) => !h.barcode || !existingBarcodeSet.has(h.barcode))

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

      // Map back all the items (either cached by fdcId, found by barcode, or newly inserted)
      // Note: If a USDA hit was found by barcode, we map it back using its fdcId from the hit,
      // BUT the DB row might not have an fdcId. We need to map usdaHits to the rows.
      // So let's build the map from usdaHits directly based on what we found/inserted.
      const allFoundOrInsertedRows = [...cachedUsda, ...insertedUsda]
      const rowsByFdcId = new Map()
      const rowsByBarcode = new Map(allFoundOrInsertedRows.map(r => [r.barcode, r]))
      
      for (const row of allFoundOrInsertedRows) {
        if (row.fdcId) rowsByFdcId.set(row.fdcId, row)
      }

      usdaOrdered = usdaHits
        .map((h) => rowsByFdcId.get(h.fdcId) || rowsByBarcode.get(h.barcode))
        .filter((f): f is NonNullable<typeof f> => f !== undefined)
    }

    const offIds = new Set(offOrdered.map((f) => f.id))
    const usdaIds = new Set(usdaOrdered.map((f) => f.id))
    
    // Sort local matches so IFCT is prioritized, then by name
    const sortedLocal = [...localMatches].sort((a, b) => {
      if (a.source === "ifct" && b.source !== "ifct") return -1
      if (b.source === "ifct" && a.source !== "ifct") return 1
      return a.name.localeCompare(b.name)
    })
    
    localOnly = sortedLocal.filter((f) => !offIds.has(f.id) && !usdaIds.has(f.id))
  }

  const rawMerged = [...localOnly, ...usdaOrdered, ...offOrdered]
  
  // Deduplicate by ID to prevent React duplicate key errors.
  // This can happen if an item is returned by both USDA and OFF (overlap),
  // causing it to be present in both usdaOrdered and offOrdered.
  const merged = []
  const seenIds = new Set()
  for (const f of rawMerged) {
    if (!seenIds.has(f.id)) {
      seenIds.add(f.id)
      merged.push(f)
    }
  }

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
