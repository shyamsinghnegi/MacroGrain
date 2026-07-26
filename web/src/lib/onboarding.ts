import "server-only"
import { cookies } from "next/headers"

const COOKIE_NAME = "mg_onboarded"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10

export async function markOnboardingComplete() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "1", { maxAge: COOKIE_MAX_AGE_SECONDS, path: "/" })
}

export async function hasCompletedOnboarding() {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === "1"
}
