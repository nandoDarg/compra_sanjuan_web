'use client'

import { useEffect, useRef, useState } from 'react'

type CameraModalProps = {
  onCapture: (file: File) => void
  onClose: () => void
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo acceder a la cámara. Verificá los permisos en tu navegador.')
        }
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || !ready) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        onClose()
      },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <p className="text-sm leading-relaxed text-white/70">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-xl border border-white/25 px-6 py-2.5 text-sm font-medium text-white"
          >
            Volver
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setReady(true)}
              className="h-full w-full object-cover"
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-black px-10 py-8">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[4rem] text-sm font-medium text-white/70 active:text-white"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleCapture}
              disabled={!ready}
              aria-label="Tomar foto"
              className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white shadow-lg transition disabled:opacity-40 active:scale-95"
            >
              <div className="h-[3.2rem] w-[3.2rem] rounded-full bg-white" />
            </button>

            <div className="min-w-[4rem]" />
          </div>
        </>
      )}
    </div>
  )
}
