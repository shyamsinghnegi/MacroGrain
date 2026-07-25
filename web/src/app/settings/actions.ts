"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function toggleReminders(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const enabled = formData.get("enabled") === "true"

  await db
    .update(profiles)
    .set({ remindersEnabled: enabled, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  redirect("/settings")
}
