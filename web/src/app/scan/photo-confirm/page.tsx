import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PhotoConfirmClient } from "./photo-confirm-client"

export default async function PhotoConfirmPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  return <PhotoConfirmClient />
}
