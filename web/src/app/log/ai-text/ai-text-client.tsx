"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/skeleton"
import { Sparkles, ArrowLeft } from "lucide-react"

export function AiTextClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""
  
  const [description, setDescription] = useState(initialQ)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    if (!description.trim() || analyzing) return
    setAnalyzing(true)
    setError(null)

    try {
      const res = await fetch("/api/scan/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      })

      if (!res.ok) {
        let message = "Could not analyze text. Try again."
        if (res.headers.get("content-type")?.includes("application/json")) {
           const data = await res.json().catch(() => null)
           message = data?.message ?? message
        }
        throw new Error(message)
      }

      const data = await res.json()
      sessionStorage.setItem("mg_ai_photo_result", JSON.stringify(data))
      router.push("/scan/photo-confirm?returnTo=/log")
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred.")
      setAnalyzing(false)
    }
  }

  if (analyzing) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col bg-bg-deep px-8">
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 font-mono text-xs text-accent">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            ANALYZING DESCRIPTION…
          </div>
          <div className="w-full max-w-sm rounded-hero bg-surface p-5 shadow-hero">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <span className="font-mono text-[11px] text-text-faint">
            This can take a few seconds
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center text-text-muted hover:text-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <p className="text-base font-semibold text-text">AI Estimate</p>
        <div className="w-5" /> {/* spacer */}
      </div>

      <div className="flex flex-col flex-1 gap-6">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2 flex items-center gap-2">
            <Sparkles className="text-accent" size={24} />
            Describe your meal
          </h2>
          <p className="text-sm text-text-muted">
            The more details you provide (ingredients, cooking method, portion size), the more accurate the AI&apos;s estimate will be.
          </p>
        </div>

        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 1 large bowl of ghiya ki sabji made with 1 tbsp ghee and 2 whole wheat rotis"
            className="w-full h-48 resize-none rounded-2xl bg-card border border-hairline p-5 text-base text-text placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {error && (
          <div className="rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-center">
            <p className="text-sm text-warning">{error}</p>
          </div>
        )}

        <div className="mt-auto pt-6">
          <button
            onClick={handleAnalyze}
            disabled={!description.trim() || analyzing}
            className="w-full rounded-pill bg-accent py-4 text-center text-base font-bold text-bg shadow-accent-glow disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Generate Macros
          </button>
        </div>
      </div>
    </div>
  )
}
