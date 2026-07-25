import { Button } from "./button"
import { DitherBg } from "./dither-bg"

// Onboarding — see design_handoff_macrograin/Macrograin.dc.html screen 01.
// Dithered lime-tinted texture fading from the top, "macro engine · online"
// status line, big Doto MACRO/GRAIN wordmark (GRAIN in lime), tagline,
// Create account (light pill) + Log in (outlined) + legal mono line.

export function Onboarding({
  createAccount,
  logIn,
}: {
  createAccount: () => Promise<void>
  logIn: () => Promise<void>
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg">
      <DitherBg height={540} fadeAt={35} />

      <div className="relative z-10 flex flex-1 flex-col px-7 pt-20 pb-8">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          macro engine · online
        </div>

        <div className="mt-12">
          <div className="font-doto text-[56px] leading-[0.9] font-black tracking-tight text-text sm:text-[66px]">
            MACRO
          </div>
          <div className="font-doto text-[56px] leading-[0.9] font-black tracking-tight text-accent sm:text-[66px]">
            GRAIN
          </div>
        </div>

        <p className="mt-6 max-w-[280px] text-base leading-relaxed text-text-muted">
          Track calories and macros with barcode scanning and AI photo
          recognition. Tuned for Indian foods.
        </p>

        <div className="flex-1" />

        <div className="flex flex-col gap-3">
          <form action={createAccount}>
            <Button type="submit" className="w-full py-4.5 text-base">
              Create account
            </Button>
          </form>
          <form action={logIn}>
            <button
              type="submit"
              className="w-full rounded-pill border-[1.5px] border-hairline py-4 text-base font-semibold text-text"
            >
              Log in
            </button>
          </form>
          <p className="mt-2 text-center font-mono text-[11px] text-text-faint">
            by continuing you accept the terms
          </p>
        </div>
      </div>
    </div>
  )
}
