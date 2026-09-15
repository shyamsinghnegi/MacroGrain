import { auth } from "@/auth"
import { NextRequest } from "next/server"
import { checkAndRecordAiUsage } from "@/lib/ai-usage"
import { getTimezone } from "@/lib/timezone"
import { estimateFoodFromPhoto } from "@/lib/gemini"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(null, { status: 401 })
  }

  const timezone = await getTimezone()
  // Parsing the multipart body doesn't depend on the usage-limit check (a
  // D1 round-trip) or vice versa - overlapping them instead of awaiting
  // one after the other shaves a full D1 hop off the critical path before
  // the Gemini call even starts.
  const [usage, formData] = await Promise.all([
    checkAndRecordAiUsage(session.user.id, "photo", timezone),
    request.formData(),
  ])
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

  const file = formData.get("photo")
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing photo" }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Photo too large" }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const hint = formData.get("hint")?.toString() || undefined

  try {
    const result = await estimateFoodFromPhoto(base64, file.type || "image/jpeg", hint)
    return Response.json(result)
  } catch (e) {
    console.error("AI photo scan failed:", e)
    return Response.json({ error: "Could not analyze photo. Try again or log manually." }, { status: 502 })
  }
}
