"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Camera } from "lucide-react"

// Bottom tab bar — see design_handoff_macrograin/Macrograin.dc.html
// (repeated on every app screen): Home / Log / center Scan FAB / Weight / More.
// 96px tall, gradient fade-in background, active tab in lime.

const tabs = [
  { href: "/", label: "HOME", isFab: false },
  { href: "/timeline", label: "LOG", isFab: false },
  { href: "/scan", label: "", isFab: true },
  { href: "/weight", label: "WEIGHT", isFab: false },
  { href: "/settings", label: "MORE", isFab: false },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full items-center justify-around px-5 pb-2 sm:max-w-xl"
      style={{
        height: 84,
        background: "linear-gradient(0deg, var(--color-bg) 82%, transparent)",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.isFab ? false : pathname === tab.href
        if (tab.isFab) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              aria-label="Scan"
              className="-mt-1.5 flex size-11 items-center justify-center rounded-full bg-accent shadow-[0_0_22px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
            >
              <Camera size={20} className="text-bg" strokeWidth={2.25} />
            </Link>
          )
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className="flex flex-col items-center gap-1.5 transition-transform duration-150 active:scale-90"
          >
            <TabIcon label={tab.label} active={active} />
            <span
              className={`font-mono text-[9px] transition-colors duration-150 ${active ? "text-accent" : "text-text-faint"}`}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function TabIcon({ label, active }: { label: string; active: boolean }) {
  const color = active ? "var(--color-accent)" : "var(--color-text-faint)"

  if (label === "HOME") {
    return (
      <span
        className="size-[18px] rounded-[5px] transition-[border-color] duration-150"
        style={{ border: `1.5px solid ${color}` }}
      />
    )
  }
  if (label === "LOG") {
    return (
      <span className="flex w-[18px] flex-col gap-[3px]">
        <i className="h-[1.5px] transition-colors duration-150" style={{ background: color }} />
        <i className="h-[1.5px] transition-colors duration-150" style={{ background: color }} />
        <i className="h-[1.5px] transition-colors duration-150" style={{ background: color }} />
      </span>
    )
  }
  if (label === "WEIGHT") {
    return (
      <span
        className="relative h-3 w-[18px] transition-[border-color] duration-150"
        style={{ borderBottom: `1.5px solid ${color}` }}
      >
        <i
          className="absolute bottom-0 left-0 h-2 w-full origin-left transition-[border-color] duration-150"
          style={{ borderTop: `1.5px solid ${color}`, transform: "skewY(-18deg)" }}
        />
      </span>
    )
  }
  return (
    <span
      className="text-base leading-[0.6] tracking-[1px] transition-colors duration-150"
      style={{ color }}
    >
      •••
    </span>
  )
}
