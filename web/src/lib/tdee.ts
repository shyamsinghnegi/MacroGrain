import type { activityLevel, goal, sex } from "@/db/schema"

// Mifflin-St Jeor equation - the most validated BMR formula for general
// use (more accurate across body types than the older Harris-Benedict
// equation it commonly gets confused with).
//   Male:   10 x weight(kg) + 6.25 x height(cm) - 5 x age + 5
//   Female: 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161
export function mifflinStJeorBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  bodySex: (typeof sex)[number]
) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return bodySex === "male" ? base + 5 : base - 161
}

// Standard activity multipliers - same numbers already shown to the user
// on the profile-setup screen (src/app/profile/edit/profile-form.tsx).
export const ACTIVITY_MULTIPLIERS: Record<(typeof activityLevel)[number], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function estimateTdee(bmr: number, level: (typeof activityLevel)[number]) {
  return bmr * ACTIVITY_MULTIPLIERS[level]
}

// 1kg of body fat is ~7700 kcal - the standard conversion used to turn a
// weekly weight-change goal into a daily calorie deficit/surplus.
const KCAL_PER_KG = 7700

export const GOAL_RATE_KG_PER_WEEK: Record<(typeof goal)[number], number> = {
  cut: -0.45,
  maintain: 0,
  bulk: 0.25,
}

export function ageFromBirthDate(birthDate: string, asOf: Date = new Date()) {
  const dob = new Date(`${birthDate}T00:00:00.000Z`)
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear()
  const hasHadBirthdayThisYear =
    asOf.getUTCMonth() > dob.getUTCMonth() ||
    (asOf.getUTCMonth() === dob.getUTCMonth() && asOf.getUTCDate() >= dob.getUTCDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export type ProfileForTdee = {
  heightCm?: number | null
  sex?: (typeof sex)[number] | null
  birthDate?: string | null
  activityLevel?: (typeof activityLevel)[number] | null
  goal?: (typeof goal)[number] | null
}

// The initial target, used until enough real data exists to compute a
// measured one (see weeklyTargetSuggestion below). Falls back to a
// reasonable default (moderate activity, 30yo, average height/weight) for
// any missing profile field rather than refusing to produce a number -
// profile setup already makes all of these required in practice, but new
// accounts mid-onboarding shouldn't see a crash.
//
// `rateKgPerWeek` overrides the goal's standard rate (used by the goal
// screen's rate slider to preview a custom pace); omit it to use
// GOAL_RATE_KG_PER_WEEK's default for the chosen goal.
export function initialTarget(
  profile: ProfileForTdee,
  weightKg: number,
  rateKgPerWeek?: number
) {
  const heightCm = profile.heightCm ?? 170
  const bodySex = profile.sex ?? "male"
  const age = profile.birthDate ? ageFromBirthDate(profile.birthDate) : 30
  const level = profile.activityLevel ?? "moderate"
  const userGoal = profile.goal ?? "maintain"

  const bmr = mifflinStJeorBmr(weightKg, heightCm, age, bodySex)
  const tdee = estimateTdee(bmr, level)
  const rate = rateKgPerWeek ?? GOAL_RATE_KG_PER_WEEK[userGoal]
  const dailyDelta = (rate * KCAL_PER_KG) / 7

  return Math.round(tdee + dailyDelta)
}

export type WeeklyTargetSuggestion = {
  confidence: "high" | "low"
  estimatedTdeeKcal: number
  avgIntakeKcal: number
  weightDeltaKg: number
  suggestedTargetKcal: number
  daysLogged: number
}

// Adaptive recalculation: instead of trusting the initial estimate forever,
// back out the person's *actual* burn rate from what really happened this
// week - avg calories eaten vs. actual weight change - then retarget to hit
// the goal's weekly rate using that measured number instead of the guess.
//   measured TDEE = avg intake - (weight change in kg x 7700) / days
// Confidence is "high" only with enough logged days and weight entries to
// trust the trend (matches the design's own stated thresholds: 5+ logged
// days, 3+ weight entries) - otherwise the target holds and this reports
// "low" so the UI can show the sparse-data state instead of pretending.
export function weeklyTargetSuggestion({
  previousTargetKcal,
  dailyIntakesKcal,
  weightEntries,
  userGoal,
}: {
  previousTargetKcal: number
  dailyIntakesKcal: number[] // one entry per day actually logged that week
  weightEntries: number[] // chronological weight entries within the week (+ boundary entries)
  userGoal: (typeof goal)[number]
}): WeeklyTargetSuggestion | null {
  const daysLogged = dailyIntakesKcal.length
  if (daysLogged === 0 || weightEntries.length < 2) return null

  const avgIntakeKcal = dailyIntakesKcal.reduce((a, b) => a + b, 0) / daysLogged
  const weightDeltaKg = weightEntries[weightEntries.length - 1] - weightEntries[0]

  // Measured burn over the actual number of days between the first and
  // last weight entry, not always 7 - a user might log weight on days 1
  // and 5 of the week, not exactly 7 days apart.
  const spanDays = Math.max(1, daysLogged)
  const estimatedTdeeKcal = avgIntakeKcal - (weightDeltaKg * KCAL_PER_KG) / spanDays

  const dailyDelta = (GOAL_RATE_KG_PER_WEEK[userGoal] * KCAL_PER_KG) / 7
  const suggestedTargetKcal = Math.round(estimatedTdeeKcal + dailyDelta)

  const confidence: "high" | "low" =
    daysLogged >= 5 && weightEntries.length >= 3 ? "high" : "low"

  return {
    confidence,
    estimatedTdeeKcal: Math.round(estimatedTdeeKcal),
    avgIntakeKcal: Math.round(avgIntakeKcal),
    weightDeltaKg: Math.round(weightDeltaKg * 10) / 10,
    suggestedTargetKcal: confidence === "high" ? suggestedTargetKcal : previousTargetKcal,
    daysLogged,
  }
}
