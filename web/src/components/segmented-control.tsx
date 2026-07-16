"use client"

// Segmented pill control — see design_handoff_macrograin/README.md
// "Interactions & Behavior > Goal segmented control / Scan mode toggle"

export function SegmentedControl<T extends string>({
  name,
  options,
  defaultValue,
}: {
  name: string
  options: readonly { value: T; label: string }[]
  defaultValue?: T
}) {
  return (
    <div className="flex w-fit gap-1 rounded-pill bg-card p-1 shadow-inset-input">
      {options.map((option) => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
            className="peer sr-only"
          />
          <span className="block cursor-pointer rounded-pill px-4 py-1.5 text-center text-sm text-text-muted transition-all duration-150 peer-checked:bg-text peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}
