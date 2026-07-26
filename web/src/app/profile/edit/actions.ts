"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { ProfileSchema, type ProfileFormState } from "@/lib/profile-schema"
import { redirect } from "next/navigation"
import { toDateParam } from "@/lib/dates"
import { getTimezone } from "@/lib/timezone"
import { initialTarget, paceToRate } from "@/lib/tdee"
import { markOnboardingComplete } from "@/lib/onboarding"

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
    pace: formData.get("pace"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { heightCm, weightKg, sex, birthDate, activityLevel, goal, pace } = validated.data
  const userId = session.user.id
  const tz = await getTimezone()
  const today = toDateParam(new Date(), tz)

  const rateKgPerWeek = paceToRate(goal, pace)
  const goalRate = Math.round(rateKgPerWeek * 100)
  const currentTargetKcal = initialTarget(
    { heightCm, sex, birthDate, activityLevel, goal },
    weightKg,
    rateKgPerWeek
  )

  // Not wrapped in db.transaction(): Cloudflare D1's REST query API is
  // stateless per HTTP request and rejects raw BEGIN/COMMIT statements
  // (error 7500 - "use state.storage.transaction() instead"), which is what
  // Drizzle's sqlite-proxy transaction() sends under the hood. Confirmed by
  // testing directly against the live API. Running these two writes
  // sequentially instead - not atomic across the pair, but functional,
  // versus the transaction wrapper which was throwing on every call.
  await db
    .insert(profiles)
    .values({ userId, heightCm, sex, birthDate, activityLevel, goal, goalRate, currentTargetKcal })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        heightCm,
        sex,
        birthDate,
        activityLevel,
        goal,
        goalRate,
        currentTargetKcal,
        updatedAt: new Date(),
      },
    })

  await db
    .insert(weightLogs)
    .values({ userId, date: today, weightKg })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.date],
      set: { weightKg },
    })

  await markOnboardingComplete()

  redirect("/profile?toast=Profile+saved")
}
