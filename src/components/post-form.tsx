'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { OTHER_CATEGORY_VALUE, PREDEFINED_POST_CATEGORIES } from '@/lib/post-categories'

type PostFormValues = {
  title: string
  description: string
  price: string
  whatsappNumber: string
}

export type PostFormSubmitData = {
  title: string
  description: string
  price: number
  category: string
  whatsappNumber: string
  imageFiles: File[]
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
  const isPredefinedCategory = (value: string) =>
    PREDEFINED_POST_CATEGORIES.includes(value as (typeof PREDEFINED_POST_CATEGORIES)[number])

  const [form, setForm] = useState<PostFormValues>(() => {
    if (!initialValues) {
      return emptyValues
    }

    return {
      title: initialValues.title,
      description: initialValues.description,
      price: String(initialValues.price),
      whatsappNumber: initialValues.whatsappNumber ?? '',
    }
  })

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (!initialValues?.category) {
      return ''
    }

    return isPredefinedCategory(initialValues.category)
      ? initialValues.category
      : OTHER_CATEGORY_VALUE
  })
  const [customCategory, setCustomCategory] = useState(() => {
    if (!initialValues?.category || isPredefinedCategory(initialValues.category)) {
      return ''
    }

    return initialValues.category
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const currentImageUrl = useMemo(() => initialValues?.imageUrl ?? null, [initialValues])
  const needsImage = mode === 'create' && imageFiles.length === 0

  const addImageFiles = (incoming: FileList | null) => {
    if (!incoming) {
      return
    }

    const dedupeKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`
    const incomingFiles = Array.from(incoming)

    setImageFiles((previous) => {
      const uniqueMap = new Map<string, File>()

      for (const file of previous) {
        uniqueMap.set(dedupeKey(file), file)
      }

      for (const file of incomingFiles) {
        uniqueMap.set(dedupeKey(file), file)
      }

      return Array.from(uniqueMap.values()).slice(0, 10)
    })
  }

  const removeImageAt = (indexToRemove: number) => {
    setImageFiles((previous) => previous.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    const finalCategory =
      selectedCategory === OTHER_CATEGORY_VALUE
        ? customCategory.trim()
        : selectedCategory.trim()

    const parsedPrice = Number(form.price)

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Ingresa un precio valido.')
      return
    }

    if (!finalCategory) {
      setErrorMsg('Selecciona una categoria o escribe una personalizada.')
      return
    }

    if (mode === 'create' && imageFiles.length === 0) {
      setErrorMsg('Selecciona al menos una imagen para la publicacion.')
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
      category: finalCategory,
      whatsappNumber: normalizedWhatsapp,
      imageFiles,
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
      <div className="thsj-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{heading}</h1>
        <p className="mt-2 text-sm">{description}</p>
      </div>

      <form
        className="thsj-panel space-y-4 p-5 sm:p-6"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Titulo</span>
          <input
            className="thsj-input px-3 py-2.5"
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, title: event.target.value }))
            }
            placeholder="Ej: iPhone 13 128GB"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Descripcion</span>
          <textarea
            className="thsj-input min-h-32 px-3 py-2.5"
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
            <span className="text-sm font-medium text-foreground">Precio</span>
            <input
              className="thsj-input px-3 py-2.5"
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
            <span className="text-sm font-medium text-foreground">Categoria</span>
            <select
              className="thsj-input px-3 py-2.5"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              required
            >
              <option value="" disabled>
                Selecciona una categoria
              </option>
              {PREDEFINED_POST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value={OTHER_CATEGORY_VALUE}>Otra (provisoria)</option>
            </select>

            {selectedCategory === OTHER_CATEGORY_VALUE ? (
              <input
                className="thsj-input mt-2 px-3 py-2.5"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder="Escribe la categoria que falta"
                required
              />
            ) : null}

            <span className="text-xs text-(--foreground-muted)">
              Si no existe tu categoria, usa la opcion Otra provisoria. Luego la sumamos al listado oficial.
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">WhatsApp de contacto</span>
          <input
            className="thsj-input px-3 py-2.5"
            type="tel"
            value={form.whatsappNumber}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, whatsappNumber: event.target.value }))
            }
            placeholder="Ej: 5492645551234"
            required
          />
          <span className="text-xs text-(--foreground-muted)">
            Incluye codigo de pais y area. Solo se guardan numeros.
          </span>
        </label>

        {currentImageUrl ? (
          <div className="rounded-xl border border-(--line) bg-(--background-muted) p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--foreground-muted)">
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
          <span className="text-sm font-medium text-foreground">
            {mode === 'create' ? 'Imagenes' : 'Nuevas imagenes (opcionales)'}
          </span>
          <input
            ref={imageInputRef}
            className="thsj-input px-3 py-2.5 text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-(--brand-secondary) file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#152638]"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              addImageFiles(event.target.files)
              event.currentTarget.value = ''
            }}
            required={mode === 'create' && imageFiles.length === 0}
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="thsj-btn thsj-btn-ghost px-3 py-1.5 text-xs"
            >
              Agregar mas fotos
            </button>
          </div>

          {imageFiles.length > 0 ? (
            <div className="mt-3 rounded-xl border border-(--line) bg-(--background-muted) p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--foreground-muted)">
                Imagenes seleccionadas ({imageFiles.length})
              </p>
              <ul className="space-y-2">
                {imageFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-(--foreground-muted)">
                      {index === 0 ? 'Principal: ' : `Foto ${index + 1}: `}
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImageAt(index)}
                      className="thsj-btn thsj-btn-ghost px-2 py-1 text-xs"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {needsImage ? (
            <span className="text-xs text-(--foreground-muted)">Agrega al menos una imagen para publicar.</span>
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
            className="thsj-btn thsj-btn-ghost w-full sm:w-auto"
          >
            Cancelar
          </Link>
          <button
            className="thsj-btn thsj-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
