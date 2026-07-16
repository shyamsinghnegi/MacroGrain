import { SegBar } from "./seg-bar"

// Onboarding step indicator — see design_handoff_macrograin/README.md
// "Profile setup — step 2/3 (lime progress segments)"

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SegBar filled={step} total={total} color="var(--color-accent)" gap={4} height={4} />
      <p className="font-mono text-xs text-text-muted">
        STEP {step}/{total}
      </p>
    </div>
  )
}
