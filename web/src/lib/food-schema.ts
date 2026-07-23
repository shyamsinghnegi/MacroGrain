import { z } from "zod"

export const NewFoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().optional(),
  caloriesPer100g: z.coerce.number().min(0).max(950),
  proteinPer100g: z.coerce.number().min(0).max(100),
  carbsPer100g: z.coerce.number().min(0).max(100),
  fatPer100g: z.coerce.number().min(0).max(100),
})

export const LogEntrySchema = z.object({
  foodId: z.string().min(1),
  quantityG: z.coerce.number().min(1, "Enter a quantity greater than 0"),
})

export type NewFoodFormState =
  | {
      errors?: {
        name?: string[]
        brand?: string[]
        caloriesPer100g?: string[]
        proteinPer100g?: string[]
        carbsPer100g?: string[]
        fatPer100g?: string[]
      }
      message?: string
    }
  | undefined

export type LogEntryFormState =
  | {
      errors?: {
        foodId?: string[]
        quantityG?: string[]
      }
      message?: string
    }
  | undefined
