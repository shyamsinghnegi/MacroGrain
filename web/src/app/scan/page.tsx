import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ScanClient } from "./scan-client"

export default async function ScanPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  return <ScanClient />
}
