"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { X, Zap } from "lucide-react"
import Link from "next/link"

type ScanState = "idle" | "searching" | "found" | "not_found" | "camera_error"

export function ScanClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [state, setState] = useState<ScanState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const reader = new BrowserMultiFormatReader()

    async function start() {
      setState("searching")
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (devices.length === 0) {
          if (!cancelled) {
            setState("camera_error")
            setErrorMessage("No camera found on this device.")
          }
          return
        }

        // Prefer a rear/environment-facing camera if labeled as such,
        // matching the design's assumption of scanning a product held
        // in front of the phone (not a selfie-facing camera).
        const rearCamera = devices.find((d) =>
          /back|rear|environment/i.test(d.label)
        )
        const deviceId = rearCamera?.deviceId ?? devices[0].deviceId

        if (!videoRef.current) return

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (cancelled) return
            if (result) {
              controlsRef.current?.stop()
              const barcode = result.getText()
              setState("found")
              router.push(`/scan/confirm?barcode=${encodeURIComponent(barcode)}`)
            }
            // NotFoundException fires continuously while no barcode is in
            // frame - that's expected during normal scanning, not an error.
          }
        )
        controlsRef.current = controls
      } catch (e) {
        if (!cancelled) {
          setState("camera_error")
          setErrorMessage(
            e instanceof Error
              ? e.message
              : "Could not access the camera. Check browser permissions."
          )
        }
      }
    }

    start()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
  }, [router])

  return (
    <div className="fixed inset-0 z-40 bg-bg-deep">
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent,rgba(0,0,0,.7))]" />

      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-6 pt-16">
        <Link
          href="/"
          className="flex size-9 items-center justify-center rounded-full bg-black/50 text-text backdrop-blur-md"
          aria-label="Close"
        >
          <X size={18} />
        </Link>
        <span className="flex size-9 items-center justify-center rounded-full bg-black/50 text-text">
          <Zap size={15} />
        </span>
      </div>

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[180px] w-[260px] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-md border-t-[3px] border-l-[3px] border-accent" />
        <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-md border-t-[3px] border-r-[3px] border-accent" />
        <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-md border-b-[3px] border-l-[3px] border-accent" />
        <span className="absolute right-0 bottom-0 h-8 w-8 rounded-br-md border-r-[3px] border-b-[3px] border-accent" />
        {state === "searching" && (
          <span className="absolute top-1/2 right-3.5 left-3.5 h-0.5 animate-pulse bg-accent shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_80%,transparent)]" />
        )}
      </div>

      <div className="absolute right-0 bottom-14 left-0 z-20 flex flex-col items-center gap-4 px-8">
        {state === "camera_error" ? (
          <div className="rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-center">
            <p className="text-sm text-warning">{errorMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              SEARCHING · align barcode in frame
            </div>
            <span className="font-mono text-[11px] text-text-faint">
              detect → read → confirm
            </span>
          </>
        )}
      </div>
    </div>
  )
}
