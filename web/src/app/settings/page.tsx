import { auth, signOut } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Droplet, Palette } from "lucide-react"
import { ToastFromParam } from "@/components/toast"
import { RemindersToggle } from "@/components/reminders-toggle"
import { UnitToggle } from "@/components/unit-toggle"

// Settings — see design_handoff_macrograin/weekly+goals+accountandsettings.png
// screen 15 "Account & settings": profile row, DATA SOURCES section with
// connected/off status dots, PREFERENCES section, sign out. Water goal
// added into Preferences per explicit request (not in the original design).

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) redirect("/profile/edit")

  const initial = (session.user.name ?? session.user.email ?? "?")[0]?.toUpperCase()

  const dataSources = [
    { label: "Open Food Facts", connected: true },
    // Reflects whether a real USDA_API_KEY is actually configured, not a
    // hardcoded true/false - search silently degrades to OFF-only when the
    // key is unset (see api/foods/search/route.ts), so this row should too
    // rather than claiming a connection that isn't live.
    { label: "USDA FoodData", connected: Boolean(process.env.USDA_API_KEY) },
  ]

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <ToastFromParam />
      <h1 className="text-2xl font-semibold text-text">Settings</h1>

      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card"
      >
        <div className="flex size-12.5 items-center justify-center rounded-input bg-accent font-doto text-xl font-black text-bg">
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-text">{session.user.name}</p>
          <p className="font-mono text-xs text-text-muted">{session.user.email}</p>
        </div>
        <ChevronRight size={18} className="text-text-faint" />
      </Link>

      <div className="flex flex-col gap-2">
        <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
          Data sources
        </p>
        <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-card">
          {dataSources.map((source) => (
            <div
              key={source.label}
              className="flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-sm text-text">{source.label}</span>
              <span
                className={`flex items-center gap-1.5 font-mono text-xs ${
                  source.connected ? "text-accent" : "text-text-faint"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    source.connected ? "bg-accent" : "bg-text-faint"
                  }`}
                />
                {source.connected ? "connected" : "off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="label-mono font-doto text-[10px] tracking-[0.18em] text-text-faint uppercase">
          Preferences
        </p>
        <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-card">
          <Link
            href="/goal"
            className="flex items-center justify-between px-4 py-3.5"
          >
            <span className="text-sm text-text">Goal</span>
            <ChevronRight size={16} className="text-text-faint" />
          </Link>

          <Link
            href="/water/goal"
            className="flex items-center justify-between px-4 py-3.5"
          >
            <span className="flex items-center gap-1.5 text-sm text-text">
              <Droplet size={13} className="text-info" />
              Water goal
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
              {(profile.waterGoalMl / 1000).toFixed(1)} L
              <ChevronRight size={16} className="text-text-faint" />
            </span>
          </Link>

          <UnitToggle unitSystem={profile.unitSystem} />

          <Link
            href="/settings/appearance"
            className="flex items-center justify-between px-4 py-3.5"
          >
            <span className="flex items-center gap-1.5 text-sm text-text">
              <Palette size={13} className="text-accent" />
              Appearance
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
              {profile.theme === "dark" ? "Dark" : "Light"}
              <ChevronRight size={16} className="text-text-faint" />
            </span>
          </Link>

          <RemindersToggle enabled={profile.remindersEnabled} />
        </div>
      </div>

      <form
        action={async () => {
          "use server"
          await signOut()
        }}
      >
        <button
          type="submit"
          className="w-full rounded-pill border-[1.5px] border-warning/40 px-5 py-2 text-sm font-medium text-warning transition-colors hover:border-warning/70"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
