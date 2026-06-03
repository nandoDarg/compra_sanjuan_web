'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import PostForm, { type PostFormSubmitData } from '@/components/post-form'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'
import { isVehicleCategory } from '@/lib/vehicle-details'

const MAX_IMAGE_SIZE_BYTES = Math.round(2.5 * 1024 * 1024)

export default function CreatePostPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (formData: PostFormSubmitData) => {
    if (formData.imageFiles.length === 0) {
      return { error: 'Selecciona al menos una imagen para la publicacion.' }
    }

    if (formData.imageFiles.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      return { error: 'Cada imagen debe pesar como maximo 2.5MB.' }
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'No hay una sesion activa.' }
    }

    const uploadedImages: Array<{ filePath: string; publicUrl: string }> = []

    for (const imageFile of formData.imageFiles) {
      const safeFileName = imageFile.name.replace(/\s+/g, '-').toLowerCase()
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { error: uploadError.message }
      }

      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      uploadedImages.push({ filePath, publicUrl: publicUrlData.publicUrl })
    }

    const [primaryImage, ...extraImages] = uploadedImages

    const { data: insertedPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        whatsapp_number: formData.whatsappNumber,
        image_url: primaryImage.publicUrl,
      })
      .select('id')
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    if (extraImages.length > 0) {
      const { error: imageRelationError } = await supabase.from('post_images').insert(
        extraImages.map((image, index) => ({
          post_id: insertedPost.id,
          image_url: image.publicUrl,
          position: index + 1,
        }))
      )

      if (imageRelationError) {
        await supabase
          .from('posts')
          .delete()
          .eq('id', insertedPost.id)
          .eq('user_id', user.id)

        await supabase.storage.from('post-images').remove(uploadedImages.map((image) => image.filePath))

        return {
          error: 'No se pudo guardar la galeria de imagenes. Revisa la migracion de post_images e intenta nuevamente.',
        }
      }
    }

    if (formData.vehicleDetails && isVehicleCategory(formData.category)) {
      const { error: vehicleDetailsError } = await supabase.from('vehicle_details').insert({
        post_id: insertedPost.id,
        brand: formData.vehicleDetails.brand,
        model: formData.vehicleDetails.model,
        year: formData.vehicleDetails.year,
        mileage: formData.vehicleDetails.mileage,
        fuel_type: formData.vehicleDetails.fuel_type,
        transmission: formData.vehicleDetails.transmission,
        condition: formData.vehicleDetails.condition,
        first_owner: formData.vehicleDetails.first_owner,
      })

      if (vehicleDetailsError) {
        await supabase
          .from('posts')
          .delete()
          .eq('id', insertedPost.id)
          .eq('user_id', user.id)

        await supabase.storage.from('post-images').remove(uploadedImages.map((image) => image.filePath))

        return {
          error: 'No se pudo guardar la informacion del vehiculo. Revisa la migracion de vehicle_details.',
        }
      }
    }

    trackEvent(ANALYTICS_EVENTS.POST_CREATED, {
      category: formData.category,
      price: Number(formData.price),
      has_image: formData.imageFiles.length > 0,
    })

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
