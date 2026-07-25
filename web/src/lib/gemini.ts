import "server-only"

// Thin wrapper around Gemini's REST API (no SDK dependency - one endpoint,
// not worth the package). Uses gemini-3.6-flash: confirmed free of charge
// (input/output/context-caching all "Free of charge") on aistudio.google.com's
// own rate-limit page as of writing, and Google's current top flash-tier
// model with vision input - which is the whole reason Gemini was picked
// over other providers. See checkAndRecordAiUsage's comment for the daily
// cap this sits behind. If this ever graduates off the free tier the way
// older flash models did, check aistudio.google.com/rate-limit for
// whichever flash model currently shows "Free of charge" and swap it in.
const GEMINI_MODEL = "gemini-3.6-flash"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }

async function callGemini(
  parts: GeminiPart[],
  responseSchema: object
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== "string") {
    throw new Error("Gemini response missing expected text content")
  }

  return JSON.parse(text)
}

export type FoodPhotoResult = {
  name: string
  portionDescription: string
  caloriesEstimate: number
  proteinEstimate: number
  carbsEstimate: number
  fatEstimate: number
  confidence: "high" | "low"
  notes: string | null
}

const FOOD_PHOTO_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    portionDescription: { type: "string" },
    caloriesEstimate: { type: "number" },
    proteinEstimate: { type: "number" },
    carbsEstimate: { type: "number" },
    fatEstimate: { type: "number" },
    confidence: { type: "string", enum: ["high", "low"] },
    notes: { type: "string", nullable: true },
  },
  required: [
    "name",
    "portionDescription",
    "caloriesEstimate",
    "proteinEstimate",
    "carbsEstimate",
    "fatEstimate",
    "confidence",
  ],
}

const FOOD_PHOTO_PROMPT = `You are a nutrition estimation assistant. Look at this photo of a meal and identify what food it is, estimate the portion size, and estimate its nutrition.

Respond with:
- name: a short, specific dish name (e.g. "Mixed vegetable sabzi", not just "food")
- portionDescription: your best guess at the portion shown (e.g. "1 bowl, ~250g")
- caloriesEstimate, proteinEstimate (g), carbsEstimate (g), fatEstimate (g): your best numeric estimates for the portion shown
- confidence: "high" only if the food is clearly identifiable and portion size is easy to judge (e.g. a labeled packaged item, or a very familiar simple dish in a standard container). Use "low" for home-cooked mixed dishes, unclear portions, partially eaten food, or anything with hidden ingredients (oil, sauce, butter) you can't see.
- notes: a short explanation of what's uncertain (e.g. "Oil quantity not visible"), or null if confidence is high

Always return your best estimate even if uncertain - never refuse to answer.`

export async function estimateFoodFromPhoto(
  imageBase64: string,
  mimeType: string
): Promise<FoodPhotoResult> {
  const result = await callGemini(
    [
      { text: FOOD_PHOTO_PROMPT },
      { inline_data: { mime_type: mimeType, data: imageBase64 } },
    ],
    FOOD_PHOTO_SCHEMA
  )
  return result as FoodPhotoResult
}

export type NutritionLabelResult = {
  servingSizeDescription: string | null
  caloriesPerServing: number | null
  proteinPerServing: number | null
  carbsPerServing: number | null
  fatPerServing: number | null
  saturatedFatPerServing: number | null
  fiberPerServing: number | null
  sugarsPerServing: number | null
  sodiumMgPerServing: number | null
  flaggedFields: string[]
}

const NUTRITION_LABEL_SCHEMA = {
  type: "object",
  properties: {
    servingSizeDescription: { type: "string", nullable: true },
    caloriesPerServing: { type: "number", nullable: true },
    proteinPerServing: { type: "number", nullable: true },
    carbsPerServing: { type: "number", nullable: true },
    fatPerServing: { type: "number", nullable: true },
    saturatedFatPerServing: { type: "number", nullable: true },
    fiberPerServing: { type: "number", nullable: true },
    sugarsPerServing: { type: "number", nullable: true },
    sodiumMgPerServing: { type: "number", nullable: true },
    flaggedFields: { type: "array", items: { type: "string" } },
  },
  required: ["flaggedFields"],
}

const NUTRITION_LABEL_PROMPT = `You are reading a nutrition facts label from a photo. Extract the per-serving values exactly as printed.

Respond with:
- servingSizeDescription: the serving size as printed (e.g. "30 g"), or null if not legible
- caloriesPerServing, proteinPerServing (g), carbsPerServing (g), fatPerServing (g), saturatedFatPerServing (g), fiberPerServing (g), sugarsPerServing (g), sodiumMgPerServing (mg): the printed values, or null for any field that isn't present on the label or isn't legible
- flaggedFields: names of any fields (use these exact keys: "calories", "protein", "carbs", "fat", "saturatedFat", "fiber", "sugars", "sodium") where the print was blurry, partially obscured, or the number looks implausible for a food label (e.g. absurdly high) - so the user can double check them. Empty array if everything was clearly legible.

Never guess a number that isn't visibly printed - use null instead and do not add it to flaggedFields (flaggedFields is only for values you extracted but aren't confident about).`

export async function readNutritionLabel(
  imageBase64: string,
  mimeType: string
): Promise<NutritionLabelResult> {
  const result = await callGemini(
    [
      { text: NUTRITION_LABEL_PROMPT },
      { inline_data: { mime_type: mimeType, data: imageBase64 } },
    ],
    NUTRITION_LABEL_SCHEMA
  )
  return result as NutritionLabelResult
}
