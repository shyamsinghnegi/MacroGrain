"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { ProfileSchema, type ProfileFormState } from "@/lib/profile-schema"
import { redirect } from "next/navigation"
import { toDateParam } from "@/lib/dates"

export async function saveProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = ProfileSchema.safeParse({
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
    sex: formData.get("sex"),
    birthDate: formData.get("birthDate"),
    activityLevel: formData.get("activityLevel"),
    goal: formData.get("goal"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { heightCm, weightKg, sex, birthDate, activityLevel, goal } = validated.data
  const userId = session.user.id
  const today = toDateParam(new Date())

  await db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values({ userId, heightCm, sex, birthDate, activityLevel, goal })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { heightCm, sex, birthDate, activityLevel, goal, updatedAt: new Date() },
      })

    await tx
      .insert(weightLogs)
      .values({ userId, date: today, weightKg })
      .onConflictDoUpdate({
        target: [weightLogs.userId, weightLogs.date],
        set: { weightKg },
      })
  })

  redirect("/profile")
}
