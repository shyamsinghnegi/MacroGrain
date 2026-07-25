import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ConfirmBarcodeClient } from "./confirm-client"

export default async function ScanConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  const { barcode } = await searchParams
  if (!barcode) {
    redirect("/scan")
  }

  return <ConfirmBarcodeClient barcode={barcode} />
}
