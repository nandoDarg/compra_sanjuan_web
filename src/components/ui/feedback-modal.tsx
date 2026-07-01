'use client'

import { useState } from 'react'

type FeedbackType = 'suggestion' | 'problem' | 'feature' | 'other'

type FeedbackModalProps = {
  isAuthenticated: boolean
  onClose: () => void
}

export default function FeedbackModal({ isAuthenticated, onClose }: FeedbackModalProps) {
  const [anonimo, setAnonimo] = useState(true)
  const [type, setType] = useState<FeedbackType>('suggestion')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: message.trim(), anonimo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Ocurrio un error inesperado.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexion e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="thsj-panel w-full max-w-md rounded-2xl p-6 shadow-[0_24px_48px_rgba(16,32,51,0.22)]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              ¿Cómo podemos mejorar Trato Hecho?
            </h2>
            <p className="mt-1 text-xs text-(--foreground-muted) leading-snug">
              Tu opinión nos ayuda a construir el mejor marketplace de San Juan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-(--foreground-muted) hover:bg-(--background-muted) transition"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="text-4xl">💡</span>
            <p className="text-sm font-medium text-foreground">
              ¡Gracias por tu sugerencia! Tu opinión nos ayuda a seguir mejorando Trato Hecho.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="thsj-btn thsj-btn-primary w-full"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Tipo de envio */}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-(--foreground-muted) uppercase tracking-wide">
                Tipo de envío
              </legend>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="anonimo"
                    checked={anonimo}
                    onChange={() => setAnonimo(true)}
                    className="accent-(--brand-primary)"
                  />
                  <span className="text-sm text-foreground">Enviar anónimamente</span>
                </label>
                <label className={['flex items-center gap-2.5', !isAuthenticated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'].join(' ')}>
                  <input
                    type="radio"
                    name="anonimo"
                    checked={!anonimo}
                    onChange={() => setAnonimo(false)}
                    disabled={!isAuthenticated}
                    className="accent-(--brand-primary)"
                  />
                  <span className="text-sm text-foreground">
                    Enviar con mi usuario
                    {!isAuthenticated ? (
                      <span className="ml-1 text-xs text-(--foreground-muted)">(requiere sesión)</span>
                    ) : null}
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Tipo de mensaje */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--foreground-muted) uppercase tracking-wide">
                Tipo de mensaje
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="thsj-input w-full appearance-none py-2.5 pl-3 pr-8 text-sm"
                >
                  <option value="suggestion">Sugerencia</option>
                  <option value="problem">Reportar un problema</option>
                  <option value="feature">Solicitar una función</option>
                  <option value="other">Otro</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--foreground-muted) text-xs">▾</span>
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--foreground-muted) uppercase tracking-wide">
                Mensaje <span className="text-(--danger)">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                placeholder="Contanos qué mejorarías, qué problema encontraste o qué función te gustaría ver."
                className="thsj-input w-full resize-none py-2.5 pl-3 pr-3 text-sm"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-(--danger)">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="thsj-btn thsj-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar sugerencia'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
