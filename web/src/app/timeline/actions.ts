"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { foodLogs, waterLogs } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { withHourInTimezone } from "@/lib/dates"

const MoveOrCopySchema = z.object({
  entryId: z.string().min(1),
  // Hour of day (0-23), in the client's timezone, the entry is being
  // dropped onto. Combined server-side with the entry's own existing date
  // (also read in that timezone) - "just the time, same day" per the user's
  // confirmed move semantics, not a full date+time reschedule.
  hour: z.coerce.number().int().min(0).max(23),
  timezone: z.string().min(1),
})

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }
  return session.user.id
}

// Both "move" and "copy" need the entry's current date (to keep the day
// fixed) and to confirm it actually belongs to the signed-in user before
// touching it - never trust an entryId from the client without that check.
async function loadOwnedEntry(userId: string, entryId: string) {
  return db.query.foodLogs.findFirst({
    where: and(eq(foodLogs.id, entryId), eq(foodLogs.userId, userId)),
  })
}

export async function moveEntry(formData: FormData) {
  const userId = await requireUserId()
  const validated = MoveOrCopySchema.safeParse({
    entryId: formData.get("entryId"),
    hour: formData.get("hour"),
    timezone: formData.get("timezone"),
  })
  if (!validated.success) return

  const entry = await loadOwnedEntry(userId, validated.data.entryId)
  if (!entry) return

  await db
    .update(foodLogs)
    .set({
      datetime: withHourInTimezone(entry.datetime, validated.data.hour, validated.data.timezone),
    })
    .where(eq(foodLogs.id, entry.id))

  revalidatePath("/timeline")
}

export async function copyEntry(formData: FormData) {
  const userId = await requireUserId()
  const validated = MoveOrCopySchema.safeParse({
    entryId: formData.get("entryId"),
    hour: formData.get("hour"),
    timezone: formData.get("timezone"),
  })
  if (!validated.success) return

  const entry = await loadOwnedEntry(userId, validated.data.entryId)
  if (!entry) return

  await db.insert(foodLogs).values({
    userId,
    foodId: entry.foodId,
    datetime: withHourInTimezone(entry.datetime, validated.data.hour, validated.data.timezone),
    quantityG: entry.quantityG,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    saturatedFat: entry.saturatedFat,
    fiber: entry.fiber,
    sugars: entry.sugars,
    sodium: entry.sodium,
    source: entry.source,
  })

  revalidatePath("/timeline")
}

export async function deleteEntry(formData: FormData) {
  const userId = await requireUserId()
  const entryId = formData.get("entryId")
  if (typeof entryId !== "string" || !entryId) return

  await db
    .delete(foodLogs)
    .where(and(eq(foodLogs.id, entryId), eq(foodLogs.userId, userId)))

  revalidatePath("/timeline")
}

// Deletes a single water log entry from the timeline view - the timeline is
// now the one place individual water entries are visible (the dashboard
// widget only ever showed a same-day total), so this is also the natural
// place to let a user undo a mis-tap. Replaces water/actions.ts's
// removeLastWater, which was written but never wired to any UI - kept here
// instead since /timeline already owns per-entry delete for food logs and
// this follows the exact same ownership-check pattern.
export async function deleteWaterEntry(formData: FormData) {
  const userId = await requireUserId()
  const entryId = formData.get("entryId")
  if (typeof entryId !== "string" || !entryId) return

  await db
    .delete(waterLogs)
    .where(and(eq(waterLogs.id, entryId), eq(waterLogs.userId, userId)))

  revalidatePath("/timeline")
  revalidatePath("/")
}
