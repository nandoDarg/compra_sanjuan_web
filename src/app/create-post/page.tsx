'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

type FormState = {
  title: string
  description: string
  price: string
  category: string
}

const initialState: FormState = {
  title: '',
  description: '',
  price: '',
  category: '',
}

export default function CreatePostPage() {
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState<FormState>(initialState)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    if (!imageFile) {
      setErrorMsg('Selecciona una imagen para la publicacion.')
      return
    }

    const parsedPrice = Number(form.price)

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Ingresa un precio valido.')
      return
    }

    setSubmitting(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSubmitting(false)
      setErrorMsg('No hay una sesion activa.')
      return
    }

    const safeFileName = imageFile.name.replace(/\s+/g, '-').toLowerCase()
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setSubmitting(false)
      setErrorMsg(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      category: form.category.trim(),
      image_url: publicUrlData.publicUrl,
    })

    if (insertError) {
      setSubmitting(false)
      setErrorMsg(insertError.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Crear publicacion
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Completa los datos del producto para publicarlo en el feed principal.
        </p>
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
          <span className="text-sm font-medium text-slate-700">Imagen</span>
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            required
          />
        </label>

        {errorMsg ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Publicar'}
        </button>
      </form>
    </section>
  )
}
