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
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Crear publicacion</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Titulo</span>
          <input
            className="rounded border px-3 py-2"
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, title: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Descripcion</span>
          <textarea
            className="min-h-32 rounded border px-3 py-2"
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Precio</span>
          <input
            className="rounded border px-3 py-2"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, price: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Categoria</span>
          <input
            className="rounded border px-3 py-2"
            value={form.category}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, category: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Imagen</span>
          <input
            className="rounded border px-3 py-2"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            required
          />
        </label>

        {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Publicar'}
        </button>
      </form>
    </section>
  )
}
