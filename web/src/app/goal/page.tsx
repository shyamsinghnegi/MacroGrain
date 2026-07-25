import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { redirect } from "next/navigation"
import { GoalForm } from "./goal-form"

export default async function GoalPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  // Independent queries (neither depends on the other's result) - run
  // concurrently rather than as two sequential D1 network round-trips.
  const [profile, latestWeight] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    }),
    db.query.weightLogs.findFirst({
      where: eq(weightLogs.userId, session.user.id),
      orderBy: desc(weightLogs.date),
    }),
  ])

  if (!profile) {
    redirect("/profile/edit")
  }

  return (
    <GoalForm
      initialGoal={profile.goal ?? "maintain"}
      initialRateKgPerWeek={profile.goalRate != null ? profile.goalRate / 100 : undefined}
      profile={{
        heightCm: profile.heightCm,
        sex: profile.sex,
        birthDate: profile.birthDate,
        activityLevel: profile.activityLevel,
      }}
      weightKg={latestWeight?.weightKg ?? 70}
    />
  )
}
