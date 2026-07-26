"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const COOKIE_NAME = "mg_onboarded"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10

function hasCookie(name: string) {
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`))
}

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
