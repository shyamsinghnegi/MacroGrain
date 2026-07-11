import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  date,
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
