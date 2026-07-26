import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { eq } from "drizzle-orm"
import { lookupBarcode } from "@/lib/open-food-facts"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response(null, { status: 401 })
  }

  const barcode = request.nextUrl.searchParams.get("code")?.trim()
  if (!barcode) {
    return Response.json({ error: "Missing barcode" }, { status: 400 })
  }

  // Cache check: a previous scan may have already saved this barcode's
  // nutrition data into `foods` (schematic.md's data-flow: "check local
  // foods cache -> if miss, query Open Food Facts -> cache result").
  const cached = await db.query.foods.findFirst({
    where: eq(foods.barcode, barcode),
  })

  if (cached) {
    return Response.json(cached)
  }

  const result = await lookupBarcode(barcode)

  if (!result.found) {
    return Response.json({ error: result.reason }, { status: 404 })
  }

  const [food] = await db
    .insert(foods)
    .values({
      barcode,
      name: result.name,
      brand: result.brand,
      caloriesPer100g: result.caloriesPer100g,
      proteinPer100g: result.proteinPer100g,
      carbsPer100g: result.carbsPer100g,
      fatPer100g: result.fatPer100g,
      saturatedFatPer100g: result.saturatedFatPer100g,
      fiberPer100g: result.fiberPer100g,
      sugarsPer100g: result.sugarsPer100g,
      sodiumPer100g: result.sodiumPer100g,
      source: "off",
    })
    .onConflictDoNothing({ target: foods.barcode })
    .returning()

  // A concurrent request for the same barcode won the race and inserted
  // first - onConflictDoNothing() means `food` is undefined here, not an
  // error, so fetch the row it just created instead of failing the request.
  if (food) return Response.json(food)

  const winner = await db.query.foods.findFirst({ where: eq(foods.barcode, barcode) })
  return Response.json(winner)
}
