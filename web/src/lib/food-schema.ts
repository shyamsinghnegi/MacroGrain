import { z } from "zod"
import { logSource } from "@/db/schema"

export const NewFoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().optional(),
  caloriesPer100g: z.coerce.number().min(0).max(950),
  proteinPer100g: z.coerce.number().min(0).max(100),
  carbsPer100g: z.coerce.number().min(0).max(100),
  fatPer100g: z.coerce.number().min(0).max(100),
})

// AI photo scan result, as confirmed/adjusted by the user before it's saved
// as a `foods` row. Values are per the estimated portion (not per-100g,
// unlike NewFoodSchema/foods table) - normalized to per-100g at insert time
// once portionG is known, same shape Gemini itself returns.
export const AiFoodEstimateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  portionG: z.coerce.number().min(1).max(5000),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500),
  carbs: z.coerce.number().min(0).max(500),
  fat: z.coerce.number().min(0).max(500),
  returnTo: z.string().optional(),
  date: z.string().date().optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
})

// OCR'd nutrition label, as confirmed/adjusted by the user. Like
// AiFoodEstimateSchema, values are per-serving (not per-100g) until insert
// time. sodium is entered/displayed in mg (matching how labels print it)
// and converted to grams to match foods.sodiumPer100g's unit.
export const LabelEstimateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  servingG: z.coerce.number().min(1).max(5000),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500),
  carbs: z.coerce.number().min(0).max(500),
  fat: z.coerce.number().min(0).max(500),
  saturatedFat: z.coerce.number().min(0).max(500).optional(),
  fiber: z.coerce.number().min(0).max(500).optional(),
  sugars: z.coerce.number().min(0).max(500).optional(),
  sodiumMg: z.coerce.number().min(0).max(20000).optional(),
  returnTo: z.string().optional(),
  date: z.string().date().optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
})

export const LogEntrySchema = z.object({
  foodId: z.string().min(1),
  quantityG: z.coerce.number().min(1, "Enter a quantity greater than 0"),
  source: z.enum(logSource).default("manual"),
  // Optional explicit date+hour for logging into a specific timeline slot,
  // e.g. from /timeline's "+ Add food at 2 PM". Defaults to "now" when absent.
  date: z.string().date().optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  returnTo: z.string().optional(),
  // The browser's IANA timezone, so an explicit date+hour is interpreted
  // as that local time rather than UTC. Optional because standalone /log
  // usage (no timeline context) doesn't need it - "now" is unambiguous.
  timezone: z.string().optional(),
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

export type AiFoodEstimateFormState =
  | {
      errors?: {
        name?: string[]
        portionG?: string[]
        calories?: string[]
        protein?: string[]
        carbs?: string[]
        fat?: string[]
      }
      message?: string
    }
  | undefined

export type LabelEstimateFormState =
  | {
      errors?: {
        name?: string[]
        servingG?: string[]
        calories?: string[]
        protein?: string[]
        carbs?: string[]
        fat?: string[]
      }
      message?: string
    }
  | undefined
