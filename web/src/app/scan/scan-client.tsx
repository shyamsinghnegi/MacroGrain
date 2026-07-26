"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { X, Zap, Camera, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/skeleton"

type ScanState = "idle" | "searching" | "found" | "not_found" | "camera_error"
type ScanMode = "barcode" | "ai_photo"

export function ScanClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ScanMode>("barcode")
  const [state, setState] = useState<ScanState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [capturingKind, setCapturingKind] = useState<"photo" | "label" | null>(null)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [tapFocusSupported, setTapFocusSupported] = useState(false)
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; key: number } | null>(null)
  const focusRingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const galleryKindRef = useRef<"photo" | "label">("photo")

  function tuneVideoTrack(stream: MediaStream) {
    const track = stream.getVideoTracks()[0]
    if (!track) return

    const capabilities = track.getCapabilities?.() as
      | (MediaTrackCapabilities & {
          focusMode?: string[]
          torch?: boolean
          pointsOfInterest?: unknown
        })
      | undefined

    if (capabilities?.focusMode?.includes("continuous")) {
      track
        .applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
        .catch(() => {})
    }

    setTorchSupported(Boolean(capabilities?.torch))
    const hasFocusPointMode =
      capabilities?.focusMode?.includes("single-shot") || capabilities?.focusMode?.includes("manual")
    setTapFocusSupported(Boolean(capabilities?.pointsOfInterest && hasFocusPointMode))
  }

  useEffect(() => {
    let cancelled = false

    async function startBarcode() {
      const reader = new BrowserMultiFormatReader()
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

        if (!videoRef.current) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        tuneVideoTrack(stream)

        const controls = await reader.decodeFromStream(
          stream,
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

    async function startPhoto() {
      setState("searching")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        tuneVideoTrack(stream)
        setState("idle")
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

    if (mode === "barcode") {
      startBarcode()
    } else {
      startPhoto()
    }

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setTorchSupported(false)
      setTorchOn(false)
      setTapFocusSupported(false)
      if (focusRingTimeoutRef.current) clearTimeout(focusRingTimeoutRef.current)
    }
  }, [router, mode])

  async function toggleTorch() {
    const stream = videoRef.current?.srcObject as MediaStream | null
    const track = stream?.getVideoTracks()[0]
    if (!track) return

    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch {
      // some devices report torch support but reject applying it
    }
  }

  async function tapToFocus(e: React.PointerEvent<HTMLVideoElement>) {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream | null
    const track = stream?.getVideoTracks()[0]
    if (!video || !track || !tapFocusSupported) return

    const rect = video.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setFocusRing({ x, y, key: Date.now() })
    if (focusRingTimeoutRef.current) clearTimeout(focusRingTimeoutRef.current)
    focusRingTimeoutRef.current = setTimeout(() => setFocusRing(null), 700)

    const capabilities = track.getCapabilities?.() as
      | (MediaTrackCapabilities & { focusMode?: string[] })
      | undefined
    const focusMode = capabilities?.focusMode?.includes("single-shot") ? "single-shot" : "manual"

    try {
      await track.applyConstraints({
        advanced: [
          {
            focusMode,
            pointsOfInterest: [{ x, y }],
          } as MediaTrackConstraintSet,
        ],
      })
    } catch {
      // ignore, same rationale as toggleTorch
    }
  }

  function clearCapturingOverlay() {
    setCapturing(false)
    setCapturingKind(null)
    setCapturedPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  async function analyzePhoto(kind: "photo" | "label", blob: Blob) {
    setCapturing(true)
    setCapturingKind(kind)
    const previewUrl = URL.createObjectURL(blob)
    setCapturedPreview(previewUrl)
    try {
      const formData = new FormData()
      formData.set("photo", blob, "capture.jpg")

      const endpoint = kind === "photo" ? "/api/scan/photo" : "/api/scan/label"
      const res = await fetch(endpoint, { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setState("camera_error")
        setErrorMessage(data?.message ?? "Could not analyze photo. Try again.")
        clearCapturingOverlay()
        return
      }

      controlsRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())

      sessionStorage.setItem(
        kind === "photo" ? "mg_ai_photo_result" : "mg_ai_label_result",
        JSON.stringify(data)
      )
      URL.revokeObjectURL(previewUrl)
      router.push(kind === "photo" ? "/scan/photo-confirm" : "/scan/label-confirm")
    } catch (e) {
      setState("camera_error")
      setErrorMessage(e instanceof Error ? e.message : "Could not analyze photo.")
      clearCapturingOverlay()
    }
  }

  async function capturePhoto(kind: "photo" | "label") {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || capturing) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setState("camera_error")
      setErrorMessage("Canvas not supported")
      return
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    )
    if (!blob) {
      setState("camera_error")
      setErrorMessage("Could not capture photo.")
      return
    }

    analyzePhoto(kind, blob)
  }

  function pickFromGallery(kind: "photo" | "label") {
    galleryKindRef.current = kind
    fileInputRef.current?.click()
  }

  function onGalleryFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file later
    if (!file || capturing) return
    analyzePhoto(galleryKindRef.current, file)
  }

  return (
    <div className="fixed inset-0 z-40 bg-bg-deep">
      <video
        ref={videoRef}
        onPointerDown={tapToFocus}
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onGalleryFileChosen}
        className="hidden"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent,rgba(0,0,0,.7))]" />

      {focusRing && (
        <span
          key={focusRing.key}
          className="animate-scale-in pointer-events-none absolute z-20 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
          style={{ left: `${focusRing.x * 100}%`, top: `${focusRing.y * 100}%` }}
        />
      )}

      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-6 pt-16">
        <Link
          href="/"
          className="flex size-9 items-center justify-center rounded-full bg-black/50 text-text backdrop-blur-md"
          aria-label="Close"
        >
          <X size={18} />
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-black/50 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMode("barcode")}
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors ${
              mode === "barcode" ? "bg-accent text-bg" : "text-text-muted"
            }`}
          >
            Barcode
          </button>
          <button
            type="button"
            onClick={() => setMode("ai_photo")}
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors ${
              mode === "ai_photo" ? "bg-accent text-bg" : "text-text-muted"
            }`}
          >
            AI Photo
          </button>
        </div>
        {torchSupported ? (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Turn off flash" : "Turn on flash"}
            aria-pressed={torchOn}
            className={`flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
              torchOn ? "bg-accent text-bg" : "bg-black/50 text-text"
            }`}
          >
            <Zap size={15} />
          </button>
        ) : (
          <span className="size-9" />
        )}
      </div>

      {mode === "barcode" && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[180px] w-[260px] -translate-x-1/2 -translate-y-1/2">
          <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-md border-t-[3px] border-l-[3px] border-accent" />
          <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-md border-t-[3px] border-r-[3px] border-accent" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-md border-b-[3px] border-l-[3px] border-accent" />
          <span className="absolute right-0 bottom-0 h-8 w-8 rounded-br-md border-r-[3px] border-b-[3px] border-accent" />
          {state === "searching" && (
            <span className="absolute top-1/2 right-3.5 left-3.5 h-0.5 animate-pulse bg-accent shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_80%,transparent)]" />
          )}
        </div>
      )}

      <div className="absolute right-0 bottom-14 left-0 z-20 flex flex-col items-center gap-4 px-8">
        {state === "camera_error" ? (
          <div className="rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-center">
            <p className="text-sm text-warning">{errorMessage}</p>
          </div>
        ) : mode === "barcode" ? (
          <>
            <div className="flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              SEARCHING · align barcode in frame
            </div>
            <span className="font-mono text-[11px] text-text-faint">
              detect → read → confirm
            </span>
          </>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                disabled={capturing}
                onClick={() => capturePhoto("photo")}
                className="flex items-center gap-2 rounded-pill bg-accent px-5 py-3 text-sm font-bold text-bg shadow-accent-glow disabled:opacity-60"
              >
                <Camera size={16} />
                {capturing ? "Analyzing…" : "Snap meal"}
              </button>
              <button
                type="button"
                disabled={capturing}
                onClick={() => capturePhoto("label")}
                className="flex items-center gap-2 rounded-pill border-[1.5px] border-white/25 px-5 py-3 text-sm font-medium text-text disabled:opacity-60"
              >
                Read label
              </button>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                disabled={capturing}
                onClick={() => pickFromGallery("photo")}
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted disabled:opacity-60"
              >
                <ImageIcon size={13} />
                Meal from gallery
              </button>
              <button
                type="button"
                disabled={capturing}
                onClick={() => pickFromGallery("label")}
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted disabled:opacity-60"
              >
                <ImageIcon size={13} />
                Label from gallery
              </button>
            </div>
            <span className="font-mono text-[11px] text-text-faint">
              AI estimates nutrition · always double-check before saving
            </span>
          </>
        )}
      </div>

      {capturing && (
        <div className="absolute inset-0 z-30 flex flex-col bg-bg-deep">
          {capturedPreview && (
            <img
              src={capturedPreview}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-bg-deep/60" />
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-8">
            <div className="flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              {capturingKind === "label" ? "READING LABEL…" : "ANALYZING MEAL…"}
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
      )}
    </div>
  )
}
