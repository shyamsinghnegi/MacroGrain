import Link from "next/link"

// PREVIEW ONLY — screen 07 "Nutrition label — confirm read" from
// Macrograin.dc.html. No OCR backend exists yet (Phase 4); static mock
// using the design's own placeholder values, flagging the misread pattern
// (one field highlighted orange, "tap to fix") for visual reference.

export default function NutritionLabelPreview() {
  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 rounded-card border border-dashed border-warning/40 bg-warning/8 px-3 py-2 text-center font-mono text-[11px] text-warning">
        PREVIEW — static mock, no OCR backend yet
      </div>

      <div className="mb-4.5 flex items-center justify-between">
        <Link href="/" className="font-mono text-lg text-text-muted">
          ←
        </Link>
        <p className="text-base font-semibold text-text">Read from label</p>
        <span className="w-5" />
      </div>

      <div className="mb-4.5 flex gap-3.5">
        <div className="relative w-[88px] shrink-0 rounded-input bg-[#f4f1e8] p-1.5">
          <div className="border-b-2 border-black pb-0.5 font-mono text-[6px] font-bold text-black">
            NUTRITION FACTS
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="h-0.5 w-[90%] bg-black" />
            <span className="h-0.5 w-[70%] bg-black" />
            <span className="h-0.5 w-[80%] bg-black" />
            <span className="h-0.5 w-[55%] bg-[#cc0000]" />
            <span className="h-0.5 w-[60%] bg-black" />
            <span className="h-0.5 w-[75%] bg-black" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          We read the panel via OCR. Confirm each value or fix the flagged
          field before saving.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3.5">
          <span className="text-sm text-text">Serving size</span>
          <span className="font-mono text-sm text-text">30 g</span>
        </div>
        <button
          type="button"
          className="flex items-center justify-between rounded-input border-[1.5px] border-warning/50 bg-warning/10 px-4 py-3.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-text">
            <span className="size-1.5 rounded-full bg-warning" />
            Energy
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm text-warning">250 ?</span>
            <span className="text-xs text-warning">tap to fix</span>
          </span>
        </button>
        <div className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3.5">
          <span className="text-sm text-text">Protein</span>
          <span className="font-mono text-sm text-text">3.1 g</span>
        </div>
        <div className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3.5">
          <span className="text-sm text-text">Carbohydrate</span>
          <span className="font-mono text-sm text-text">21.0 g</span>
        </div>
        <div className="flex items-center justify-between rounded-input border border-hairline bg-card px-4 py-3.5">
          <span className="text-sm text-text">Fat</span>
          <span className="font-mono text-sm text-text">9.4 g</span>
        </div>
      </div>

      <p className="mt-3.5 flex items-center gap-2 font-mono text-[11px] text-warning">
        <span>⚠</span> 1 field needs review — energy value looks unusually
        high
      </p>

      <div className="flex-1" />

      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-pill bg-text py-4 text-sm font-bold text-bg opacity-60"
      >
        Confirm values
      </button>
    </div>
  )
}
