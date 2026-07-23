import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  const initial = (session.user.name ?? session.user.email ?? "?")[0]?.toUpperCase()

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 pt-16 pb-28">
      <h1 className="text-2xl font-semibold text-text">Settings</h1>

      <div className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent font-doto font-bold text-bg">
          {initial}
        </div>
        <div>
          <p className="text-text">{session.user.name}</p>
          <p className="font-mono text-xs text-text-muted">{session.user.email}</p>
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
