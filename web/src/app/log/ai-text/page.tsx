import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AiTextClient } from "./ai-text-client"

export default async function AiTextPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  return <AiTextClient />
}
