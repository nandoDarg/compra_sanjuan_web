'use client'

import { useCallback, useRef, useState } from 'react'
import { Cropper, type CropperRef } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'

export type ImageCropCoordinates = {
  left: number
  top: number
  width: number
  height: number
}

type AspectMode = 'free' | 'square' | 'original'

type ImageCropModalProps = {
  imageUrl: string
  onApply: (coordinates: ImageCropCoordinates) => void
  onCancel: () => void
  applying: boolean
}

const ASPECT_OPTIONS: Array<{ mode: AspectMode; label: string }> = [
  { mode: 'free', label: 'Libre' },
  { mode: 'square', label: '1:1' },
  { mode: 'original', label: 'Original' },
]

const DOUBLE_TAP_MAX_INTERVAL_MS = 300
const DOUBLE_TAP_MAX_DISTANCE_PX = 12

export default function ImageCropModal({ imageUrl, onApply, onCancel, applying }: ImageCropModalProps) {
  const cropperRef = useRef<CropperRef>(null)
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const [aspectMode, setAspectMode] = useState<AspectMode>('free')
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null)

  const aspectRatio =
    aspectMode === 'square' ? 1 : aspectMode === 'original' ? naturalAspect ?? undefined : undefined

  const handleReady = useCallback((cropper: CropperRef) => {
    const image = cropper.getImage()
    if (image && image.width > 0 && image.height > 0) {
      setNaturalAspect(image.width / image.height)
    }
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now()
    const last = lastTapRef.current

    if (
      last &&
      now - last.time < DOUBLE_TAP_MAX_INTERVAL_MS &&
      Math.abs(event.clientX - last.x) < DOUBLE_TAP_MAX_DISTANCE_PX &&
      Math.abs(event.clientY - last.y) < DOUBLE_TAP_MAX_DISTANCE_PX
    ) {
      cropperRef.current?.reset()
      lastTapRef.current = null
      return
    }

    lastTapRef.current = { time: now, x: event.clientX, y: event.clientY }
  }, [])

  const handleApply = () => {
    const coordinates = cropperRef.current?.getCoordinates({ round: true })
    if (coordinates) {
      onApply(coordinates)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-(--line) bg-(--background-elevated) p-4 sm:p-5">
        <p className="text-base font-semibold text-foreground">Recortar y reencuadrar imagen</p>
        <p className="mt-1 text-xs text-(--foreground-muted)">
          Arrastra los bordes o las esquinas para ajustar el recorte, deslizá para mover la foto y usá dos dedos para
          hacer zoom. Doble toque para restablecer.
        </p>

        <div className="mt-3 flex gap-2">
          {ASPECT_OPTIONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAspectMode(mode)}
              disabled={mode === 'original' && naturalAspect === null}
              className={`thsj-btn px-3 py-1.5 text-xs disabled:opacity-50 ${
                aspectMode === mode ? 'thsj-btn-primary' : 'thsj-btn-ghost'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl bg-black"
          onPointerUp={handlePointerUp}
        >
          <Cropper
            ref={cropperRef}
            src={imageUrl}
            className="h-full w-full"
            stencilProps={{ aspectRatio }}
            onReady={handleReady}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="thsj-btn thsj-btn-ghost" onClick={onCancel} disabled={applying}>
            Cancelar
          </button>
          <button type="button" className="thsj-btn thsj-btn-primary" onClick={handleApply} disabled={applying}>
            {applying ? 'Aplicando...' : 'Aplicar recorte'}
          </button>
        </div>
      </div>
    </div>
  )
}
