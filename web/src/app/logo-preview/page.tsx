import {
  Logo1BarStalk,
  Logo2ReticleSeed,
  Logo3PercentDrop,
  Logo4HexGrain,
} from "@/components/logo-concepts"

// Temporary preview page for comparing the 4 hand-built logo concept SVGs
// against the real app theme (accent color, dark background) before picking
// one - not part of the real app, delete once a logo is chosen.
const concepts = [
  { Icon: Logo1BarStalk, name: "1 — Bar-chart stalk" },
  { Icon: Logo2ReticleSeed, name: "2 — Reticle seed" },
  { Icon: Logo3PercentDrop, name: "3 — Percent drop" },
  { Icon: Logo4HexGrain, name: "4 — Hex grain" },
]

export default function LogoPreviewPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <h1 className="text-2xl font-semibold text-text">Logo concepts</h1>
      <p className="text-sm text-text-muted">
        Rendered with currentColor, so each one already follows the active
        accent color below.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {concepts.map(({ Icon, name }) => (
          <div
            key={name}
            className="flex flex-col items-center gap-3 rounded-card border border-hairline bg-card p-6"
          >
            <Icon className="size-24 text-accent" />
            <p className="text-center text-sm text-text-muted">{name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
