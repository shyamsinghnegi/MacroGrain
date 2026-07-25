"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { foods, foodLogs } from "@/db/schema"
import {
  NewFoodSchema,
  LogEntrySchema,
  AiFoodEstimateSchema,
  LabelEstimateSchema,
  type NewFoodFormState,
  type LogEntryFormState,
  type AiFoodEstimateFormState,
  type LabelEstimateFormState,
} from "@/lib/food-schema"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { dateAndHourToUtc } from "@/lib/dates"

export async function createFood(
  _prevState: NewFoodFormState,
  formData: FormData
): Promise<NewFoodFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = NewFoodSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    caloriesPer100g: formData.get("caloriesPer100g"),
    proteinPer100g: formData.get("proteinPer100g"),
    carbsPer100g: formData.get("carbsPer100g"),
    fatPer100g: formData.get("fatPer100g"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const [food] = await db
    .insert(foods)
    .values({ ...validated.data, source: "manual" })
    .returning({ id: foods.id })

  const returnTo = formData.get("returnTo")
  const date = formData.get("date")
  const hour = formData.get("hour")
  const context = new URLSearchParams()
  if (typeof returnTo === "string" && returnTo) context.set("returnTo", returnTo)
  if (typeof date === "string" && date) context.set("date", date)
  if (typeof hour === "string" && hour) context.set("hour", hour)
  const suffix = context.toString() ? `&${context.toString()}` : ""

  redirect(`/log?foodId=${food.id}${suffix}`)
}

// Saves a confirmed AI photo estimate as a `foods` row (source "ai",
// per-100g normalized from the user-confirmed portion) and immediately logs
// it, in one step - unlike barcode/manual foods, an AI estimate isn't a
// reusable catalog entry someone will look up again by name, so there's no
// separate "create food" screen before this.
export async function createAiFoodAndLog(
  _prevState: AiFoodEstimateFormState,
  formData: FormData
): Promise<AiFoodEstimateFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = AiFoodEstimateSchema.safeParse({
    name: formData.get("name"),
    portionG: formData.get("portionG"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    carbs: formData.get("carbs"),
    fat: formData.get("fat"),
    returnTo: formData.get("returnTo") ?? undefined,
    date: formData.get("date") ?? undefined,
    hour: formData.get("hour") ?? undefined,
    timezone: formData.get("timezone") ?? undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, portionG, calories, protein, carbs, fat, returnTo, date, hour, timezone } =
    validated.data
  const ratio = 100 / portionG

  const [food] = await db
    .insert(foods)
    .values({
      name,
      caloriesPer100g: calories * ratio,
      proteinPer100g: protein * ratio,
      carbsPer100g: carbs * ratio,
      fatPer100g: fat * ratio,
      source: "ai",
    })
    .returning({ id: foods.id })

  const datetime =
    date && hour !== undefined ? dateAndHourToUtc(date, hour, timezone ?? "UTC") : new Date()

  await db.insert(foodLogs).values({
    userId: session.user.id,
    foodId: food.id,
    quantityG: portionG,
    calories,
    protein,
    carbs,
    fat,
    source: "ai_photo",
    datetime,
  })

  const toast = encodeURIComponent(`Added · ${Math.round(calories)} kcal`)
  const destination = returnTo && returnTo.startsWith("/") ? returnTo : "/"
  const separator = destination.includes("?") ? "&" : "?"
  redirect(`${destination}${separator}toast=${toast}`)
}

// Saves a confirmed nutrition-label OCR read as a `foods` row (source
// "ai" - it's still an AI-produced entry, just from label text rather than
// a photo of the meal itself) and logs it, same one-step pattern as
// createAiFoodAndLog. Optional fields (saturatedFat/fiber/sugars/sodium)
// are only set when the label actually printed them, matching the
// "don't fake confidence" rule already used for OFF/manual foods.
export async function createLabelFoodAndLog(
  _prevState: LabelEstimateFormState,
  formData: FormData
): Promise<LabelEstimateFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = LabelEstimateSchema.safeParse({
    name: formData.get("name"),
    servingG: formData.get("servingG"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    carbs: formData.get("carbs"),
    fat: formData.get("fat"),
    saturatedFat: formData.get("saturatedFat") || undefined,
    fiber: formData.get("fiber") || undefined,
    sugars: formData.get("sugars") || undefined,
    sodiumMg: formData.get("sodiumMg") || undefined,
    returnTo: formData.get("returnTo") ?? undefined,
    date: formData.get("date") ?? undefined,
    hour: formData.get("hour") ?? undefined,
    timezone: formData.get("timezone") ?? undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const {
    name,
    servingG,
    calories,
    protein,
    carbs,
    fat,
    saturatedFat,
    fiber,
    sugars,
    sodiumMg,
    returnTo,
    date,
    hour,
    timezone,
  } = validated.data
  const ratio = 100 / servingG
  const sodiumG = sodiumMg != null ? sodiumMg / 1000 : undefined

  const [food] = await db
    .insert(foods)
    .values({
      name,
      caloriesPer100g: calories * ratio,
      proteinPer100g: protein * ratio,
      carbsPer100g: carbs * ratio,
      fatPer100g: fat * ratio,
      saturatedFatPer100g: saturatedFat != null ? saturatedFat * ratio : null,
      fiberPer100g: fiber != null ? fiber * ratio : null,
      sugarsPer100g: sugars != null ? sugars * ratio : null,
      sodiumPer100g: sodiumG != null ? sodiumG * ratio : null,
      source: "ai",
    })
    .returning({ id: foods.id })

  const datetime =
    date && hour !== undefined ? dateAndHourToUtc(date, hour, timezone ?? "UTC") : new Date()

  await db.insert(foodLogs).values({
    userId: session.user.id,
    foodId: food.id,
    quantityG: servingG,
    calories,
    protein,
    carbs,
    fat,
    saturatedFat: saturatedFat ?? null,
    fiber: fiber ?? null,
    sugars: sugars ?? null,
    sodium: sodiumG ?? null,
    source: "ai_photo",
    datetime,
  })

  const toast = encodeURIComponent(`Added · ${Math.round(calories)} kcal`)
  const destination = returnTo && returnTo.startsWith("/") ? returnTo : "/"
  const separator = destination.includes("?") ? "&" : "?"
  redirect(`${destination}${separator}toast=${toast}`)
}

export async function logEntry(
  _prevState: LogEntryFormState,
  formData: FormData
): Promise<LogEntryFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = LogEntrySchema.safeParse({
    foodId: formData.get("foodId"),
    quantityG: formData.get("quantityG"),
    source: formData.get("source") ?? undefined,
    date: formData.get("date") ?? undefined,
    hour: formData.get("hour") ?? undefined,
    returnTo: formData.get("returnTo") ?? undefined,
    timezone: formData.get("timezone") ?? undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { foodId, quantityG, source, date, hour, returnTo, timezone } = validated.data

  const food = await db.query.foods.findFirst({
    where: eq(foods.id, foodId),
  })

  if (!food) {
    return { message: "That food no longer exists." }
  }

  const ratio = quantityG / 100
  const calories = food.caloriesPer100g * ratio

  // Explicit date+hour (from /timeline's "+ Add food at 2 PM") wins over
  // "now" - both must be present together, a lone hour with no date isn't
  // enough to place the entry on the right day. Both are interpreted in the
  // client's own timezone (defaulting to UTC if somehow absent), not the
  // server's - "2 PM" on the timeline means 2 PM for the person who tapped
  // it, not 2 PM UTC.
  const datetime =
    date && hour !== undefined
      ? dateAndHourToUtc(date, hour, timezone ?? "UTC")
      : new Date()

  await db.insert(foodLogs).values({
    userId: session.user.id,
    foodId: food.id,
    quantityG,
    calories,
    protein: food.proteinPer100g * ratio,
    carbs: food.carbsPer100g * ratio,
    fat: food.fatPer100g * ratio,
    saturatedFat: food.saturatedFatPer100g != null ? food.saturatedFatPer100g * ratio : null,
    fiber: food.fiberPer100g != null ? food.fiberPer100g * ratio : null,
    sugars: food.sugarsPer100g != null ? food.sugarsPer100g * ratio : null,
    sodium: food.sodiumPer100g != null ? food.sodiumPer100g * ratio : null,
    source,
    datetime,
  })

  const toast = encodeURIComponent(`Added · ${Math.round(calories)} kcal`)
  const destination = returnTo && returnTo.startsWith("/") ? returnTo : "/"
  const separator = destination.includes("?") ? "&" : "?"
  redirect(`${destination}${separator}toast=${toast}`)
}
