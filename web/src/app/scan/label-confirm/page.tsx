import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LabelConfirmClient } from "./label-confirm-client"

export default async function LabelConfirmPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  return <LabelConfirmClient />
}
