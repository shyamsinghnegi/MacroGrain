import Link from "next/link"
import { SegBar } from "@/components/seg-bar"

// PREVIEW ONLY — screen 06 "Confirm — AI, low confidence" from
// Macrograin.dc.html. No vision API is wired up yet (Phase 4); this is a
// static visual reference using the design's own placeholder data
// ("Mixed vegetable sabzi", ≈180 kcal) so the LOW CONFIDENCE treatment
// exists and can be reviewed, without pretending AI photo scanning works.

export default function AiConfirmPreview() {
  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="rounded-card border border-dashed border-warning/40 bg-warning/8 px-3 py-2 text-center font-mono text-[11px] text-warning">
        PREVIEW — static mock, no AI photo backend yet
      </div>

      <div className="flex items-center justify-between">
        <Link href="/" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-base font-semibold text-text">Confirm entry</p>
        <span className="rounded-input bg-accent/12 px-2.5 py-1 font-mono text-[9px] tracking-wide text-accent uppercase">
          AI Photo
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="size-16 shrink-0 rounded-card bg-[repeating-linear-gradient(45deg,#232323_0_5px,#171717_5px_10px)]" />
        <div>
          <p className="text-lg font-semibold text-text">
            Mixed vegetable sabzi
          </p>
          <p className="text-sm text-text-muted">estimated from photo · 1 bowl</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-card border-[1.5px] border-warning/40 bg-warning/10 px-3.5 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-4 rounded-[2px] bg-warning" />
          <span className="h-2 w-4 rounded-[2px] bg-white/10" />
          <span className="h-2 w-4 rounded-[2px] bg-white/10" />
        </div>
        <p className="font-mono text-xs tracking-wide text-warning uppercase">
          Low confidence · verify values
        </p>
      </div>

      <p className="text-sm leading-relaxed text-text-muted">
        AI could not identify oil quantity or portion precisely. Numbers are
        approximate — please confirm before saving.
      </p>

      <div className="rounded-hero border border-warning/25 bg-surface p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="font-doto text-[11px] tracking-[0.2em] text-text-faint uppercase">
            Calories · est
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-mono text-base text-warning">≈</span>
            <span className="font-doto text-4xl font-black text-text">180</span>
          </p>
        </div>
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="mb-1.5 flex justify-between">
              <span className="text-sm text-protein">Protein</span>
              <span className="font-mono text-sm text-warning">≈ 5 g</span>
            </div>
            <SegBar filled={4} total={20} color="var(--color-protein)" height={8} />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between">
              <span className="text-sm text-carbs">Carbs</span>
              <span className="font-mono text-sm text-warning">≈ 14 g</span>
            </div>
            <SegBar filled={8} total={20} color="var(--color-carbs)" height={8} />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between">
              <span className="text-sm text-fat">Fat</span>
              <span className="font-mono text-sm text-warning">≈ 12 g</span>
            </div>
            <SegBar filled={10} total={20} color="var(--color-fat)" height={8} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled
          className="flex-1 cursor-not-allowed rounded-pill border-[1.5px] border-white/18 py-4 text-sm font-semibold text-text opacity-60"
        >
          Discard
        </button>
        <button
          type="button"
          disabled
          className="flex-1 cursor-not-allowed rounded-pill bg-text py-4 text-sm font-bold text-bg opacity-60"
        >
          Verify &amp; add
        </button>
      </div>
    </div>
  )
}
