import { auth } from "@/auth"
import { db } from "@/db"
import { foods } from "@/db/schema"
import { ilike } from "drizzle-orm"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response(null, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q) {
    return Response.json([])
  }

  const results = await db
    .select()
    .from(foods)
    .where(ilike(foods.name, `%${q}%`))
    .limit(10)

  return Response.json(results)
}
