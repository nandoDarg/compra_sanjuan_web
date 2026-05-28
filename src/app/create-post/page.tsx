'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import PostForm, { type PostFormSubmitData } from '@/components/post-form'

export default function CreatePostPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (formData: PostFormSubmitData) => {
    if (!formData.imageFile) {
      return { error: 'Selecciona una imagen para la publicacion.' }
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'No hay una sesion activa.' }
    }

    const safeFileName = formData.imageFile.name.replace(/\s+/g, '-').toLowerCase()
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, formData.imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { error: uploadError.message }
    }

    const { data: publicUrlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('posts').insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      whatsapp_number: formData.whatsappNumber,
      image_url: publicUrlData.publicUrl,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    router.push('/')
    router.refresh()
  }

  return (
    <PostForm
      mode="create"
      heading="Crear publicacion"
      description="Completa los datos del producto para publicarlo en el feed principal."
      submitLabel="Publicar"
      cancelHref="/"
      onSubmit={handleSubmit}
    />
  )
}
