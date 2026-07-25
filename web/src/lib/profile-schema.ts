import { z } from "zod"
import { activityLevel, goal, sex } from "@/db/schema"
import { pace } from "@/lib/tdee"

export const ProfileSchema = z.object({
  heightCm: z.coerce.number().min(50, "Height must be at least 50cm").max(272, "Height must be under 272cm"),
  weightKg: z.coerce.number().min(30, "Weight must be at least 30kg").max(300, "Weight must be under 300kg"),
  sex: z.enum(sex),
  birthDate: z.string().date("Enter a valid date"),
  activityLevel: z.enum(activityLevel),
  goal: z.enum(goal),
  // Only meaningful for cut/bulk (maintain always resolves to 0 kg/week
  // regardless - see lib/tdee.ts's paceToRate) but always required here so
  // profile setup always leaves goalRate populated, rather than the
  // previous behavior of leaving it null until the user separately found
  // the standalone /goal screen after onboarding.
  pace: z.enum(pace),
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
        pace?: string[]
      }
      message?: string
    }
  | undefined
