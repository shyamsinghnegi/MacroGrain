"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { NewFoodForm } from "./new-food-form"
import { Input } from "@/components/input"
import { buttonClass } from "@/components/button"

type Food = {
  id: string
  name: string
  brand: string | null
  caloriesPer100g: number
}

export function FoodSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Food[]>([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      return
    }

    const timeout = setTimeout(() => {
      fetch(`/api/foods/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then(setResults)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  if (showCreate) {
    return <NewFoodForm initialName={query} />
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search foods..."
        autoFocus
      />

      <ul className="flex flex-col gap-2">
        {results.map((food) => (
          <li key={food.id}>
            <Link
              href={`/log?foodId=${food.id}`}
              className="flex items-center justify-between rounded-card border border-hairline bg-card px-3 py-2.5 shadow-card transition-colors hover:bg-card-alt"
            >
              <span className="text-sm text-text">
                {food.name}
                {food.brand && (
                  <span className="text-text-muted"> · {food.brand}</span>
                )}
              </span>
              <span className="font-mono text-xs text-text-muted">
                {Math.round(food.caloriesPer100g)} kcal/100g
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className={`${buttonClass("secondary")} justify-start`}
      >
        Create custom food{query && ` "${query}"`}
      </button>
    </div>
  )
}
