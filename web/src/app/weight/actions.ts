"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { weightLogs } from "@/db/schema"
import { redirect } from "next/navigation"
import { toDateParam } from "@/lib/dates"
import { getTimezone } from "@/lib/timezone"
import { getUnitSystem } from "@/lib/unit-preference"
import { formatWeight } from "@/lib/units"
import { z } from "zod"

const LogWeightSchema = z.object({
  weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be under 300kg"),
})

export type LogWeightFormState =
  | { errors?: { weightKg?: string[] }; message?: string }
  | undefined

export async function logWeight(
  _prevState: LogWeightFormState,
  formData: FormData
): Promise<LogWeightFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const validated = LogWeightSchema.safeParse({
    weightKg: formData.get("weightKg"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const tz = await getTimezone()

  await db
    .insert(weightLogs)
    .values({
      userId: session.user.id,
      date: toDateParam(new Date(), tz),
      weightKg: validated.data.weightKg,
    })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.date],
      set: { weightKg: validated.data.weightKg },
    })

  const unitSystem = await getUnitSystem()
  const toast = encodeURIComponent(`Weight saved · ${formatWeight(validated.data.weightKg, unitSystem)}`)
  redirect(`/weight?toast=${toast}`)
}
