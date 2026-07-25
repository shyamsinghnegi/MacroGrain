import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Suspense } from "react"
import { FoodSearch } from "./food-search"
import { FoodDetail } from "./food-detail"
import { DitherBg } from "@/components/dither-bg"

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{
    foodId?: string
    returnTo?: string
    date?: string
    hour?: string
  }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  const { foodId, returnTo, date, hour } = await searchParams

  const selectedFood = foodId
    ? await db.query.foods.findFirst({ where: eq(foods.id, foodId) })
    : undefined

  // Carry the timeline context (where to return to, and which day/hour to
  // log into) through the search -> create/select -> quantity steps so a
  // "+ Add food at 2 PM" from /timeline ends up back on /timeline, at 2 PM.
  const context = { returnTo, date, hour }
  const backHref = returnTo && returnTo.startsWith("/") ? returnTo : "/timeline"

  return (
    <div className="relative mx-auto w-full pb-28 sm:max-w-xl">
      {!selectedFood && <DitherBg height={280} fadeAt={25} />}
      <div className={`relative z-10 ${selectedFood ? "px-4 pt-16 sm:px-6" : "px-4 sm:px-6"}`}>
        {selectedFood ? (
          <>
            <div className="mb-5 flex items-center gap-3.5">
              <Link href="/log" className="font-mono text-lg text-text-muted">
                ←
              </Link>
              <h1 className="text-lg font-semibold text-text">Food details</h1>
            </div>
            <FoodDetail food={selectedFood} context={context} />
          </>
        ) : (
          <Suspense fallback={null}>
            <FoodSearch context={context} backHref={backHref} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
