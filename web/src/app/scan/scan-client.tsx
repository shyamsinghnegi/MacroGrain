"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { X, Zap, Camera, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

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
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [tapFocusSupported, setTapFocusSupported] = useState(false)
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; key: number } | null>(null)
  const focusRingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // "label" when gallery-picking for label OCR, "photo" for meal recognition -
  // remembered so the hidden file input's onChange (fired after the OS
  // picker closes) knows which endpoint to send the chosen image to.
  const galleryKindRef = useRef<"photo" | "label">("photo")

  // Neither zxing's decodeFromVideoDevice nor the plain getUserMedia call
  // below request any focus behavior - getUserMedia() constraints default
  // to whatever the camera's own firmware picks, which on many devices is
  // NOT continuous autofocus, producing the "stays blurry, never refocuses"
  // symptom. `focusMode`/`torch` are non-standard "advanced" capabilities
  // (part of the Image Capture API draft, not core MediaTrackConstraints),
  // so this is entirely feature-detected: getCapabilities() lists what a
  // given camera/browser actually supports before attempting to apply it -
  // most desktop webcams and iOS Safari support neither at all.
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
    // Tap-to-focus needs both a way to say "focus here" (pointsOfInterest)
    // and a focus mode that will actually act on a single point rather than
    // continuously re-deciding on its own - "single-shot" is the standard
    // one-time-focus-then-lock mode real camera apps use for tap-to-focus.
    // "manual" is accepted too since some Android implementations only
    // expose that name for the same behavior.
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

        // zxing's own decodeFromVideoDevice(deviceId, ...) only ever sends
        // { deviceId: { exact } } to getUserMedia (confirmed in its source)
        // - no resolution or focus constraints, same low-res-default bug
        // AI Photo mode had before its fix. Building the stream ourselves
        // and handing it to zxing's lower-level decodeFromStream() instead
        // gets barcode mode the exact same fix, plus makes
        // tuneVideoTrack's continuous-autofocus/torch/tap-to-focus support
        // apply here too instead of only in AI Photo mode.
        //
        // Uses facingMode (not deviceId: exact) for the same reason AI
        // Photo mode does - pairing an exact deviceId constraint with
        // width/height ideals caused several Android Chrome builds to
        // silently ignore the resolution ideal and fall back to a low
        // default (confirmed: this is what stayed blurry after the first
        // fix, on a device where AI Photo's facingMode-only stream came
        // out sharp). `devices`/`rearCamera` above is now only used to
        // confirm a camera actually exists, not to pin a specific one -
        // facingMode: environment already selects the rear camera on
        // virtually every phone without needing its literal deviceId.
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
        // No resolution was requested before, so the browser picked its own
        // default - on mobile Chrome/Safari that's often ~640x480, nowhere
        // near enough detail to read small nutrition-label print even with
        // perfect focus. `ideal` (not `exact`) asks for the camera's best
        // available up to 4K without hard-failing on devices that can't
        // reach it - getUserMedia negotiates down automatically.
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

  // Reads the live stream directly off the video element rather than
  // streamRef, since streamRef is only populated in AI Photo mode -
  // zxing owns the barcode-mode stream internally, but always assigns it
  // to videoRef.current.srcObject regardless (see tuneVideoTrack's comment).
  async function toggleTorch() {
    const stream = videoRef.current?.srcObject as MediaStream | null
    const track = stream?.getVideoTracks()[0]
    if (!track) return

    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch {
      // Some devices report torch: true in getCapabilities() but still
      // reject applying it (confirmed as a real inconsistency across
      // Android camera implementations) - fail silently rather than
      // showing an error for a non-essential feature.
    }
  }

  // Standard tap-to-focus, matching what a native camera app does: tap a
  // point on the preview, the camera focuses there once. Continuous
  // autofocus (tuneVideoTrack) doesn't always recover well on close-up,
  // low-contrast subjects like a nutrition label - a phone's own camera app
  // solves the exact same problem with the exact same gesture, so this
  // mirrors that rather than inventing new UI.
  async function tapToFocus(e: React.PointerEvent<HTMLVideoElement>) {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream | null
    const track = stream?.getVideoTracks()[0]
    if (!video || !track || !tapFocusSupported) return

    const rect = video.getBoundingClientRect()
    // Normalized 0-1 coordinates, as pointsOfInterest requires - not raw
    // pixels. video.getBoundingClientRect() is the rendered/displayed size
    // (the video is CSS object-cover'd to fill the screen), which is the
    // correct basis here since that's what the user is actually looking at
    // and tapping, not the camera's native capture resolution.
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
      // Same rationale as toggleTorch - getCapabilities() reporting support
      // doesn't guarantee applyConstraints() succeeds on every device.
    }
  }

  async function analyzePhoto(kind: "photo" | "label", blob: Blob) {
    setCapturing(true)
    try {
      const formData = new FormData()
      formData.set("photo", blob, "capture.jpg")

      const endpoint = kind === "photo" ? "/api/scan/photo" : "/api/scan/label"
      const res = await fetch(endpoint, { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setState("camera_error")
        setErrorMessage(data?.message ?? "Could not analyze photo. Try again.")
        setCapturing(false)
        return
      }

      controlsRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())

      sessionStorage.setItem(
        kind === "photo" ? "mg_ai_photo_result" : "mg_ai_label_result",
        JSON.stringify(data)
      )
      router.push(kind === "photo" ? "/scan/photo-confirm" : "/scan/label-confirm")
    } catch (e) {
      setState("camera_error")
      setErrorMessage(e instanceof Error ? e.message : "Could not analyze photo.")
      setCapturing(false)
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
          // Reserves the same layout space so Barcode/AI Photo toggle stays
          // centered - most devices (all of iOS, many Android cameras/
          // browsers) don't expose torch control at all, confirmed via
          // getCapabilities() rather than assumed, so the button is hidden
          // entirely rather than shown non-functional.
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
    </div>
  )
}
