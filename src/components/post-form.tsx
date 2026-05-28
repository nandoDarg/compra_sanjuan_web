'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'

type PostFormValues = {
  title: string
  description: string
  price: string
  category: string
  whatsappNumber: string
}

export type PostFormSubmitData = {
  title: string
  description: string
  price: number
  category: string
  whatsappNumber: string
  imageFile: File | null
}

type PostFormProps = {
  mode: 'create' | 'edit'
  heading: string
  description: string
  submitLabel: string
  initialValues?: {
    title: string
    description: string
    price: number
    category: string
    whatsappNumber: string | null
    imageUrl: string | null
  }
  cancelHref?: string
  onSubmit: (data: PostFormSubmitData) => Promise<{ error?: string } | void>
}

const emptyValues: PostFormValues = {
  title: '',
  description: '',
  price: '',
  category: '',
  whatsappNumber: '',
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D+/g, '')
}

export default function PostForm({
  mode,
  heading,
  description,
  submitLabel,
  initialValues,
  cancelHref = '/',
  onSubmit,
}: PostFormProps) {
  const [form, setForm] = useState<PostFormValues>(() => {
    if (!initialValues) {
      return emptyValues
    }

    return {
      title: initialValues.title,
      description: initialValues.description,
      price: String(initialValues.price),
      category: initialValues.category,
      whatsappNumber: initialValues.whatsappNumber ?? '',
    }
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const currentImageUrl = useMemo(() => initialValues?.imageUrl ?? null, [initialValues])
  const needsImage = mode === 'create' && !imageFile

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    const parsedPrice = Number(form.price)

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Ingresa un precio valido.')
      return
    }

    if (mode === 'create' && !imageFile) {
      setErrorMsg('Selecciona una imagen para la publicacion.')
      return
    }

    const normalizedWhatsapp = normalizeWhatsAppNumber(form.whatsappNumber)

    if (!normalizedWhatsapp) {
      setErrorMsg('Ingresa un numero de WhatsApp valido.')
      return
    }

    setSubmitting(true)

    const result = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      category: form.category.trim(),
      whatsappNumber: normalizedWhatsapp,
      imageFile,
    })

    if (result?.error) {
      setErrorMsg(result.error)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Titulo</span>
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, title: event.target.value }))
            }
            placeholder="Ej: iPhone 13 128GB"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Descripcion</span>
          <textarea
            className="min-h-32 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
            placeholder="Describe el estado, uso y detalles importantes..."
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Precio</span>
            <input
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, price: event.target.value }))
              }
              placeholder="0.00"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <input
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              value={form.category}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, category: event.target.value }))
              }
              placeholder="Ej: Tecnologia"
              required
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">WhatsApp de contacto</span>
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            type="tel"
            value={form.whatsappNumber}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, whatsappNumber: event.target.value }))
            }
            placeholder="Ej: 5492645551234"
            required
          />
          <span className="text-xs text-slate-500">
            Incluye codigo de pais y area. Solo se guardan numeros.
          </span>
        </label>

        {currentImageUrl ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Imagen actual
            </p>
            <img
              src={currentImageUrl}
              alt="Imagen actual"
              className="h-44 w-full rounded-lg object-cover sm:h-52"
            />
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            {mode === 'create' ? 'Imagen' : 'Nueva imagen (opcional)'}
          </span>
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            required={mode === 'create'}
          />
          {needsImage ? (
            <span className="text-xs text-slate-500">Agrega una imagen para publicar.</span>
          ) : null}
        </label>

        {errorMsg ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href={cancelHref}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </Link>
          <button
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
