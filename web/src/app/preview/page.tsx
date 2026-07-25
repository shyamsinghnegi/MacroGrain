import Link from "next/link"

// Index of design-preview-only screens — visual mocks for design_handoff
// screens that need a backend we don't have yet (vision API). None of
// these are reachable from real app navigation. Screens 12/13 (weekly
// summary/TDEE) used to live here too - they're now a real, working
// implementation at /weekly-summary, not a mock, so they've been removed
// from this preview-only list.

const previews = [
  { href: "/preview/ai-confirm", label: "06 — Confirm, AI low confidence" },
  { href: "/preview/nutrition-label", label: "07 — Nutrition label OCR" },
]

export default function PreviewIndexPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <h1 className="text-2xl font-semibold text-text">Design previews</h1>
      <p className="text-sm text-text-muted">
        Static mocks for screens that need a backend we don&apos;t have yet
        (AI vision, TDEE algorithm). Not part of the real app flow.
      </p>
      <div className="flex flex-col gap-2">
        {previews.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="rounded-card border border-hairline bg-card px-4 py-3.5 text-sm text-text"
          >
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
