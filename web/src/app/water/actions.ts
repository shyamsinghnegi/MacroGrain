"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { waterLogs, profiles } from "@/db/schema"
import { and, eq, gte, lt } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const AddWaterSchema = z.object({
  amountMl: z.coerce.number().min(1).max(5000),
})

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  return session.user.id
}

export async function addWater(formData: FormData) {
  const userId = await requireUserId()
  const validated = AddWaterSchema.safeParse({ amountMl: formData.get("amountMl") })
  if (!validated.success) return

  await db.insert(waterLogs).values({ userId, amountMl: Math.round(validated.data.amountMl) })
  revalidatePath("/")
}

const SaveWaterGoalSchema = z.object({
  waterGoalMl: z.coerce.number().min(500, "Goal must be at least 500 ml").max(10000, "Goal must be under 10000 ml"),
})

export type SaveWaterGoalFormState = { errors?: { waterGoalMl?: string[] } } | undefined

export async function saveWaterGoal(
  _prevState: SaveWaterGoalFormState,
  formData: FormData
): Promise<SaveWaterGoalFormState> {
  const userId = await requireUserId()

  const validated = SaveWaterGoalSchema.safeParse({ waterGoalMl: formData.get("waterGoalMl") })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  await db
    .update(profiles)
    .set({ waterGoalMl: Math.round(validated.data.waterGoalMl), updatedAt: new Date() })
    .where(eq(profiles.userId, userId))

  redirect("/settings?toast=Water+goal+saved")
}

export async function todayWaterTotal(userId: string, startOfDay: Date, startOfNextDay: Date) {
  const rows = await db
    .select({ amountMl: waterLogs.amountMl })
    .from(waterLogs)
    .where(
      and(
        eq(waterLogs.userId, userId),
        gte(waterLogs.datetime, startOfDay),
        lt(waterLogs.datetime, startOfNextDay)
      )
    )
  return rows.reduce((sum, r) => sum + r.amountMl, 0)
}
