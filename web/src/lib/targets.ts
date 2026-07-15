import type { goal } from "@/db/schema"

// Placeholder targets until Phase 6's adaptive TDEE algorithm exists.
// Numbers match the design handoff's goal-settings screen.
export const STATIC_TARGETS: Record<(typeof goal)[number], number> = {
  cut: 1850,
  maintain: 2350,
  bulk: 2650,
}
