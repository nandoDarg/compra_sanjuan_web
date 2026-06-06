'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import PostForm, { type PostFormSubmitData } from '@/components/post-form'
import EmptyState from '@/components/ui/empty-state'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase-client'
import { getPostImagePathFromPublicUrl } from '@/lib/post-images'
import { isVehicleCategory, type VehicleDetailsInput } from '@/lib/vehicle-details'

const MAX_IMAGE_SIZE_BYTES = Math.round(2.5 * 1024 * 1024)

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  condition: 'new' | 'used' | null
  whatsapp_number: string | null
  location_department: string | null
  location_maps_url: string | null
  image_url: string | null
}

type PostImage = {
  image_url: string
}

type VehicleDetailsRow = VehicleDetailsInput

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const postId = params.id
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [post, setPost] = useState<Post | null>(null)
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetailsInput | null>(null)
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
        .select('id,user_id,title,description,price,category,condition,whatsapp_number,location_department,location_maps_url,image_url')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        setErrorMsg('No pudimos cargar la publicacion para editar.')
        setLoading(false)
        return
      }

      const { data: extraImagesData } = await supabase
        .from('post_images')
        .select('image_url')
        .eq('post_id', data.id)
        .order('position', { ascending: true })

      const mergedGallery = [
        data.image_url,
        ...((extraImagesData as PostImage[] | null)?.map((item) => item.image_url) ?? []),
      ].filter((value): value is string => Boolean(value))

      const { data: vehicleDetailsData } = await supabase
        .from('vehicle_details')
        .select('brand,model,year,mileage,fuel_type,transmission,condition,first_owner')
        .eq('post_id', data.id)
        .maybeSingle()

      setExistingGalleryUrls(Array.from(new Set(mergedGallery)))
      setVehicleDetails((vehicleDetailsData as VehicleDetailsRow | null) ?? null)
      setPost(data)
      setLoading(false)
    }

    loadPost()
  }, [postId, supabase, user])

  const handleSubmit = async (formData: PostFormSubmitData) => {
    if (!user || !post) {
      return { error: 'No hay sesion activa para editar la publicacion.' }
    }

    if (formData.newImages.some(({ file }) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      return { error: 'Cada imagen debe pesar como maximo 2.5MB.' }
    }

    const { data: existingExtraImages } = await supabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', post.id)
      .order('position', { ascending: true })

    const previousGallery = [
      post.image_url,
      ...((existingExtraImages as PostImage[] | null)?.map((item) => item.image_url) ?? []),
    ].filter((value): value is string => Boolean(value))

    const uploadedImages: Array<{ filePath: string; publicUrl: string; imageId: string }> = []

    if (formData.newImages.length > 0) {

      for (const { id: imageId, file: imageFile } of formData.newImages) {
        const safeFileName = imageFile.name.replace(/\s+/g, '-').toLowerCase()
        const newPath = `${user.id}/${Date.now()}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(newPath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          return { error: uploadError.message }
        }

        const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(newPath)
        uploadedImages.push({ filePath: newPath, publicUrl: publicUrlData.publicUrl, imageId })
      }
    }

    const uploadedUrlById = new Map(
      uploadedImages.map((image) => [image.imageId, image.publicUrl])
    )

    const finalGallery = formData.galleryOrder
      .map((token) => {
        if (token.startsWith('existing::')) {
          const url = token.slice('existing::'.length)
          return previousGallery.includes(url) ? url : null
        }

        if (token.startsWith('new::')) {
          const imageId = token.slice('new::'.length)
          return uploadedUrlById.get(imageId) ?? null
        }

        return null
      })
      .filter((url): url is string => Boolean(url))

    const primaryImageUrl = finalGallery[0] ?? null
    const finalExtraImageUrls = finalGallery.slice(1)

    await supabase.from('post_images').delete().eq('post_id', post.id)

    if (finalExtraImageUrls.length > 0) {
      const { error: imageRelationError } = await supabase.from('post_images').insert(
        finalExtraImageUrls.map((imageUrl, index) => ({
          post_id: post.id,
          image_url: imageUrl,
          position: index + 1,
        }))
      )

      if (imageRelationError) {
        await supabase.storage.from('post-images').remove(uploadedImages.map((image) => image.filePath))
        return { error: 'Fallo el guardado de imagenes. Intenta nuevamente.' }
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
        location_department: formData.locationDepartment,
        location_maps_url: formData.locationMapsUrl,
        image_url: primaryImageUrl,
        condition: formData.condition ?? null,
      })
      .eq('id', post.id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    if (isVehicleCategory(formData.category) && formData.vehicleDetails) {
      const { error: vehicleDetailsError } = await supabase.from('vehicle_details').upsert(
        {
          post_id: post.id,
          brand: formData.vehicleDetails.brand,
          model: formData.vehicleDetails.model,
          year: formData.vehicleDetails.year,
          mileage: formData.vehicleDetails.mileage,
          fuel_type: formData.vehicleDetails.fuel_type,
          transmission: formData.vehicleDetails.transmission,
          condition: formData.vehicleDetails.condition,
          first_owner: formData.vehicleDetails.first_owner,
        },
        {
          onConflict: 'post_id',
        }
      )

      if (vehicleDetailsError) {
        return { error: 'No se pudo actualizar la informacion del vehiculo.' }
      }
    } else if (vehicleDetails || isVehicleCategory(post.category)) {
      const { error: vehicleDetailsDeleteError } = await supabase
        .from('vehicle_details')
        .delete()
        .eq('post_id', post.id)

      if (vehicleDetailsDeleteError) {
        console.warn('No se pudo limpiar la informacion del vehiculo')
      }
    }

    const removedUrls = previousGallery.filter((url) => !finalGallery.includes(url))
    const removedPaths = removedUrls
      .map((url) => getPostImagePathFromPublicUrl(url))
      .filter((path): path is string => Boolean(path))

    if (removedPaths.length > 0) {
      await supabase.storage.from('post-images').remove(removedPaths)
    }

    router.push('/my-posts')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center py-12">
        <div className="thsj-panel px-6 py-8 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-(--background-muted)" />
          <p className="text-sm text-(--foreground-muted)">Cargando publicacion...</p>
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
      draftStorageKey={`thsj:draft:edit-post:${post.id}`}
      cancelHref="/my-posts"
      initialValues={{
        title: post.title,
        description: post.description,
        price: Number(post.price),
        category: post.category,
        whatsappNumber: post.whatsapp_number,
        locationDepartment: post.location_department,
        locationMapsUrl: post.location_maps_url,
        imageUrl: post.image_url,
        existingImageUrls: existingGalleryUrls,
        vehicleDetails,
        condition: post.condition,
      }}
      onSubmit={handleSubmit}
    />
  )
}
