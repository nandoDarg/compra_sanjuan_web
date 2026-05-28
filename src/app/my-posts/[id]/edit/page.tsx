'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import PostForm, { type PostFormSubmitData } from '@/components/post-form'
import EmptyState from '@/components/ui/empty-state'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase-client'
import { getPostImagePathFromPublicUrl } from '@/lib/post-images'

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  whatsapp_number: string | null
  image_url: string | null
}

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const postId = params.id
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    const loadPost = async () => {
      setLoading(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,whatsapp_number,image_url')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        setErrorMsg('No pudimos cargar la publicacion para editar.')
        setLoading(false)
        return
      }

      setPost(data)
      setLoading(false)
    }

    loadPost()
  }, [postId, supabase, user])

  const handleSubmit = async (formData: PostFormSubmitData) => {
    if (!user || !post) {
      return { error: 'No hay sesion activa para editar la publicacion.' }
    }

    let imageUrlToSave = post.image_url

    if (formData.imageFile) {
      const safeFileName = formData.imageFile.name.replace(/\s+/g, '-').toLowerCase()
      const newPath = `${user.id}/${Date.now()}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(newPath, formData.imageFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { error: uploadError.message }
      }

      const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(newPath)
      imageUrlToSave = publicUrlData.publicUrl

      const previousImagePath = getPostImagePathFromPublicUrl(post.image_url)

      if (previousImagePath) {
        await supabase.storage.from('post-images').remove([previousImagePath])
      }
    }

    const { error } = await supabase
      .from('posts')
      .update({
        title: formData.title,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        whatsapp_number: formData.whatsappNumber,
        image_url: imageUrlToSave,
      })
      .eq('id', post.id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    router.push('/my-posts')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center py-12">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          <p className="text-sm text-slate-600">Cargando publicacion...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <section className="py-8">
        <EmptyState
          title="No encontramos esa publicacion"
          description={errorMsg ?? 'Puede que haya sido eliminada o que no tengas permisos para editarla.'}
          ctaHref="/my-posts"
          ctaLabel="Volver a mis publicaciones"
        />
      </section>
    )
  }

  return (
    <PostForm
      mode="edit"
      heading="Editar publicacion"
      description="Actualiza la informacion de tu producto para mantener tu anuncio al dia."
      submitLabel="Guardar cambios"
      cancelHref="/my-posts"
      initialValues={{
        title: post.title,
        description: post.description,
        price: Number(post.price),
        category: post.category,
        whatsappNumber: post.whatsapp_number,
        imageUrl: post.image_url,
      }}
      onSubmit={handleSubmit}
    />
  )
}
