"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { weightLogs } from "@/db/schema"
import { redirect } from "next/navigation"
import { toDateParam } from "@/lib/dates"
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

  await db
    .insert(weightLogs)
    .values({
      userId: session.user.id,
      date: toDateParam(new Date()),
      weightKg: validated.data.weightKg,
    })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.date],
      set: { weightKg: validated.data.weightKg },
    })

  redirect("/weight")
}
