"use client"

import { useActionState, useState } from "react"
import { saveProfile } from "./actions"
import { Label, FieldError } from "@/components/input"
import { Button } from "@/components/button"
import { SegmentedControl } from "@/components/segmented-control"
import { SelectableList } from "@/components/selectable-list"
import { StepProgress } from "@/components/step-progress"
import Link from "next/link"

// Standard Harris-Benedict/Mifflin activity multipliers — displayed now,
// used for real TDEE math in Phase 6.
const activityLevels = [
  { value: "sedentary", label: "Sedentary", meta: "×1.2" },
  { value: "light", label: "Light (1-3 days/week)", meta: "×1.375" },
  { value: "moderate", label: "Moderate (3-5 days/week)", meta: "×1.55" },
  { value: "active", label: "Active (6-7 days/week)", meta: "×1.725" },
  { value: "very_active", label: "Very active", meta: "×1.9" },
] as const

const sexes = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const

const goals = [
  { value: "cut", label: "Cut" },
  { value: "maintain", label: "Maintain" },
  { value: "bulk", label: "Bulk" },
] as const

// "How aggressive" - only meaningful for cut/bulk (maintain always resolves
// to 0 kg/week, see lib/tdee.ts's paceToRate), but always collected here so
// goalRate/currentTargetKcal are never left null after signup - previously
// this question didn't exist at all during onboarding, only reachable later
// via the standalone /goal screen most users never found.
const paces = [
  { value: "slow", label: "Slow", meta: "gentle" },
  { value: "steady", label: "Steady", meta: "recommended" },
  { value: "aggressive", label: "Aggressive", meta: "faster" },
] as const

type Profile = {
  heightCm: number | null
  sex: "male" | "female" | null
  birthDate: string | null
  activityLevel: (typeof activityLevels)[number]["value"] | null
  goal: (typeof goals)[number]["value"] | null
}

// Compact inset stat-card input — see design_handoff_macrograin/Macrograin.dc.html
// "Profile setup": Height/Weight/DOB shown as small mono value tiles, not
// full-width text fields.
function StatInput({
  id,
  name,
  label,
  unit,
  type = "number",
  step,
  defaultValue,
}: {
  id: string
  name: string
  label: string
  unit?: string
  type?: string
  step?: string
  defaultValue?: string | number
}) {
  return (
    <div className="flex-1 rounded-input border border-hairline bg-card px-4 py-3 shadow-inset-input">
      <label htmlFor={id} className="block text-xs text-text-muted">
        {label}
      </label>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <input
          id={id}
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue}
          className="w-full min-w-0 bg-transparent font-mono text-xl text-text outline-none"
        />
        {unit && <span className="text-sm text-text-faint">{unit}</span>}
      </div>
    </div>
  )
}

export function ProfileForm({
  profile,
  weightKg,
}: {
  profile: Profile | undefined
  weightKg: number | undefined
}) {
  const [state, formAction, pending] = useActionState(saveProfile, undefined)
  const [selectedGoal, setSelectedGoal] = useState<(typeof goals)[number]["value"]>(
    profile?.goal ?? "maintain"
  )

  const isFirstTime = !profile

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5">
        <Link href={isFirstTime ? "/" : "/profile"} className="font-mono text-lg text-text-faint">
          ←
        </Link>
        {isFirstTime ? (
          <div className="flex-1">
            <StepProgress step={2} total={3} />
          </div>
        ) : (
          <p className="text-lg font-semibold text-text">Edit profile</p>
        )}
      </div>

      <div>
        <div className="flex gap-3">
          <StatInput
            id="heightCm"
            name="heightCm"
            label="Height"
            unit="cm"
            defaultValue={profile?.heightCm ?? undefined}
          />
          <StatInput
            id="weightKg"
            name="weightKg"
            label="Weight"
            unit="kg"
            step="0.1"
            defaultValue={weightKg ?? undefined}
          />
        </div>
        <FieldError message={state?.errors?.heightCm?.[0] ?? state?.errors?.weightKg?.[0]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Sex</Label>
        <SegmentedControl name="sex" options={sexes} defaultValue={profile?.sex ?? undefined} />
        <FieldError message={state?.errors?.sex?.[0]} />
      </div>

      <StatInput
        id="birthDate"
        name="birthDate"
        label="Date of birth"
        type="date"
        defaultValue={profile?.birthDate ?? undefined}
      />
      <FieldError message={state?.errors?.birthDate?.[0]} />

      <div className="flex flex-col gap-1.5">
        <Label>Activity level</Label>
        <SelectableList
          name="activityLevel"
          options={activityLevels}
          defaultValue={profile?.activityLevel ?? undefined}
        />
        <FieldError message={state?.errors?.activityLevel?.[0]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Goal</Label>
        <SegmentedControl
          name="goal"
          options={goals}
          defaultValue={profile?.goal ?? "maintain"}
          onChange={setSelectedGoal}
        />
        <FieldError message={state?.errors?.goal?.[0]} />
      </div>

      {selectedGoal !== "maintain" && (
        <div className="flex flex-col gap-1.5">
          <Label>How aggressive?</Label>
          <SelectableList name="pace" options={paces} defaultValue="steady" />
          <FieldError message={state?.errors?.pace?.[0]} />
        </div>
      )}
      {selectedGoal === "maintain" && <input type="hidden" name="pace" value="steady" />}

      <Button type="submit" variant="accent" disabled={pending} className="mt-2">
        {pending ? "Saving..." : isFirstTime ? "Continue" : "Save changes"}
      </Button>
    </form>
  )
}
