import type { goal } from "@/db/schema"
import { initialTarget, GOAL_RATE_KG_PER_WEEK, type ProfileForTdee } from "@/lib/tdee"

// Rate/detail copy per goal — lifted directly from Macrograin.dc.html's
// goalMap (screen 14, Goal settings). The rate numbers now match
// lib/tdee.ts's GOAL_RATE_KG_PER_WEEK exactly (this used to be a separate
// hardcoded placeholder that could drift from the real math).
export const GOAL_COPY: Record<
  (typeof goal)[number],
  { rate: string; detail: string }
> = {
  cut: { rate: `${GOAL_RATE_KG_PER_WEEK.cut} kg / week`, detail: "−500 kcal from maintenance" },
  maintain: { rate: "hold current weight", detail: "at estimated maintenance" },
  bulk: { rate: `+${GOAL_RATE_KG_PER_WEEK.bulk} kg / week`, detail: "+300 kcal over maintenance" },
}

// Resolves the calorie target actually in effect: the stored,
// previously-accepted target if one exists, otherwise a fresh Mifflin-St
// Jeor estimate from the given profile + latest weight. Takes already-
// fetched data rather than querying itself - every caller already has a
// `profile` row fetched for other reasons (dashboard, macros page, goal
// screen), and weight is cheap to include in that same call site's own
// query rather than this function adding a second round-trip to D1 on
// every read.
export function resolveTarget(
  profile: (ProfileForTdee & { currentTargetKcal: number | null }) | undefined,
  latestWeightKg: number | undefined
): number {
  if (profile?.currentTargetKcal) return profile.currentTargetKcal
  return initialTarget(profile ?? {}, latestWeightKg ?? 70)
}

// Daily limits for sodium/fiber/sugar/saturated fat, derived from a
// calorie target using standard public-health guidelines (WHO/FDA), not
// invented numbers:
//   - Sodium: flat 2000mg/day (WHO) - not calorie-scaled, body size doesn't
//     change how much sodium is safe.
//   - Fiber: 14g per 1000 kcal (FDA/Institute of Medicine formula) - scales
//     with how much the person eats.
//   - Added sugar: <10% of calories (WHO), /4 kcal per gram of sugar.
//   - Saturated fat: <10% of calories (WHO/AHA), /9 kcal per gram of fat.
export function dailyExtendedLimits(calorieTarget: number) {
  return {
    sodiumMg: 2000,
    fiberG: Math.round((calorieTarget / 1000) * 14),
    sugarsG: Math.round((calorieTarget * 0.1) / 4),
    saturatedFatG: Math.round((calorieTarget * 0.1) / 9),
  }
}

// Daily protein/carbs/fat gram targets from a calorie target + body weight.
// Protein: 1.6g/kg (evidence-based range for muscle retention while
// cutting/general tracking, per ISSN position stand) rather than a percent-
// of-calories split, since protein needs scale with body weight, not with
// how many calories someone happens to eat. Fat: 25% of calories (within
// the widely-used 20-35% range) at 9 kcal/g. Carbs: whatever calories are
// left after protein+fat, at 4 kcal/g - never negative, since a very low
// calorie target with a heavy body weight could otherwise push carbs
// negative (falls back to a 5g floor in that edge case rather than showing
// a nonsensical target).
const PROTEIN_G_PER_KG = 1.6
const FAT_CALORIE_SHARE = 0.25
const KCAL_PER_G_PROTEIN = 4
const KCAL_PER_G_FAT = 9
const KCAL_PER_G_CARBS = 4

export function dailyMacroTargets(calorieTarget: number, weightKg: number) {
  const proteinG = Math.round(PROTEIN_G_PER_KG * weightKg)
  const fatG = Math.round((calorieTarget * FAT_CALORIE_SHARE) / KCAL_PER_G_FAT)
  const proteinAndFatKcal = proteinG * KCAL_PER_G_PROTEIN + fatG * KCAL_PER_G_FAT
  const carbsG = Math.max(5, Math.round((calorieTarget - proteinAndFatKcal) / KCAL_PER_G_CARBS))

  return { proteinG, carbsG, fatG }
}
