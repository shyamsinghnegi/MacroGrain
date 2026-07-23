import { z } from "zod"
import { activityLevel, goal, sex } from "@/db/schema"

export const ProfileSchema = z.object({
  heightCm: z.coerce.number().min(50, "Height must be at least 50cm").max(272, "Height must be under 272cm"),
  weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be under 300kg"),
  sex: z.enum(sex),
  birthDate: z.string().date("Enter a valid date"),
  activityLevel: z.enum(activityLevel),
  goal: z.enum(goal),
})

export type ProfileFormState =
  | {
      errors?: {
        heightCm?: string[]
        weightKg?: string[]
        sex?: string[]
        birthDate?: string[]
        activityLevel?: string[]
        goal?: string[]
      }
      message?: string
    }
  | undefined
