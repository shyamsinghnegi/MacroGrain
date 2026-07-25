"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, themeMode, accentColor, fontStyle, themePreset } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { setThemeCookies } from "@/lib/theme"
import { z } from "zod"

const AppearanceSchema = z.object({
  theme: z.enum(themeMode),
  accentColor: z.enum(accentColor),
  fontStyle: z.enum(fontStyle),
  themePreset: z.enum(themePreset),
})

export async function saveAppearance(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const validated = AppearanceSchema.safeParse({
    theme: formData.get("theme"),
    accentColor: formData.get("accentColor"),
    fontStyle: formData.get("fontStyle"),
    themePreset: formData.get("themePreset"),
  })
  if (!validated.success) return

  // Saved to both the DB (so the choice follows the user to a new device/
  // session) and cookies directly (so this same request's redirect renders
  // with the new theme immediately, rather than showing the old one until
  // a client effect can sync a cookie on the next load - there's no
  // client-detection step needed here the way timezone has one).
  await db
    .update(profiles)
    .set({ ...validated.data, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  await setThemeCookies(validated.data)

  redirect("/settings?toast=Appearance+saved")
}
