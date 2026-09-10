import { auth, signOut } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"
import { getUnitSystem } from "@/lib/unit-preference"

export default async function EditProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const [profile, latestWeight] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    db.query.weightLogs.findFirst({
      where: eq(weightLogs.userId, session.user.id),
      orderBy: desc(weightLogs.date),
    }),
  ])

  const unitSystem = await getUnitSystem(profile?.unitSystem)

  return (
    <div className="mx-auto w-full px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">
          {profile ? "Edit profile" : "Set up your profile"}
        </h1>
        {!profile && (
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button
              type="submit"
              className="mt-1 shrink-0 font-mono text-xs text-text-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-text"
            >
              Not you? Sign out
            </button>
          </form>
        )}
      </div>
      <ProfileForm profile={profile} weightKg={latestWeight?.weightKg} unitSystem={unitSystem} />
    </div>
  )
}
