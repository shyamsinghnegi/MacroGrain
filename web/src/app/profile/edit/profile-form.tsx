"use client"

import { useActionState, useState } from "react"
import { saveProfile } from "./actions"
import { Label, FieldError } from "@/components/input"
import { Button } from "@/components/button"
import { SegmentedControl } from "@/components/segmented-control"
import { SelectableList } from "@/components/selectable-list"
import { StepProgress } from "@/components/step-progress"
import Link from "next/link"
import {
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  type UnitSystem,
} from "@/lib/units"

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
  const inputMode = type === "number" && step && step !== "1" ? "decimal" : undefined

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
          inputMode={inputMode}
          defaultValue={defaultValue}
          className="w-full min-w-0 bg-transparent font-mono text-xl text-text outline-none"
        />
        {unit && <span className="text-sm text-text-faint">{unit}</span>}
      </div>
    </div>
  )
}

function HeightInput({
  unitSystem,
  defaultValueCm,
}: {
  unitSystem: UnitSystem
  defaultValueCm?: number
}) {
  const initial = defaultValueCm ? cmToFtIn(defaultValueCm) : null
  const [ft, setFt] = useState(initial ? String(initial.ft) : "")
  const [inches, setInches] = useState(initial ? String(initial.in) : "")
  const [cm, setCm] = useState(defaultValueCm ? String(defaultValueCm) : "")

  if (unitSystem === "imperial") {
    const cmValue = ft !== "" && inches !== "" ? ftInToCm(Number(ft), Number(inches)) : ""
    return (
      <div className="flex-1 rounded-input border border-hairline bg-card px-4 py-3 shadow-inset-input">
        <label className="block text-xs text-text-muted">Height</label>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            placeholder="ft"
            value={ft}
            onChange={(e) => setFt(e.target.value)}
            className="w-10 min-w-0 bg-transparent font-mono text-xl text-text outline-none"
          />
          <span className="text-sm text-text-faint">ft</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            max={11}
            placeholder="in"
            value={inches}
            onChange={(e) => setInches(e.target.value)}
            className="w-10 min-w-0 bg-transparent font-mono text-xl text-text outline-none"
          />
          <span className="text-sm text-text-faint">in</span>
        </div>
        <input type="hidden" name="heightCm" value={cmValue} />
      </div>
    )
  }

  return (
    <div className="flex-1 rounded-input border border-hairline bg-card px-4 py-3 shadow-inset-input">
      <label htmlFor="heightCm" className="block text-xs text-text-muted">
        Height
      </label>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <input
          id="heightCm"
          name="heightCm"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={cm}
          onChange={(e) => setCm(e.target.value)}
          className="w-full min-w-0 bg-transparent font-mono text-xl text-text outline-none"
        />
        <span className="text-sm text-text-faint">cm</span>
      </div>
    </div>
  )
}

function WeightInput({
  unitSystem,
  defaultValueKg,
}: {
  unitSystem: UnitSystem
  defaultValueKg?: number
}) {
  const initial =
    defaultValueKg == null
      ? ""
      : unitSystem === "imperial"
        ? String(Math.round(kgToLb(defaultValueKg) * 10) / 10)
        : String(defaultValueKg)
  const [value, setValue] = useState(initial)
  const unitLabel = unitSystem === "imperial" ? "lb" : "kg"
  const kgValue = value === "" ? "" : unitSystem === "imperial" ? lbToKg(Number(value)) : Number(value)

  return (
    <div className="flex-1 rounded-input border border-hairline bg-card px-4 py-3 shadow-inset-input">
      <label htmlFor="weightKgInput" className="block text-xs text-text-muted">
        Weight
      </label>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <input
          id="weightKgInput"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-w-0 bg-transparent font-mono text-xl text-text outline-none"
        />
        <span className="text-sm text-text-faint">{unitLabel}</span>
      </div>
      <input type="hidden" name="weightKg" value={kgValue} />
    </div>
  )
}

export function ProfileForm({
  profile,
  weightKg,
  unitSystem,
}: {
  profile: Profile | undefined
  weightKg: number | undefined
  unitSystem: UnitSystem
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
          <HeightInput unitSystem={unitSystem} defaultValueCm={profile?.heightCm ?? undefined} />
          <WeightInput unitSystem={unitSystem} defaultValueKg={weightKg ?? undefined} />
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
