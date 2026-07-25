"use client"

import { useEffect } from "react"
import { syncTimezone } from "@/app/settings/timezone-actions"

const COOKIE_NAME = "mg_tz"

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Detects the browser's IANA timezone and saves it to the user's profile
// only when it doesn't match what's already recorded in a cookie - this
// deliberately avoids querying the database on every page load (D1's free
// tier has a daily query budget; a per-navigation read here would burn one
// on every single route change for something that changes essentially
// never). The cookie is the source of truth for "have we already synced
// this," not a server round-trip - one DB write on first visit or after an
// actual timezone change (e.g. travel), then silent.
export function TimezoneSync() {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!detected) return

    if (readCookie(COOKIE_NAME) === detected) return

    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(detected)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    syncTimezone(detected)
  }, [])

  return null
}
