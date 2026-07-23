"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// Bottom tab bar — see design_handoff_macrograin/Macrograin.dc.html
// (repeated on every app screen): Home / Log / center Scan FAB / Weight / More.
// 96px tall, gradient fade-in background, active tab in lime.

const tabs = [
  { href: "/", label: "HOME", isFab: false },
  { href: "/log", label: "LOG", isFab: false },
  { href: "/scan", label: "", isFab: true },
  { href: "/weight", label: "WEIGHT", isFab: false },
  { href: "/settings", label: "MORE", isFab: false },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-start justify-around px-5 pt-3.5"
      style={{
        height: 96,
        background: "linear-gradient(0deg, var(--color-bg) 62%, transparent)",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.isFab ? false : pathname === tab.href
        if (tab.isFab) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label="Scan"
              className="-mt-1.5 flex size-11 items-center justify-center rounded-full bg-accent shadow-[0_0_22px_rgba(198,240,77,.4)]"
            >
              <span className="size-4 rounded-[4px] border-2 border-bg" />
            </Link>
          )
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1.5"
          >
            <TabIcon label={tab.label} active={active} />
            <span
              className={`font-mono text-[9px] ${active ? "text-accent" : "text-text-faint"}`}
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
  const color = active ? "var(--color-accent)" : "#666"

  if (label === "HOME") {
    return (
      <span
        className="size-[18px] rounded-[5px]"
        style={{ border: `1.5px solid ${color}` }}
      />
    )
  }
  if (label === "LOG") {
    return (
      <span className="flex w-[18px] flex-col gap-[3px]">
        <i className="h-[1.5px]" style={{ background: color }} />
        <i className="h-[1.5px]" style={{ background: color }} />
        <i className="h-[1.5px]" style={{ background: color }} />
      </span>
    )
  }
  if (label === "WEIGHT") {
    return (
      <span
        className="relative h-3 w-[18px]"
        style={{ borderBottom: `1.5px solid ${color}` }}
      >
        <i
          className="absolute bottom-0 left-0 h-2 w-full origin-left"
          style={{ borderTop: `1.5px solid ${color}`, transform: "skewY(-18deg)" }}
        />
      </span>
    )
  }
  return (
    <span className="text-base leading-[0.6] tracking-[1px]" style={{ color }}>
      •••
    </span>
  )
}
