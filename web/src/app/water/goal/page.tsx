import { auth } from "@/auth"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { WaterGoalForm } from "./water-goal-form"

export default async function WaterGoalPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })
  if (!profile) redirect("/profile/edit")

  return <WaterGoalForm initialGoalMl={profile.waterGoalMl} />
}
