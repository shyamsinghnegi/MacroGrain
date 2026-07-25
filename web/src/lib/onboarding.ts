import "server-only"
import { cookies } from "next/headers"

const COOKIE_NAME = "mg_onboarded"
// ~10 years - this only ever needs to flip true once and stay true; there's
// no reason for it to expire while the account exists. Not httpOnly/secure
// flags set explicitly since this repo's other cookie helpers (timezone,
// theme) don't either - this one carries no sensitive data, just a boolean.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10

// Marks profile setup as complete so the root layout can decide whether to
// show BottomNav (see layout.tsx) without querying the profiles table on
// every navigation - mirrors lib/timezone.ts/lib/theme.ts's cookie-only
// pattern. Call once, right when saveProfile succeeds.
export async function markOnboardingComplete() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "1", { maxAge: COOKIE_MAX_AGE_SECONDS, path: "/" })
}

export async function hasCompletedOnboarding() {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === "1"
}
