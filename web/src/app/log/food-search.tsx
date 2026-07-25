"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { NewFoodForm } from "./new-food-form"
import { Input } from "@/components/input"
import { buttonClass } from "@/components/button"
import { Skeleton } from "@/components/skeleton"

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
  source: "off" | "usda" | "ifct" | "ai" | "manual"
}

type SearchResponse = {
  results: Food[]
  nextOffset: number | null
  debug?: { rawHitCount: number; usableCount: number; offTotalCount: number }
}

const sourceLabel: Record<Food["source"], string> = {
  off: "OFF",
  usda: "USDA",
  ifct: "IFCT",
  ai: "AI",
  manual: "MANUAL",
}

export type LogContext = {
  returnTo?: string
  date?: string
  hour?: string
}

function contextQuery(context: LogContext) {
  const params = new URLSearchParams()
  if (context.returnTo) params.set("returnTo", context.returnTo)
  if (context.date) params.set("date", context.date)
  if (context.hour) params.set("hour", context.hour)
  const query = params.toString()
  return query ? `&${query}` : ""
}

const STORAGE_KEY = "macrograin:foodSearchQuery"

export function FoodSearch({
  context = {},
  backHref,
}: {
  context?: LogContext
  backHref: string
}) {
  // Search text is kept in sessionStorage (not just the URL), because the
  // result link to /log?foodId=... never carried a `q` param - so leaving
  // this screen for a food's detail view and coming back lost the query
  // entirely, even though a `q` URL param can restore it in the cases where
  // it IS present (e.g. a bookmarked search link). sessionStorage survives
  // any back/forward within this tab and only clears on tab close, which is
  // exactly the "stays until you leave, not on this one screen" behavior.
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return ""
    return sessionStorage.getItem(STORAGE_KEY) ?? ""
  })
  const [results, setResults] = useState<Food[]>([])
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const requestIdRef = useRef(0)

  const runSearch = useCallback((q: string, offset: number) => {
    const requestId = ++requestIdRef.current
    const isFirstPage = offset === 0
    if (isFirstPage) {
      setError(false)
      setSearching(true)
    } else {
      setLoadingMore(true)
    }

    fetch(`/api/foods/search?q=${encodeURIComponent(q)}&offset=${offset}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        return res.json() as Promise<SearchResponse>
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return // a newer search superseded this one
        setResults((prev) => (isFirstPage ? data.results : [...prev, ...data.results]))
        setNextOffset(data.nextOffset)
        if (data.debug) {
          console.log(
            `[food search] "${q}": ${data.debug.usableCount} usable of ${data.debug.rawHitCount} raw hits this page ` +
              `(Open Food Facts reports ${data.debug.offTotalCount} total matches for this query)`
          )
        }
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        if (isFirstPage) {
          setResults([])
          setNextOffset(null)
        }
        setError(true)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoadingMore(false)
          setSearching(false)
        }
      })
  }, [])

  useEffect(() => {
    if (query.trim().length === 0) {
      // Invalidate any in-flight request so a stale response can't repopulate
      // `results` after the user clears the box. `visibleResults` below
      // already hides `results` while the query is empty, so there's no
      // need to also clear that state here. Not resetting `searching` here
      // is deliberate too - the skeleton's render condition below also
      // requires query.trim().length > 0, so a stale `searching=true` from
      // right before the box was cleared has no visible effect; avoids a
      // setState-in-effect on every keystroke down to empty.
      requestIdRef.current++
      return
    }

    const timeout = setTimeout(() => {
      setSearching(true)
      runSearch(query.trim(), 0)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, runSearch])

  useEffect(() => {
    if (query) sessionStorage.setItem(STORAGE_KEY, query)
    else sessionStorage.removeItem(STORAGE_KEY)
  }, [query])

  const visibleResults = query.trim().length === 0 ? [] : results

  function loadMore() {
    if (nextOffset !== null) runSearch(query.trim(), nextOffset)
  }

  if (showCreate) {
    return <NewFoodForm initialName={query} context={context} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-4 bg-bg px-4 pt-16 pb-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3.5">
          <Link href={backHref} className="font-mono text-lg text-text-muted">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-text">Search foods</h1>
        </div>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods..."
          autoFocus
          className={query ? "border-[1.5px] border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]" : ""}
        />
      </div>

      {error && query.trim().length > 0 && (
        <p className="font-mono text-xs text-warning">
          Search failed — check your connection and try again.
        </p>
      )}

      {searching && query.trim().length > 0 ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <li
              key={i}
              className="animate-fade-in-up flex items-center gap-3 rounded-card border border-hairline bg-card px-3 py-2.5 shadow-card"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-[65%]" />
                <Skeleton className="mt-1.5 h-3 w-[35%]" />
              </div>
              <div className="shrink-0">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="mt-1.5 h-2.5 w-6" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleResults.map((food) => (
            <li key={food.id}>
              <Link
                href={`/log?foodId=${food.id}${contextQuery(context)}`}
                className="flex items-center gap-3 rounded-card border border-hairline bg-card px-3 py-2.5 shadow-card transition-colors hover:bg-card-alt"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {food.name}
                  </p>
                  {food.brand && (
                    <p className="truncate text-xs text-text-muted">
                      {food.brand}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm text-text">
                    {Math.round(food.caloriesPer100g)}
                  </p>
                  <p className="font-mono text-[9px] text-text-faint">
                    {sourceLabel[food.source]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nextOffset !== null && query.trim().length > 0 && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className={`${buttonClass("secondary")} disabled:opacity-50`}
        >
          {loadingMore ? "Loading…" : "See more results"}
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className={`${buttonClass("secondary")} justify-start`}
      >
        + Create custom food{query && ` "${query}"`}
      </button>
    </div>
  )
}
