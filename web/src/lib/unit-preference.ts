import "server-only"
import { cookies } from "next/headers"
import type { unitSystem } from "@/db/schema"

const UNIT_COOKIE = "mg_units"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function getUnitSystem(fallback?: (typeof unitSystem)[number]) {
  const cookieStore = await cookies()
  return (
    (cookieStore.get(UNIT_COOKIE)?.value as (typeof unitSystem)[number] | undefined) ??
    fallback ??
    "metric"
  )
}

export async function setUnitSystemCookie(value: (typeof unitSystem)[number]) {
  const cookieStore = await cookies()
  cookieStore.set(UNIT_COOKIE, value, { maxAge: COOKIE_MAX_AGE, path: "/" })
}
