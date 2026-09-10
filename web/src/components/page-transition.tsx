"use client"

import { useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"

// Directional "new page slides in from the right" transition on every route
// change. Deliberately animates only the incoming page (not a simultaneous
// old-slides-out-while-new-slides-in swap) - that would require keeping the
// outgoing page's server-rendered DOM alive during the transition, which is
// a lot more fragile against Next's per-navigation data fetching. This is
// the simpler, robust version: whenever the pathname changes, the container
// (which now holds the new page's already-rendered content) fades/slides in.
//
// No `key={pathname}` here deliberately - that would force React to
// unmount/remount the whole subtree on every navigation, throwing away
// Next's own reconciliation between pages that share layout and causing an
// extra flash. The animation only needs the DOM node to already contain the
// new content when the effect fires, which it does since this runs after
// the pathname (and therefore `children`) has already updated.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const previousPathname = useRef(pathname)

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    const el = containerRef.current
    if (!el) return

    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, x: 28 },
        { autoAlpha: 1, x: 0, duration: 0.32, ease: "power3.out" }
      )
    })

    return () => mm.revert()
  }, [pathname])

  return <div ref={containerRef}>{children}</div>
}
