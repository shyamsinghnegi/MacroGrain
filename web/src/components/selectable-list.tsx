"use client"

// Selectable list — see design_handoff_macrograin/README.md "Profile setup"
// (activity-level list, selected row = lime border + mono multiplier)

export function SelectableList<T extends string>({
  name,
  options,
  defaultValue,
}: {
  name: string
  options: readonly { value: T; label: string; meta?: string }[]
  defaultValue?: T
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label key={option.value} className="relative block">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
            className="peer sr-only"
          />
          <span className="flex cursor-pointer items-center justify-between rounded-card border border-hairline bg-card px-4 py-3 text-sm text-text transition-colors peer-checked:border-[1.5px] peer-checked:border-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2">
            {option.label}
            {option.meta && (
              <span className="font-mono text-xs text-text-muted">
                {option.meta}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  )
}
