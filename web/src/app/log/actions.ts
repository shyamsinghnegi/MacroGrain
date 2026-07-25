"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { foods, foodLogs } from "@/db/schema"
import {
  NewFoodSchema,
  LogEntrySchema,
  type NewFoodFormState,
  type LogEntryFormState,
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
