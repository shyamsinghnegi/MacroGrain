import "server-only"
import { cookies } from "next/headers"

const COOKIE_NAME = "mg_tz"

// Reads the user's timezone from the cookie TimezoneSync sets client-side -
// zero DB queries. Falls back to a profile row's stored `timezone` column
// only when the cookie isn't there yet (first request of a brand-new
// session, before the client component has had a chance to run), and to
// "UTC" if neither is available. Deliberately does NOT query the database
// itself - callers that already have a profile row fetched for other
// reasons should pass its `timezone` as the fallback; callers with no such
// row shouldn't add a query just for this.
export async function getTimezone(profileTimezoneFallback?: string | null) {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(COOKIE_NAME)?.value
  if (fromCookie) return fromCookie
  return profileTimezoneFallback ?? "UTC"
}
