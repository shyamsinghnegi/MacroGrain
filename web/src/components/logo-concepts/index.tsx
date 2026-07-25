import type { SVGProps } from "react"

// Four hand-built logo concept marks, explored from Nano Banana's initial
// generated inspiration images (wheat-stalk / grain motifs merged with a
// data-HUD circuit-and-gauge language, matching the app's instrument-panel
// aesthetic). All strokes/fills use currentColor, so wrapping one in a
// className like "text-accent" makes it follow the active theme's accent
// color live - same mechanism already used for icons elsewhere in the app.

export function Logo1BarStalk(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g stroke="currentColor" strokeWidth={8} strokeLinecap="round">
        <line x1={55} y1={150} x2={55} y2={120} />
        <line x1={75} y1={150} x2={75} y2={95} />
        <line x1={95} y1={150} x2={95} y2={70} />
        <line x1={115} y1={150} x2={115} y2={45} />
      </g>
      <line x1={45} y1={160} x2={140} y2={45} stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
      <circle cx={145} cy={40} r={10} fill="currentColor" />
    </svg>
  )
}

export function Logo2ReticleSeed(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Ring built as 4 explicit 62-degree arcs (not one dashed circle) so a
          14-degree gap is guaranteed at each tick (0/90/180/270deg) - a
          uniform stroke-dasharray's phase doesn't divide evenly into 4 and
          can drift a dash onto a tick, fusing them visually. Coordinates
          computed directly for cx=100 cy=100 r=70, not eyeballed. */}
      <g stroke="currentColor" strokeWidth={6} fill="none" strokeLinecap="round">
        <path d="M 116.93 32.08 A 70 70 0 0 1 167.92 83.07" />
        <path d="M 167.92 116.93 A 70 70 0 0 1 116.93 167.92" />
        <path d="M 83.07 167.92 A 70 70 0 0 1 32.08 116.93" />
        <path d="M 32.08 83.07 A 70 70 0 0 1 83.07 32.08" />
      </g>
      <g stroke="currentColor" strokeWidth={6} strokeLinecap="round">
        <line x1={100} y1={16} x2={100} y2={30} />
        <line x1={100} y1={170} x2={100} y2={184} />
        <line x1={16} y1={100} x2={30} y2={100} />
        <line x1={170} y1={100} x2={184} y2={100} />
      </g>
      <path
        d="M100 55 C122 75 130 100 100 145 C70 100 78 75 100 55 Z"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <line x1={100} y1={65} x2={100} y2={135} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

export function Logo3PercentDrop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M100 30 C122 55 130 78 100 100 C70 78 78 55 100 30 Z"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <line x1={100} y1={40} x2={100} y2={90} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      <path
        d="M50 130 A55 55 0 1 0 150 130"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={82} cy={128} r={7} stroke="currentColor" strokeWidth={5} />
      <circle cx={118} cy={152} r={7} stroke="currentColor" strokeWidth={5} />
      <line x1={122} y1={118} x2={78} y2={162} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
    </svg>
  )
}

export function Logo4HexGrain(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M100 15 L170 55 L170 145 L100 185 L30 145 L30 55 Z"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <line x1={100} y1={55} x2={100} y2={105} stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path d="M100 65 L80 45" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path d="M100 65 L120 45" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path d="M100 85 L75 65" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path d="M100 85 L125 65" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path
        d="M100 105 L100 125 L75 125 L75 150"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M100 105 L100 125 L125 125 L125 150"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={75} cy={150} r={5} fill="currentColor" />
      <circle cx={125} cy={150} r={5} fill="currentColor" />
    </svg>
  )
}
