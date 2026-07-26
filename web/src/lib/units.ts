import type { unitSystem } from "@/db/schema"

export type UnitSystem = (typeof unitSystem)[number]

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = cmToIn(cm)
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn - ft * 12)
  if (inches === 12) return { ft: ft + 1, in: 0 }
  return { ft, in: inches }
}

export function ftInToCm(ft: number, inches: number): number {
  return inToCm(ft * 12 + inches)
}

export function displayWeight(weightKg: number, system: UnitSystem): { value: number; unit: string } {
  if (system === "imperial") {
    return { value: Math.round(kgToLb(weightKg) * 10) / 10, unit: "lb" }
  }
  return { value: Math.round(weightKg * 10) / 10, unit: "kg" }
}

export function formatWeight(weightKg: number, system: UnitSystem): string {
  const { value, unit } = displayWeight(weightKg, system)
  return `${value} ${unit}`
}

export function parseWeightToKg(inputValue: number, system: UnitSystem): number {
  return system === "imperial" ? lbToKg(inputValue) : inputValue
}

export function formatHeight(heightCm: number, system: UnitSystem): string {
  if (system === "imperial") {
    const { ft, in: inches } = cmToFtIn(heightCm)
    return `${ft}'${inches}"`
  }
  return `${heightCm} cm`
}
