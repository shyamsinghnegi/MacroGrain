import Link from "next/link"
import { buttonClass } from "./button"

// Empty state — see design_handoff_macrograin/state+edgecases.png
// (E1 "Empty - first day", E2 "Empty - no weight data", E2b "Empty - no log
// for day"): dashed-border placeholder + zero numeral + neutral headline +
// one-line explanation + a single lime CTA.

export function EmptyState({
  headline,
  description,
  ctaLabel,
  ctaHref,
}: {
  headline: string
  description: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex size-24 items-center justify-center rounded-full border border-dashed border-hairline">
        <span className="font-doto text-3xl font-black text-text-ghost">
          0
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-text">{headline}</p>
        <p className="max-w-[260px] text-sm text-text-muted">{description}</p>
      </div>
      <Link href={ctaHref} className={buttonClass("accent")}>
        {ctaLabel}
      </Link>
    </div>
  )
}
