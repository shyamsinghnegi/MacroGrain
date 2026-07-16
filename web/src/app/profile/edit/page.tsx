import { auth } from "@/auth"
import { db } from "@/db"
import { profiles, weightLogs } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"

export default async function EditProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/")
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  const latestWeight = await db.query.weightLogs.findFirst({
    where: eq(weightLogs.userId, session.user.id),
    orderBy: desc(weightLogs.date),
  })

  return (
    <div className="mx-auto max-w-md px-6 pt-16 pb-28">
      <h1 className="mb-8 text-2xl font-semibold text-text">
        {profile ? "Edit profile" : "Set up your profile"}
      </h1>
      <ProfileForm profile={profile} weightKg={latestWeight?.weightKg} />
    </div>
  )
}
