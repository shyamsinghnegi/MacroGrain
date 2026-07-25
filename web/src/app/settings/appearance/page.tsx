import { auth } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AppearanceForm } from "./appearance-form"

export default async function AppearancePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) redirect("/profile/edit")

  return (
    <AppearanceForm
      initialTheme={profile.theme}
      initialAccentColor={profile.accentColor}
      initialFontStyle={profile.fontStyle}
      initialThemePreset={profile.themePreset}
    />
  )
}
