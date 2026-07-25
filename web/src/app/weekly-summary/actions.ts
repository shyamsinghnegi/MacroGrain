"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weeklyTargetUpdates } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function acceptWeeklyTarget(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")
  const userId = session.user.id

  const updateId = formData.get("updateId")
  if (typeof updateId !== "string" || !updateId) return

  const update = await db.query.weeklyTargetUpdates.findFirst({
    where: and(eq(weeklyTargetUpdates.id, updateId), eq(weeklyTargetUpdates.userId, userId)),
  })
  if (!update) return

  await db
    .update(profiles)
    .set({ currentTargetKcal: update.suggestedTargetKcal, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))

  await db
    .update(weeklyTargetUpdates)
    .set({ accepted: true })
    .where(eq(weeklyTargetUpdates.id, updateId))

  redirect("/?toast=Target+updated")
}
