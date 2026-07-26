import "server-only"

// USDA FoodData Central API - https://api.nal.usda.gov/fdc/v1/foods/search
const NUTRIENT_ID = {
  calories: 1008, // Energy, kcal
  protein: 1003, // g
  carbs: 1005, // Carbohydrate, by difference, g
  fat: 1004, // Total lipid (fat), g
  saturatedFat: 1258, // Fatty acids, total saturated, g
  fiber: 1079, // Fiber, total dietary, g
  sugars: 2000, // Sugars, total including NLEA, g
  sodium: 1093, // mg - note: milligrams, not grams like the others
} as const

type UsdaNutrient = {
  nutrientId?: number
  value?: number
}

type UsdaFood = {
  fdcId: number
  description?: string
  brandOwner?: string
  brandName?: string
  gtinUpc?: string
  foodNutrients?: UsdaNutrient[]
}

type UsdaSearchResponse = {
  totalHits?: number
  foods?: UsdaFood[]
}

export type UsdaSearchResult = {
  fdcId: number
  barcode: string | null
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

export type UsdaSearchOutcome = {
  results: UsdaSearchResult[]
  totalHits: number
}

function nutrientValue(nutrients: UsdaNutrient[] | undefined, id: number): number | undefined {
  return nutrients?.find((n) => n.nutrientId === id)?.value
}

export async function searchUsdaFoods(
  query: string,
  pageSize: number = 15
): Promise<UsdaSearchOutcome> {
  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) {
    throw new Error("USDA_API_KEY is not set")
  }

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("query", query)
  url.searchParams.set("pageSize", String(pageSize))
  url.searchParams.set("dataType", "Branded,Foundation")

  const res = await fetch(url.toString())
  if (!res.ok) {
    return { results: [], totalHits: 0 }
  }

  const data: UsdaSearchResponse = await res.json()
  const rawFoods = data.foods ?? []

  const results = rawFoods
    .map((food) => {
      const calories = nutrientValue(food.foodNutrients, NUTRIENT_ID.calories)
      const protein = nutrientValue(food.foodNutrients, NUTRIENT_ID.protein)
      const carbs = nutrientValue(food.foodNutrients, NUTRIENT_ID.carbs)
      const fat = nutrientValue(food.foodNutrients, NUTRIENT_ID.fat)

      if (
        !food.description ||
        calories === undefined ||
        protein === undefined ||
        carbs === undefined ||
        fat === undefined
      ) {
        return null
      }

      const sodiumMg = nutrientValue(food.foodNutrients, NUTRIENT_ID.sodium)

      return {
        fdcId: food.fdcId,
        barcode: food.gtinUpc ?? null,
        name: food.description,
        brand: food.brandOwner ?? food.brandName ?? null,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        saturatedFatPer100g: nutrientValue(food.foodNutrients, NUTRIENT_ID.saturatedFat) ?? null,
        fiberPer100g: nutrientValue(food.foodNutrients, NUTRIENT_ID.fiber) ?? null,
        sugarsPer100g: nutrientValue(food.foodNutrients, NUTRIENT_ID.sugars) ?? null,
        sodiumPer100g: sodiumMg !== undefined ? sodiumMg / 1000 : null,
      }
    })
    .filter((result): result is UsdaSearchResult => result !== null)

  return { results, totalHits: data.totalHits ?? 0 }
}
