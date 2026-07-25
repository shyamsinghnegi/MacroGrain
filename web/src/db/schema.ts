import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  real,
  unique,
} from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"

// Auth.js's Drizzle adapter expects these four tables with these exact
// column names/types. This is the contract the adapter code reads/writes
// against - see https://authjs.dev/getting-started/adapters/drizzle

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
})

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
)

// Our own app data starts here (schematic.md Phase 1: users + profiles)

export const activityLevel = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const

export const sex = ["male", "female"] as const

export const goal = ["cut", "maintain", "bulk"] as const

// Appearance settings - see src/app/globals.css for how each value maps to
// actual CSS (data-theme/data-accent attributes on <html>, data-font on
// <body>). Kept as narrow enums (not free-form colors) so every option is
// guaranteed to have been designed for both light and dark, rather than
// letting a user pick an arbitrary color that turns out illegible against
// one of the two backgrounds.
export const themeMode = ["dark", "light"] as const
export const accentColor = ["lime", "blue", "pink", "orange"] as const
export const fontStyle = ["default", "mono", "classic", "cyberpunk"] as const
// Named full palettes (background + card + text + accent together, not
// just an accent swap over the plain dark/light base) - see globals.css's
// [data-palette=...] blocks for the actual hex values. "none" means "use
// the plain theme+accentColor combination above" (today's behavior);
// picking a named palette overrides theme+accentColor's visual effect
// (their stored values are kept as a fallback for the rare case a palette
// is removed later) with a purpose-built color set lifted from real
// reference palettes the user provided, each independently checked for
// text/background contrast rather than assumed safe.
export const themePreset = [
  "none",
  "old_money",
  "blue_fantastic",
  "kombu",
] as const

export const profiles = sqliteTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  heightCm: integer("heightCm"),
  sex: text("sex", { enum: sex }),
  birthDate: text("birthDate"),
  activityLevel: text("activityLevel", { enum: activityLevel }),
  goal: text("goal", { enum: goal }),
  goalRate: integer("goalRate"), // kg per week * 100, e.g. 50 = 0.5kg/week; avoids float storage
  // The currently-active daily calorie target. Null until the first TDEE
  // computation runs (dashboard/goal screens fall back to a fresh Mifflin-St
  // Jeor estimate in that case) - stored rather than recomputed on every
  // read because the whole point of the adaptive algorithm is that the
  // target only changes at accepted weekly checkpoints, not silently
  // drifting every time the underlying inputs (e.g. today's weight) change.
  currentTargetKcal: integer("currentTargetKcal"),
  // IANA timezone (e.g. "Asia/Kolkata"), detected client-side and saved so
  // server-rendered pages (timeline hours, dashboard/history day boundaries)
  // can compute "what hour/day is it for this user" instead of using raw
  // UTC, which was the root cause of logged entries landing in the wrong
  // timeline hour for anyone not in UTC+0.
  timezone: text("timezone").notNull().default("UTC"),
  waterGoalMl: integer("waterGoalMl").notNull().default(2500),
  remindersEnabled: integer("remindersEnabled", { mode: "boolean" })
    .notNull()
    .default(true),
  theme: text("theme", { enum: themeMode }).notNull().default("dark"),
  accentColor: text("accentColor", { enum: accentColor }).notNull().default("lime"),
  fontStyle: text("fontStyle", { enum: fontStyle }).notNull().default("default"),
  themePreset: text("themePreset", { enum: themePreset }).notNull().default("none"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Phase 2: manual food logging (schematic.md)

export const foodSource = ["off", "usda", "ifct", "ai", "manual"] as const

export const foods = sqliteTable("food", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  barcode: text("barcode"),
  name: text("name").notNull(),
  brand: text("brand"),
  caloriesPer100g: real("caloriesPer100g").notNull(),
  proteinPer100g: real("proteinPer100g").notNull(),
  carbsPer100g: real("carbsPer100g").notNull(),
  fatPer100g: real("fatPer100g").notNull(),
  // Extended nutrition - optional because manual entries and older cached
  // rows won't have these, and Open Food Facts itself often doesn't report
  // every field for a given product. Shown on the detail page only when
  // present, never as fake zeros (same "don't fake confidence" pattern
  // already used for the core four macros on manual entries).
  saturatedFatPer100g: real("saturatedFatPer100g"),
  fiberPer100g: real("fiberPer100g"),
  sugarsPer100g: real("sugarsPer100g"),
  sodiumPer100g: real("sodiumPer100g"), // grams, not mg - matches OFF's own unit
  source: text("source", { enum: foodSource }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const logSource = ["barcode", "ai_photo", "manual"] as const

export const foodLogs = sqliteTable("foodLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  foodId: text("foodId")
    .notNull()
    .references(() => foods.id),
  datetime: integer("datetime", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  quantityG: real("quantityG").notNull(),
  // Calories/macros are snapshotted here at log time, not recomputed from
  // foods + quantity on read. If a food's nutrition data is later corrected,
  // past log entries should keep reflecting what the user was told they ate.
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  // Extended nutrition, same snapshot rule as above - optional because the
  // source food may not have this data (manual entries, or OFF products
  // missing a field), not because it's optional to track once known.
  saturatedFat: real("saturatedFat"),
  fiber: real("fiber"),
  sugars: real("sugars"),
  sodium: real("sodium"), // grams
  source: text("source", { enum: logSource }).notNull(),
})

// Phase 5: weight tracking (schematic.md) — pulled forward for profile
// setup's first weight entry (design_handoff_macrograin screen 2).

export const weightLogs = sqliteTable(
  "weightLog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weightKg: real("weightKg").notNull(),
    isUnreliable: integer("isUnreliable", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (weightLog) => [unique().on(weightLog.userId, weightLog.date)]
)

// Adaptive TDEE: each week (once there's enough data - see lib/tdee.ts),
// compute a suggested new target from actual weight change vs. logged
// intake, rather than trusting the initial Mifflin-St Jeor estimate
// forever. One row per week per user; `accepted` starts false and flips
// true when the user taps "Accept new target" on the weekly summary
// screen, at which point profiles.currentTargetKcal is updated to match.

export const confidenceLevel = ["high", "low"] as const

export const weeklyTargetUpdates = sqliteTable("weeklyTargetUpdate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekStart: text("weekStart").notNull(), // YYYY-MM-DD, Monday of the week this covers
  previousTargetKcal: integer("previousTargetKcal").notNull(),
  suggestedTargetKcal: integer("suggestedTargetKcal").notNull(),
  estimatedTdeeKcal: integer("estimatedTdeeKcal").notNull(),
  avgIntakeKcal: integer("avgIntakeKcal").notNull(),
  weightDeltaKg: real("weightDeltaKg").notNull(),
  daysLogged: integer("daysLogged").notNull(),
  confidence: text("confidence", { enum: confidenceLevel }).notNull(),
  accepted: integer("accepted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Water intake tracking - requested alongside the settings rebuild as
// "important part of fat loss". Logged as discrete add events (like
// foodLogs) rather than one running daily total row, so the dashboard can
// show a timeline of when water was drunk, matching the foodLogs pattern.

export const waterLogs = sqliteTable("waterLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountMl: integer("amountMl").notNull(),
  datetime: integer("datetime", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})
