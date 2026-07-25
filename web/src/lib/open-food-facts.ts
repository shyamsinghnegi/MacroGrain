import "server-only"

// Open Food Facts API v2 — https://world.openfoodfacts.org/api/v2/product/{barcode}.json
// Confirmed response shape by hitting the live API directly:
//   hit:  { status: 1, status_verbose: "product found", product: {...} }
//   miss: { status: 0, status_verbose: "no code or invalid code" }
// Nutriment keys use a hyphen: "energy-kcal_100g" (not "energy_kcal_100g").

type OffNutriments = {
  "energy-kcal_100g"?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
  "saturated-fat_100g"?: number
  fiber_100g?: number
  sugars_100g?: number
  sodium_100g?: number
}

type OffResponse = {
  status: number
  product?: {
    product_name?: string
    brands?: string
    nutriments?: OffNutriments
  }
}

export type OffLookupResult =
  | {
      found: true
      name: string
      brand: string | null
      caloriesPer100g: number
      proteinPer100g: number
      carbsPer100g: number
      fatPer100g: number
      saturatedFatPer100g: number | null
      fiberPer100g: number | null
      sugarsPer100g: number | null
      sodiumPer100g: number | null
    }
  | { found: false; reason: "not_found" | "incomplete_data" }

// Open Food Facts' text-search API. Note this is a *different* host/service
// than the by-barcode v2 API above (search.openfoodfacts.org, not
// world.openfoodfacts.org) — the old world.openfoodfacts.org/cgi/search.pl
// and /api/v2/search endpoints both return an HTML "temporarily unavailable"
// page (confirmed by hitting them directly), while this dedicated search
// service responds with real JSON.
type OffSearchResponse = {
  hits?: {
    code?: string
    product_name?: string
    brands?: string[]
    nutriments?: OffNutriments
  }[]
  count?: number // total matches OFF has across all pages, not just this page
}

export type OffSearchResult = {
  barcode: string
  name: string
  brand: string | null
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  saturatedFatPer100g: number | null
  fiberPer100g: number | null
  sugarsPer100g: number | null
  sodiumPer100g: number | null
}

export type OffSearchOutcome = {
  results: OffSearchResult[]
  totalCount: number // OFF's total match count across all pages, for this query
  rawHitCount: number // hits returned on this page before the completeness filter
}

export async function searchFoodsByName(
  query: string,
  page: number = 1,
  pageSize: number = 15
): Promise<OffSearchOutcome> {
  const res = await fetch(
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&fields=code,product_name,brands,nutriments`
  )
  // `nutriments` already comes back with every sub-field (fiber, sugars,
  // sodium, saturated fat, etc.) — no separate `fields=` entries needed for
  // those, confirmed by inspecting a live response.

  if (!res.ok) return { results: [], totalCount: 0, rawHitCount: 0 }

  const data: OffSearchResponse = await res.json()
  const rawHits = data.hits ?? []

  // OFF returns plenty of hits with incomplete nutrition data (missing
  // calories/protein/carbs/fat) - those get dropped here rather than shown
  // with fake zeros, which is why the number of usable results is often
  // well below OFF's own reported total match count for a query.
  const results = rawHits
    .map((hit) => {
      const calories = hit.nutriments?.["energy-kcal_100g"]
      const protein = hit.nutriments?.proteins_100g
      const carbs = hit.nutriments?.carbohydrates_100g
      const fat = hit.nutriments?.fat_100g

      if (
        !hit.code ||
        !hit.product_name ||
        calories === undefined ||
        protein === undefined ||
        carbs === undefined ||
        fat === undefined
      ) {
        return null
      }

      return {
        barcode: hit.code,
        name: hit.product_name,
        brand: hit.brands?.[0]?.trim() ?? null,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        saturatedFatPer100g: hit.nutriments?.["saturated-fat_100g"] ?? null,
        fiberPer100g: hit.nutriments?.fiber_100g ?? null,
        sugarsPer100g: hit.nutriments?.sugars_100g ?? null,
        sodiumPer100g: hit.nutriments?.sodium_100g ?? null,
      }
    })
    .filter((result): result is OffSearchResult => result !== null)

  return { results, totalCount: data.count ?? 0, rawHitCount: rawHits.length }
}

export async function lookupBarcode(barcode: string): Promise<OffLookupResult> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  )

  if (!res.ok) {
    return { found: false, reason: "not_found" }
  }

  const data: OffResponse = await res.json()

  if (data.status !== 1 || !data.product) {
    return { found: false, reason: "not_found" }
  }

  const { product_name, brands, nutriments } = data.product
  const calories = nutriments?.["energy-kcal_100g"]
  const protein = nutriments?.proteins_100g
  const carbs = nutriments?.carbohydrates_100g
  const fat = nutriments?.fat_100g

  if (
    !product_name ||
    calories === undefined ||
    protein === undefined ||
    carbs === undefined ||
    fat === undefined
  ) {
    return { found: false, reason: "incomplete_data" }
  }

  return {
    found: true,
    name: product_name,
    brand: brands?.split(",")[0]?.trim() ?? null,
    caloriesPer100g: calories,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    saturatedFatPer100g: nutriments?.["saturated-fat_100g"] ?? null,
    fiberPer100g: nutriments?.fiber_100g ?? null,
    sugarsPer100g: nutriments?.sugars_100g ?? null,
    sodiumPer100g: nutriments?.sodium_100g ?? null,
  }
}
