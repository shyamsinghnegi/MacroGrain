import { auth } from "@/auth"
import { NextRequest } from "next/server"
import { checkAndRecordAiUsage } from "@/lib/ai-usage"
import { getTimezone } from "@/lib/timezone"
import { estimateFoodFromText } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(null, { status: 401 })
  }

  const timezone = await getTimezone()
  const usage = await checkAndRecordAiUsage(session.user.id, "text", timezone)
  
  if (!usage.allowed) {
    return Response.json(
      {
        error: "daily_limit_reached",
        message: "You've hit today's AI scan limit. Try again tomorrow, or log this one manually.",
        usedToday: usage.usedToday,
      },
      { status: 429 }
    )
  }

  const { description } = await request.json()
  if (typeof description !== "string" || description.trim().length === 0) {
    return Response.json({ error: "Missing description" }, { status: 400 })
  }

  try {
    const result = await estimateFoodFromText(description.trim())
    return Response.json(result)
  } catch (e) {
    console.error("AI text scan failed:", e)
    return Response.json({ error: "Could not analyze text. Try again or log manually." }, { status: 502 })
  }
}
