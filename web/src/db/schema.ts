import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  date,
  real,
  boolean,
  unique,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

// Auth.js's Drizzle adapter expects these four tables with these exact
// column names/types. This is the contract the adapter code reads/writes
// against - see https://authjs.dev/getting-started/adapters/drizzle

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
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

export const profiles = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  heightCm: integer("heightCm"),
  sex: text("sex", { enum: sex }),
  birthDate: date("birthDate"),
  activityLevel: text("activityLevel", { enum: activityLevel }),
  goal: text("goal", { enum: goal }),
  goalRate: integer("goalRate"), // kg per week * 100, e.g. 50 = 0.5kg/week; avoids float storage
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

// Phase 2: manual food logging (schematic.md)

export const foodSource = ["off", "usda", "ifct", "ai", "manual"] as const

export const foods = pgTable("food", {
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
  source: text("source", { enum: foodSource }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const logSource = ["barcode", "ai_photo", "manual"] as const

export const foodLogs = pgTable("foodLog", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  foodId: text("foodId")
    .notNull()
    .references(() => foods.id),
  datetime: timestamp("datetime", { mode: "date" }).notNull().defaultNow(),
  quantityG: real("quantityG").notNull(),
  // Calories/macros are snapshotted here at log time, not recomputed from
  // foods + quantity on read. If a food's nutrition data is later corrected,
  // past log entries should keep reflecting what the user was told they ate.
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  source: text("source", { enum: logSource }).notNull(),
})

// Phase 5: weight tracking (schematic.md) — pulled forward for profile
// setup's first weight entry (design_handoff_macrograin screen 2).

export const weightLogs = pgTable(
  "weightLog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    weightKg: real("weightKg").notNull(),
    isUnreliable: boolean("isUnreliable").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (weightLog) => [unique().on(weightLog.userId, weightLog.date)]
)
