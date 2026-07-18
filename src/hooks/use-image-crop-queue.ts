'use client'

import { useCallback, useRef } from 'react'

export type ImageCropQueueItem = {
  itemId: string
  itemUrl: string
}

/**
 * Cola FIFO para abrir el editor de recorte automaticamente, una foto a la
 * vez, cuando se agregan varias imagenes juntas (seleccion multiple, drag&drop
 * de varios archivos, etc). No usa useState: la cola en si no necesita
 * disparar renders, solo ordenar que foto sigue. Quien la usa decide cuando
 * abrir el siguiente item (con peekNext) en el mismo punto donde encola o
 * desencola, en vez de "observarla" reactivamente desde un efecto.
 *
 * dequeue solo saca el item si su id coincide con la cabeza actual, asi es
 * seguro llamarlo tanto al cerrar un recorte que vino de la cola como uno
 * abierto manualmente (lapiz) sobre una foto que no esta en la cola.
 */
export function useImageCropQueue() {
  const queueRef = useRef<ImageCropQueueItem[]>([])

  const enqueue = useCallback((items: ImageCropQueueItem[]) => {
    if (items.length === 0) {
      return
    }

    queueRef.current = [...queueRef.current, ...items]
  }, [])

  const dequeue = useCallback((itemId: string) => {
    if (queueRef.current[0]?.itemId === itemId) {
      queueRef.current = queueRef.current.slice(1)
    }
  }, [])

  const peekNext = useCallback((): ImageCropQueueItem | null => queueRef.current[0] ?? null, [])

  const clear = useCallback(() => {
    queueRef.current = []
  }, [])

  return {
    enqueue,
    dequeue,
    peekNext,
    clear,
  }
}
