'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import PostForm, { type PostFormSubmitData } from '@/components/post-form'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'
import { isVehicleCategory } from '@/lib/vehicle-details'
import { isMissingSubcategoryColumnError } from '@/lib/post-subcategory-compat'
import { resolveSanJuanDepartment } from '@/lib/san-juan-departments'

const MAX_IMAGE_SIZE_BYTES = Math.round(2.5 * 1024 * 1024)

function isMissingVehicleDetailsTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST205' &&
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('vehicle_details')
  )
}

function logPublishError(step: string, error: unknown, context?: Record<string, unknown>) {
  console.error(error)

  try {
    console.error(JSON.stringify(error, null, 2))
  } catch {
    console.error('No se pudo serializar el error para diagnostico.')
  }

  console.error(`[create-post] ${step}`, context ?? {})
}

function getPublishFriendlyError(type: 'publish' | 'images') {
  if (type === 'images') {
    return 'Ocurrio un problema al subir las imagenes.'
  }

  return 'No se pudo publicar el anuncio. Intenta nuevamente.'
}

export default function CreatePostPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [profileLocality, setProfileLocality] = useState<string | null>(null)

  useEffect(() => {
    const loadProfileLocality = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('locality')
        .eq('user_id', user.id)
        .maybeSingle<{ locality: string | null }>()

      if (profileError) {
        return
      }

      const resolvedLocality = resolveSanJuanDepartment(profileData?.locality)
      setProfileLocality(resolvedLocality || null)
    }

    void loadProfileLocality()
  }, [supabase])

  const handleSubmit = async (formData: PostFormSubmitData) => {
    if (formData.newImages.some(({ file }) => file.size > MAX_IMAGE_SIZE_BYTES)) {
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

    const rollbackUploadedImages = async () => {
      if (uploadedImages.length === 0) {
        return
      }

      const { error: removeError } = await supabase.storage
        .from('post-images')
        .remove(uploadedImages.map((image) => image.filePath))

      if (removeError) {
        logPublishError('rollback-uploaded-images-failed', removeError, {
          filePaths: uploadedImages.map((image) => image.filePath),
        })
      }
    }

    for (const { file: imageFile } of formData.newImages) {
      const safeFileName = imageFile.name.replace(/\s+/g, '-').toLowerCase()
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`

      let uploadError: { message: string } | null = null

      try {
        const uploadResult = await supabase.storage
          .from('post-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        uploadError = uploadResult.error
      } catch (error) {
        logPublishError('upload-main-or-gallery-image-threw', error, {
          filePath,
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        })
        await rollbackUploadedImages()
        return { error: getPublishFriendlyError('images') }
      }

      if (uploadError) {
        logPublishError('upload-main-or-gallery-image-failed', uploadError, {
          filePath,
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        })
        await rollbackUploadedImages()
        return { error: getPublishFriendlyError('images') }
      }

      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl?.trim()

      if (!publicUrl) {
        logPublishError('public-url-generation-failed', { filePath }, {
          filePath,
        })
        await rollbackUploadedImages()
        return { error: getPublishFriendlyError('images') }
      }

      uploadedImages.push({ filePath, publicUrl })
    }

    const [primaryImage, ...extraImages] = uploadedImages

    let insertedPost: { id: string } | null = null
    let insertError: { message: string } | null = null

    try {
      let insertResponse = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          subcategory: formData.subcategory,
          whatsapp_number: formData.whatsappNumber,
          location_department: formData.locationDepartment,
          location_maps_url: formData.locationMapsUrl,
          image_url: primaryImage?.publicUrl ?? null,
          condition: formData.condition ?? null,
        })
        .select('id')
        .single()

      if (insertResponse.error && isMissingSubcategoryColumnError(insertResponse.error)) {
        insertResponse = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            whatsapp_number: formData.whatsappNumber,
            location_department: formData.locationDepartment,
            location_maps_url: formData.locationMapsUrl,
            image_url: primaryImage?.publicUrl ?? null,
            condition: formData.condition ?? null,
          })
          .select('id')
          .single()
      }

      insertedPost = insertResponse.data as { id: string } | null
      insertError = insertResponse.error
    } catch (error) {
      logPublishError('insert-post-threw', error, {
        userId: user.id,
        category: formData.category,
      })
      await rollbackUploadedImages()
      return { error: getPublishFriendlyError('publish') }
    }

    if (insertError || !insertedPost?.id) {
      logPublishError('insert-post-failed', insertError ?? { message: 'Insert sin id de post.' }, {
        userId: user.id,
        category: formData.category,
      })
      await rollbackUploadedImages()
      return { error: getPublishFriendlyError('publish') }
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
        logPublishError('insert-post-images-failed', imageRelationError, {
          postId: insertedPost.id,
          imagesCount: extraImages.length,
        })
        await supabase
          .from('posts')
          .delete()
          .eq('id', insertedPost.id)
          .eq('user_id', user.id)

        await rollbackUploadedImages()

        return { error: getPublishFriendlyError('images') }
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
        if (isMissingVehicleDetailsTableError(vehicleDetailsError)) {
          await supabase
            .from('posts')
            .delete()
            .eq('id', insertedPost.id)
            .eq('user_id', user.id)

          await rollbackUploadedImages()

          return {
            error:
              'Falta la tabla vehicle_details en Supabase. Ejecuta la migracion SQL de vehicle_details y vuelve a intentar.',
          }
        }

        logPublishError('insert-vehicle-details-failed', vehicleDetailsError, {
          postId: insertedPost.id,
          category: formData.category,
        })
        await supabase
          .from('posts')
          .delete()
          .eq('id', insertedPost.id)
          .eq('user_id', user.id)

        await rollbackUploadedImages()

        return { error: getPublishFriendlyError('publish') }
      }
    }

    trackEvent(ANALYTICS_EVENTS.POST_CREATED, {
      category: formData.category,
      price: Number(formData.price),
      has_image: formData.newImages.length > 0,
    })

    try {
      router.push('/')
      router.refresh()
    } catch (error) {
      logPublishError('post-publish-navigation-threw', error, {
        postId: insertedPost.id,
      })
    }
  }

  return (
    <PostForm
      mode="create"
      heading="Crear publicacion"
      description="Completa los datos del producto para publicarlo en el feed principal."
      submitLabel="Publicar"
      draftStorageKey="thsj:draft:create-post"
      cancelHref="/"
      initialValues={
        profileLocality
          ? {
              title: '',
              description: '',
              price: 0,
              category: '',
              subcategory: '',
              whatsappNumber: null,
              imageUrl: null,
              locationDepartment: profileLocality,
              locationMapsUrl: null,
              existingImageUrls: [],
              vehicleDetails: null,
              condition: null,
            }
          : undefined
      }
      onSubmit={handleSubmit}
    />
  )
}
