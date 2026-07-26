"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs, goal as goalEnum } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { initialTarget } from "@/lib/tdee"

const SaveGoalSchema = z.object({
  goal: z.enum(goalEnum),
  // kg/week x 100 (matches profiles.goalRate's storage convention) - the
  // rate the user landed on with the slider, which may differ from the
  // goal's own default pace.
  goalRate: z.coerce.number().int().min(-200).max(200),
})

export type SaveGoalFormState = { errors?: { goal?: string[] } } | undefined

export async function saveGoal(
  _prevState: SaveGoalFormState,
  formData: FormData
): Promise<SaveGoalFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = SaveGoalSchema.safeParse({
    goal: formData.get("goal"),
    goalRate: formData.get("goalRate"),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const userId = session.user.id
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) })
  const latestWeight = await db.query.weightLogs.findFirst({
    where: eq(weightLogs.userId, userId),
    orderBy: desc(weightLogs.date),
  })

  // Changing the goal (or its rate) is a direct, explicit target change -
  // unlike the passive weekly adaptive recalculation, this recomputes and
  // saves currentTargetKcal immediately rather than waiting for a weekly
  // checkpoint, since the user just told us their goal changed right now.
  const target = initialTarget(
    { ...profile, goal: validated.data.goal },
    latestWeight?.weightKg ?? 70,
    validated.data.goalRate / 100
  )

  await db
    .update(profiles)
    .set({
      goal: validated.data.goal,
      goalRate: validated.data.goalRate,
      currentTargetKcal: target,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId))

  redirect("/settings?toast=Goal+saved")
}
