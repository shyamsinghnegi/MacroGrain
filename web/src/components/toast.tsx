"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Check, AlertTriangle } from "lucide-react"

// Toast — see design_handoff_macrograin/README.md "Toast":
// #1A1A1A pill, colored border. Success: lime border, check badge.
// Warning: orange border, warning badge.
// Triggered via a `?toast=` query param set by a Server Action's redirect
// (redirect("/?toast=Added+%C2%B7+113+kcal") style), since the toast must
// survive a full page navigation after the action completes.

export function ToastFromParam() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const message = searchParams.get("toast")
  const variant = searchParams.get("toastVariant") === "warning" ? "warning" : "success"

  // Tracks which message has already been dismissed, so a *new* toast
  // message reactivates visibility without an extra setState call at the
  // top of the effect (avoids the "setState synchronously in an effect"
  // lint rule while still handling back-to-back toasts correctly).
  const [dismissed, setDismissed] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!message) return
    timeoutRef.current = setTimeout(() => {
      setDismissed(message)
      const params = new URLSearchParams(searchParams)
      params.delete("toast")
      params.delete("toastVariant")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, 3000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  if (!message || dismissed === message) return null

  const isWarning = variant === "warning"

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div
        className={`animate-toast-in pointer-events-auto flex items-center gap-2 rounded-pill bg-card-alt px-4 py-2.5 shadow-hero ${
          isWarning ? "border border-warning/50" : "border border-accent/50"
        }`}
      >
        {isWarning ? (
          <AlertTriangle size={14} className="text-warning" />
        ) : (
          <Check size={14} className="text-accent" />
        )}
        <p className="text-sm text-text">{message}</p>
      </div>
    </div>
  )
}
