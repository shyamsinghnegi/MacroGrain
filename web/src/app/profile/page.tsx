import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { asc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonClass } from "@/components/button"
import { WeightChart } from "@/components/weight-chart"
import { OnboardingCookieSync } from "@/components/onboarding-cookie-sync"

const activityLabels: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very active",
}

const goalLabels: Record<string, string> = {
  cut: "Cut",
  maintain: "Maintain",
  bulk: "Bulk",
}

function ageFromBirthDate(birthDate: string) {
  const today = new Date()
  const dob = new Date(`${birthDate}T00:00:00.000Z`)
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  // Independent queries (neither depends on the other's result) - run
  // concurrently rather than as two sequential D1 network round-trips.
  const [profile, weightHistory] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    }),
    db.query.weightLogs.findMany({
      where: eq(weightLogs.userId, session.user.id),
      orderBy: asc(weightLogs.date),
    }),
  ])

  if (!profile) {
    redirect("/profile/edit")
  }

  const latestWeight = weightHistory.at(-1)

  const details = [
    { label: "HEIGHT", value: profile.heightCm ? `${profile.heightCm} cm` : "—" },
    {
      label: "WEIGHT",
      value: latestWeight ? `${latestWeight.weightKg} kg` : "—",
    },
    {
      label: "AGE",
      value: profile.birthDate ? `${ageFromBirthDate(profile.birthDate)}` : "—",
    },
    { label: "SEX", value: profile.sex ? profile.sex : "—" },
    {
      label: "ACTIVITY",
      value: profile.activityLevel ? activityLabels[profile.activityLevel] : "—",
    },
    { label: "GOAL", value: profile.goal ? goalLabels[profile.goal] : "—" },
  ]

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <OnboardingCookieSync />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">Profile</h1>
        <Link href="/profile/edit" className={buttonClass("secondary")}>
          Edit
        </Link>
      </div>

      <div className="rounded-hero bg-surface p-6 shadow-hero">
        <p className="label-mono font-doto text-[11px] tracking-[0.18em] text-text-muted uppercase">
          Weight trend
        </p>
        <div className="mt-3">
          <WeightChart
            entries={weightHistory.map((w) => ({ date: w.date, weightKg: w.weightKg }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-card bg-card p-4 shadow-card">
            <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-muted uppercase">
              {detail.label}
            </p>
            <p className="mt-1 font-mono text-lg text-text capitalize">
              {detail.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
