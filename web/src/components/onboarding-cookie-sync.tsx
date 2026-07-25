"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const COOKIE_NAME = "mg_onboarded"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10

function hasCookie(name: string) {
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`))
}

// Backfills the nav-gating cookie (see lib/onboarding.ts) client-side for
// accounts that completed profile setup before this cookie existed - they
// have a real profile row but no cookie yet, so the root layout would
// otherwise keep hiding their nav forever. Only rendered when the server
// already knows a profile row exists (see page.tsx), so setting this cookie
// here is always correct, never a way to skip setup early.
//
// Cookies can only be set from a Server Action/Route Handler or client-side
// document.cookie - not during a plain Server Component render, which is
// what the original approach (calling this from page.tsx's render) hit:
// "Cookies can only be modified in a Server Action or Route Handler."
// Mirrors TimezoneSync's exact pattern for the same reason.
//
// A client-set cookie isn't visible to the root layout's server-rendered
// `hasCompletedOnboarding()` check until the *next* request - without the
// router.refresh() below, the nav would stay hidden on this exact page load
// and only appear after the user manually reloaded or navigated again
// (confirmed: this happened on first rollout). refresh() re-runs the
// server-rendered layout against the cookie that was just set, so the nav
// appears immediately instead.
export function OnboardingCookieSync() {
  const router = useRouter()

  useEffect(() => {
    if (hasCookie(COOKIE_NAME)) return
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`
    router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
