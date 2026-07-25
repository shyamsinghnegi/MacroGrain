"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function syncTimezone(timezone: string) {
  const session = await auth()
  if (!session?.user?.id) return

  // Sanity-check against Intl itself rather than trusting the client string
  // outright - a malformed value would otherwise get stored and then break
  // every date computation that reads it back.
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch {
    return
  }

  await db
    .update(profiles)
    .set({ timezone })
    .where(eq(profiles.userId, session.user.id))
}
