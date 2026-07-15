import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { FoodSearch } from "./food-search"
import { LogEntryForm } from "./log-entry-form"

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ foodId?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  const { foodId } = await searchParams

  const selectedFood = foodId
    ? await db.query.foods.findFirst({ where: eq(foods.id, foodId) })
    : undefined

  return (
    <div className="mx-auto max-w-md px-6 pt-16 pb-28">
      <h1 className="mb-8 text-2xl font-semibold text-text">Log food</h1>
      {selectedFood ? (
        <LogEntryForm food={selectedFood} />
      ) : (
        <FoodSearch />
      )}
    </div>
  )
}
