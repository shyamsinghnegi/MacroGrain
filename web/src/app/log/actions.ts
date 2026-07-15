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

  redirect(`/log?foodId=${food.id}`)
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
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { foodId, quantityG } = validated.data

  const food = await db.query.foods.findFirst({
    where: eq(foods.id, foodId),
  })

  if (!food) {
    return { message: "That food no longer exists." }
  }

  const ratio = quantityG / 100

  await db.insert(foodLogs).values({
    userId: session.user.id,
    foodId: food.id,
    quantityG,
    calories: food.caloriesPer100g * ratio,
    protein: food.proteinPer100g * ratio,
    carbs: food.carbsPer100g * ratio,
    fat: food.fatPer100g * ratio,
    source: "manual",
  })

  redirect("/")
}
