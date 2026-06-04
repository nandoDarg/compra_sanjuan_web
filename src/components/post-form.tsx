'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { OTHER_CATEGORY_VALUE, PREDEFINED_POST_CATEGORIES } from '@/lib/post-categories'
import { normalizeCategoryValue } from '@/lib/category-normalization'
import {
  getVehicleYearRange,
  isVehicleCategory,
  type VehicleDetailsInput,
  VEHICLE_BRAND_OPTIONS,
  VEHICLE_CONDITION_OPTIONS,
  VEHICLE_FIRST_OWNER_OPTIONS,
  VEHICLE_FUEL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
} from '@/lib/vehicle-details'
import { isValidGoogleMapsUrl, SAN_JUAN_DEPARTMENTS } from '@/lib/post-location'

type PostFormValues = {
  title: string
  description: string
  price: string
  whatsappNumber: string
  locationDepartment: string
  locationMapsUrl: string
}

type VehicleFormValues = {
  brand: string
  customBrand: string
  model: string
  year: string
  mileage: string
  fuelType: string
  transmission: string
  condition: string
  firstOwner: string
}

export type PostFormSubmitData = {
  title: string
  description: string
  price: number
  category: string
  whatsappNumber: string
  imageFiles: File[]
  newImages: Array<{ id: string; file: File }>
  galleryOrder: string[]
  keptExistingImageUrls: string[]
  vehicleDetails: VehicleDetailsInput | null
  locationDepartment: string
  locationMapsUrl: string | null
}

type GalleryItem = {
  id: string
  kind: 'existing' | 'new'
  url: string
  file?: File
}

type CropTargetState = {
  itemId: string
  itemUrl: string
}

type PostFormProps = {
  mode: 'create' | 'edit'
  heading: string
  description: string
  submitLabel: string
  draftStorageKey?: string
  initialValues?: {
    title: string
    description: string
    price: number
    category: string
    whatsappNumber: string | null
    imageUrl: string | null
    locationDepartment: string | null
    locationMapsUrl: string | null
    existingImageUrls?: string[]
    vehicleDetails?: VehicleDetailsInput | null
  }
  cancelHref?: string
  onSubmit: (data: PostFormSubmitData) => Promise<{ error?: string } | void>
}

const emptyValues: PostFormValues = {
  title: '',
  description: '',
  price: '',
  whatsappNumber: '',
  locationDepartment: '',
  locationMapsUrl: '',
}

const MAX_IMAGES = 10
const MAX_IMAGE_SIZE_BYTES = Math.round(2.5 * 1024 * 1024)
const MAX_IMAGE_DIMENSION = 2000
const { min: MIN_VEHICLE_YEAR, max: MAX_VEHICLE_YEAR } = getVehicleYearRange()

type PostFormDraft = {
  form: PostFormValues
  selectedCategory: string
  customCategory: string
  vehicleForm: VehicleFormValues
  existingImageUrls: string[]
}

type FormChangeSnapshot = {
  form: PostFormValues
  selectedCategory: string
  customCategory: string
  vehicleForm: VehicleFormValues
  gallery: Array<{ kind: GalleryItem['kind']; value: string }>
}

const VEHICLE_PHOTO_ORDER = [
  'Frente',
  'Frente 3/4',
  'Lateral izquierdo',
  'Lateral derecho',
  'Trasera',
  'Interior',
  'Tablero',
  'Motor',
] as const

function readDraft(key: string) {
  if (typeof window === 'undefined') {
    return null as PostFormDraft | null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as PostFormDraft
  } catch {
    return null
  }
}

function buildGalleryItemId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toSnapshotKey(snapshot: FormChangeSnapshot) {
  return JSON.stringify(snapshot)
}

function buildFormChangeSnapshot(args: {
  form: PostFormValues
  selectedCategory: string
  customCategory: string
  vehicleForm: VehicleFormValues
  galleryItems: GalleryItem[]
}): FormChangeSnapshot {
  return {
    form: args.form,
    selectedCategory: args.selectedCategory,
    customCategory: args.customCategory,
    vehicleForm: args.vehicleForm,
    gallery: args.galleryItems.map((item) => ({
      kind: item.kind,
      value:
        item.kind === 'existing'
          ? item.url
          : `${item.file?.name ?? item.id}-${item.file?.size ?? 0}-${item.file?.lastModified ?? 0}`,
    })),
  }
}

function reorderItems<T extends { id: string }>(items: T[], activeId: string, overId: string) {
  const fromIndex = items.findIndex((item) => item.id === activeId)
  const toIndex = items.findIndex((item) => item.id === overId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

async function loadImageFromUrl(url: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para editarla.'))
    img.src = url
  })

  return image
}

async function buildCroppedFile(imageUrl: string, cropArea: Area, baseName: string) {
  const image = await loadImageFromUrl(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropArea.width))
  canvas.height = Math.max(1, Math.round(cropArea.height))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo preparar la edicion de imagen.')
  }

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const blob = await canvasToBlob(canvas, 0.92)
  const croppedName = `${replaceExtension(baseName, 'jpg')}`
  return new File([blob], croppedName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

function replaceExtension(fileName: string, extension: string) {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) {
    return `${fileName}.${extension}`
  }

  return `${fileName.slice(0, dotIndex)}.${extension}`
}

async function imageToCanvas(file: File, scaleFactor = 1) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      img.src = objectUrl
    })

    const baseScale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height))
    const effectiveScale = Math.max(0.2, baseScale * scaleFactor)
    const width = Math.max(1, Math.round(image.width * effectiveScale))
    const height = Math.max(1, Math.round(image.height * effectiveScale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('No se pudo preparar la compresion de imagen.')
    }

    context.drawImage(image, 0, 0, width, height)
    return canvas
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar la imagen comprimida.'))
          return
        }

        resolve(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

async function ensureFileWithinBudget(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`El archivo ${file.name} no es una imagen valida.`)
  }

  if (file.size <= MAX_IMAGE_SIZE_BYTES) {
    return file
  }

  if (file.type === 'image/gif') {
    throw new Error(`La imagen ${file.name} supera 2.5MB y no se puede comprimir como GIF.`)
  }

  let scaleFactor = 1
  const qualitySteps = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42]

  for (let scaleTry = 0; scaleTry < 4; scaleTry += 1) {
    const canvas = await imageToCanvas(file, scaleFactor)

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, quality)

      if (blob.size <= MAX_IMAGE_SIZE_BYTES) {
        const compressedName = replaceExtension(file.name, 'jpg')
        return new File([blob], compressedName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      }
    }

    scaleFactor *= 0.82
  }

  throw new Error(`No se pudo comprimir ${file.name} por debajo de 2.5MB.`)
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D+/g, '')
}

export default function PostForm({
  mode,
  heading,
  description,
  submitLabel,
  draftStorageKey,
  initialValues,
  cancelHref = '/',
  onSubmit,
}: PostFormProps) {
  const isPredefinedCategory = (value: string) =>
    PREDEFINED_POST_CATEGORIES.includes(value as (typeof PREDEFINED_POST_CATEGORIES)[number])

  const defaultFormValues = useMemo<PostFormValues>(() => {
    if (!initialValues) {
      return emptyValues
    }

    return {
      title: initialValues.title,
      description: initialValues.description,
      price: String(initialValues.price),
      whatsappNumber: initialValues.whatsappNumber ?? '',
      locationDepartment: initialValues.locationDepartment ?? '',
      locationMapsUrl: initialValues.locationMapsUrl ?? '',
    }
  }, [initialValues])

  const defaultSelectedCategory = useMemo(() => {
    if (!initialValues?.category) {
      return ''
    }

    return isPredefinedCategory(initialValues.category)
      ? initialValues.category
      : OTHER_CATEGORY_VALUE
  }, [initialValues])

  const defaultCustomCategory = useMemo(() => {
    if (!initialValues?.category || isPredefinedCategory(initialValues.category)) {
      return ''
    }

    return initialValues.category
  }, [initialValues])

  const defaultVehicleForm = useMemo<VehicleFormValues>(() => {
    const details = initialValues?.vehicleDetails

    return {
      brand: details?.brand ?? '',
      customBrand:
        details?.brand && !VEHICLE_BRAND_OPTIONS.includes(details.brand as (typeof VEHICLE_BRAND_OPTIONS)[number])
          ? details.brand
          : '',
      model: details?.model ?? '',
      year: details?.year ? String(details.year) : '',
      mileage: details?.mileage ? String(details.mileage) : '',
      fuelType: details?.fuel_type ?? '',
      transmission: details?.transmission ?? '',
      condition: details?.condition ?? '',
      firstOwner: typeof details?.first_owner === 'boolean' ? (details.first_owner ? 'Si' : 'No') : '',
    }
  }, [initialValues])

  const defaultExistingImageUrls = useMemo(() => {
    if (!initialValues?.existingImageUrls || initialValues.existingImageUrls.length === 0) {
      return initialValues?.imageUrl ? [initialValues.imageUrl] : []
    }

    return initialValues.existingImageUrls
  }, [initialValues])

  const draft = useMemo(
    () => (draftStorageKey ? readDraft(draftStorageKey) : null),
    [draftStorageKey]
  )

  const [form, setForm] = useState<PostFormValues>(() => draft?.form ?? defaultFormValues)

  const [selectedCategory, setSelectedCategory] = useState(() => draft?.selectedCategory ?? defaultSelectedCategory)
  const [customCategory, setCustomCategory] = useState(() => draft?.customCategory ?? defaultCustomCategory)

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() =>
    (draft?.existingImageUrls ?? defaultExistingImageUrls).map((url) => ({
      id: buildGalleryItemId('existing'),
      kind: 'existing',
      url,
    }))
  )
  const [imageImportUrl, setImageImportUrl] = useState('')
  const [importingUrl, setImportingUrl] = useState(false)
  const [processingImages, setProcessingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null)
  const [cropTarget, setCropTarget] = useState<CropTargetState | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applyingCrop, setApplyingCrop] = useState(false)
  const [lastSavedSnapshotKey, setLastSavedSnapshotKey] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [vehicleForm, setVehicleForm] = useState<VehicleFormValues>(() => draft?.vehicleForm ?? defaultVehicleForm)

  const initialSnapshotKey = useMemo(
    () =>
      toSnapshotKey(
        buildFormChangeSnapshot({
          form: defaultFormValues,
          selectedCategory: defaultSelectedCategory,
          customCategory: defaultCustomCategory,
          vehicleForm: defaultVehicleForm,
          galleryItems: defaultExistingImageUrls.map((url) => ({
            id: `existing-snapshot-${url}`,
            kind: 'existing' as const,
            url,
          })),
        })
      ),
    [
      defaultCustomCategory,
      defaultExistingImageUrls,
      defaultFormValues,
      defaultSelectedCategory,
      defaultVehicleForm,
    ]
  )

  const currentSnapshotKey = useMemo(
    () =>
      toSnapshotKey(
        buildFormChangeSnapshot({
          form,
          selectedCategory,
          customCategory,
          vehicleForm,
          galleryItems,
        })
      ),
    [customCategory, form, galleryItems, selectedCategory, vehicleForm]
  )

  const hasPendingChanges =
    mode === 'create' ? true : currentSnapshotKey !== (lastSavedSnapshotKey ?? initialSnapshotKey)

  useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined') {
      return
    }

    const payload: PostFormDraft = {
      form,
      selectedCategory,
      customCategory,
      vehicleForm,
      existingImageUrls: galleryItems
        .filter((item) => item.kind === 'existing')
        .map((item) => item.url),
    }

    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload))
  }, [
    customCategory,
    draftStorageKey,
    form,
    galleryItems,
    selectedCategory,
    vehicleForm,
  ])

  useEffect(() => {
    return () => {
      for (const item of galleryItems) {
        if (item.kind === 'new') {
          URL.revokeObjectURL(item.url)
        }
      }
    }
  }, [galleryItems])

  const needsImage = mode === 'create' && galleryItems.length === 0
  const effectiveCategory = normalizeCategoryValue(
    selectedCategory === OTHER_CATEGORY_VALUE
      ? customCategory.trim()
      : selectedCategory.trim()
  )
  const showVehicleSection = isVehicleCategory(effectiveCategory)

  const addImageFiles = async (incoming: File[]) => {
    if (incoming.length === 0) {
      return
    }

    setErrorMsg(null)
    setProcessingImages(true)

    const errorMessages: string[] = []
    const dedupeKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`
    const existingNewFileKeys = new Set(
      galleryItems
        .filter((item) => item.kind === 'new' && item.file)
        .map((item) => dedupeKey(item.file as File))
    )
    const preparedFiles: File[] = []

    for (const incomingFile of incoming) {
      const key = dedupeKey(incomingFile)

      if (existingNewFileKeys.has(key)) {
        continue
      }

      if (galleryItems.length + preparedFiles.length >= MAX_IMAGES) {
        errorMessages.push(`Solo puedes subir hasta ${MAX_IMAGES} imagenes.`)
        break
      }

      try {
        const compressed = await ensureFileWithinBudget(incomingFile)
        preparedFiles.push(compressed)
        existingNewFileKeys.add(key)
      } catch (error) {
        errorMessages.push(error instanceof Error ? error.message : 'No se pudo procesar una imagen.')
      }
    }

    if (preparedFiles.length > 0) {
      const preparedItems: GalleryItem[] = preparedFiles.map((file) => ({
        id: buildGalleryItemId('new'),
        kind: 'new',
        file,
        url: URL.createObjectURL(file),
      }))

      setGalleryItems((previous) => [...previous, ...preparedItems].slice(0, MAX_IMAGES))
    }

    setProcessingImages(false)

    if (errorMessages.length > 0) {
      setErrorMsg(errorMessages[0])
    }
  }

  const handleImportFromUrl = async () => {
    const rawUrl = imageImportUrl.trim()

    if (!rawUrl) {
      setErrorMsg('Pega un enlace de imagen para importar.')
      return
    }

    setErrorMsg(null)
    setImportingUrl(true)

    try {
      const response = await fetch('/api/import-image', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: rawUrl }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorMsg(payload?.error ?? 'No se pudo importar la imagen desde el enlace.')
        setImportingUrl(false)
        return
      }

      const blob = await response.blob()
      const fileName =
        response.headers.get('x-file-name') ?? `importada-${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })

      await addImageFiles([file])
      setImageImportUrl('')
    } catch {
      setErrorMsg('No se pudo importar la imagen. Verifica que el enlace sea publico.')
    } finally {
      setImportingUrl(false)
    }
  }

  const removeGalleryItem = (idToRemove: string) => {
    setGalleryItems((previous) => {
      const target = previous.find((item) => item.id === idToRemove)

      if (target?.kind === 'new') {
        URL.revokeObjectURL(target.url)
      }

      return previous.filter((item) => item.id !== idToRemove)
    })
  }

  const handleDragStart = (itemId: string) => {
    setDraggingImageId(itemId)
  }

  const handleDropOn = (targetId: string) => {
    if (!draggingImageId) {
      return
    }

    setGalleryItems((previous) => reorderItems(previous, draggingImageId, targetId))
    setDraggingImageId(null)
  }

  const handleCropComplete = (_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }

  const applyCropOnCurrentImage = async () => {
    if (!cropTarget || !croppedAreaPixels) {
      return
    }

    setApplyingCrop(true)
    setErrorMsg(null)

    try {
      const cropped = await buildCroppedFile(cropTarget.itemUrl, croppedAreaPixels, `${cropTarget.itemId}.jpg`)
      const optimized = await ensureFileWithinBudget(cropped)
      const nextItemId = buildGalleryItemId('new')
      const nextItem: GalleryItem = {
        id: nextItemId,
        kind: 'new',
        file: optimized,
        url: URL.createObjectURL(optimized),
      }

      setGalleryItems((previous) => {
        return previous.map((item) => {
          if (item.id !== cropTarget.itemId) {
            return item
          }

          if (item.kind === 'new') {
            URL.revokeObjectURL(item.url)
          }

          return nextItem
        })
      })

      setCropTarget(null)
      setCrop({ x: 0, y: 0 })
      setCropZoom(1)
      setCroppedAreaPixels(null)
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo recortar la imagen.')
    } finally {
      setApplyingCrop(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)

    const finalCategory = effectiveCategory

    const parsedPrice = Number(form.price)

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Ingresa un precio valido.')
      return
    }

    if (!finalCategory) {
      setErrorMsg('Selecciona una categoria o escribe una personalizada.')
      return
    }

    if (mode === 'create' && galleryItems.length === 0) {
      setErrorMsg('Selecciona al menos una imagen para la publicacion.')
      return
    }

    if (processingImages) {
      setErrorMsg('Espera a que termine la compresion de imagenes.')
      return
    }

    const normalizedWhatsapp = normalizeWhatsAppNumber(form.whatsappNumber)

    if (!normalizedWhatsapp) {
      setErrorMsg('Ingresa un numero de WhatsApp valido.')
      return
    }

    if (!form.locationDepartment.trim()) {
      setErrorMsg('Selecciona un departamento para la ubicacion.')
      return
    }

    if (form.locationMapsUrl.trim() && !isValidGoogleMapsUrl(form.locationMapsUrl)) {
      setErrorMsg('Ingresa un link valido de Google Maps.')
      return
    }

    let vehicleDetailsPayload: VehicleDetailsInput | null = null

    if (showVehicleSection) {
      const parsedYear = Number(vehicleForm.year)
      const parsedMileage = Number(vehicleForm.mileage)
      const parsedFirstOwner = vehicleForm.firstOwner === 'Si'

      const resolvedBrand =
        vehicleForm.brand === 'Otra'
          ? vehicleForm.customBrand.trim()
          : vehicleForm.brand.trim()

      if (!resolvedBrand) {
        setErrorMsg('Selecciona una marca o escribe la marca en "Otra".')
        return
      }

      if (!vehicleForm.model.trim()) {
        setErrorMsg('Ingresa el modelo del vehiculo.')
        return
      }

      if (
        Number.isNaN(parsedYear) ||
        parsedYear < MIN_VEHICLE_YEAR ||
        parsedYear > MAX_VEHICLE_YEAR
      ) {
        setErrorMsg(`Ingresa un año valido entre ${MIN_VEHICLE_YEAR} y ${MAX_VEHICLE_YEAR}.`)
        return
      }

      if (Number.isNaN(parsedMileage) || parsedMileage < 0) {
        setErrorMsg('Ingresa un kilometraje valido (0 o mayor).')
        return
      }

      if (!vehicleForm.fuelType) {
        setErrorMsg('Selecciona el tipo de combustible.')
        return
      }

      if (!vehicleForm.transmission) {
        setErrorMsg('Selecciona el tipo de transmision.')
        return
      }

      if (!vehicleForm.condition) {
        setErrorMsg('Selecciona el estado del vehiculo.')
        return
      }

      if (!vehicleForm.firstOwner) {
        setErrorMsg('Indica si es primera mano.')
        return
      }

      vehicleDetailsPayload = {
        brand: resolvedBrand,
        model: vehicleForm.model.trim(),
        year: parsedYear,
        mileage: Math.round(parsedMileage),
        fuel_type: vehicleForm.fuelType,
        transmission: vehicleForm.transmission,
        condition: vehicleForm.condition,
        first_owner: parsedFirstOwner,
      }
    }

    const orderedGallery = galleryItems.map((item) =>
      item.kind === 'existing' ? `existing::${item.url}` : `new::${item.id}`
    )
    const newImages = galleryItems
      .filter((item): item is GalleryItem & { kind: 'new'; file: File } => item.kind === 'new' && Boolean(item.file))
      .map((item) => ({ id: item.id, file: item.file }))
    const keptExistingImageUrls = galleryItems
      .filter((item) => item.kind === 'existing')
      .map((item) => item.url)

    setSubmitting(true)

    const result = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      category: finalCategory,
      whatsappNumber: normalizedWhatsapp,
      imageFiles: newImages.map((item) => item.file),
      newImages,
      galleryOrder: orderedGallery,
      keptExistingImageUrls,
      vehicleDetails: vehicleDetailsPayload,
      locationDepartment: form.locationDepartment.trim(),
      locationMapsUrl: form.locationMapsUrl.trim() ? form.locationMapsUrl.trim() : null,
    })

    if (result?.error) {
      setErrorMsg(result.error)
      setSubmitting(false)
      return
    }

    if (draftStorageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(draftStorageKey)
    }

    setLastSavedSnapshotKey(currentSnapshotKey)

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

        {showVehicleSection ? (
          <div className="rounded-2xl border border-(--line) bg-(--background-muted) p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Informacion del vehiculo</h2>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Marca</span>
                <select
                  className="thsj-input px-3 py-2.5"
                  value={vehicleForm.brand}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, brand: event.target.value }))
                  }
                >
                  <option value="" disabled>
                    Selecciona una marca
                  </option>
                  {VEHICLE_BRAND_OPTIONS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>

                {vehicleForm.brand === 'Otra' ? (
                  <input
                    className="thsj-input mt-2 px-3 py-2.5"
                    placeholder="Escribe la marca"
                    value={vehicleForm.customBrand}
                    onChange={(event) =>
                      setVehicleForm((previous) => ({
                        ...previous,
                        customBrand: event.target.value,
                      }))
                    }
                  />
                ) : null}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Modelo</span>
                <input
                  className="thsj-input px-3 py-2.5"
                  placeholder="Ej: Hilux"
                  value={vehicleForm.model}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, model: event.target.value }))
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Año</span>
                <input
                  className="thsj-input px-3 py-2.5"
                  type="number"
                  min={MIN_VEHICLE_YEAR}
                  max={MAX_VEHICLE_YEAR}
                  value={vehicleForm.year}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, year: event.target.value }))
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Kilometros</span>
                <input
                  className="thsj-input px-3 py-2.5"
                  type="number"
                  min="0"
                  step="1"
                  value={vehicleForm.mileage}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, mileage: event.target.value }))
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Combustible</span>
                <select
                  className="thsj-input px-3 py-2.5"
                  value={vehicleForm.fuelType}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, fuelType: event.target.value }))
                  }
                >
                  <option value="" disabled>
                    Selecciona combustible
                  </option>
                  {VEHICLE_FUEL_OPTIONS.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Transmision</span>
                <select
                  className="thsj-input px-3 py-2.5"
                  value={vehicleForm.transmission}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({
                      ...previous,
                      transmission: event.target.value,
                    }))
                  }
                >
                  <option value="" disabled>
                    Selecciona transmision
                  </option>
                  {VEHICLE_TRANSMISSION_OPTIONS.map((transmission) => (
                    <option key={transmission} value={transmission}>
                      {transmission}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Estado</span>
                <select
                  className="thsj-input px-3 py-2.5"
                  value={vehicleForm.condition}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, condition: event.target.value }))
                  }
                >
                  <option value="" disabled>
                    Selecciona estado
                  </option>
                  {VEHICLE_CONDITION_OPTIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Primera mano</span>
                <select
                  className="thsj-input px-3 py-2.5"
                  value={vehicleForm.firstOwner}
                  onChange={(event) =>
                    setVehicleForm((previous) => ({ ...previous, firstOwner: event.target.value }))
                  }
                >
                  <option value="" disabled>
                    Selecciona una opcion
                  </option>
                  {VEHICLE_FIRST_OWNER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

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

        <div className="rounded-2xl border border-(--line) bg-(--background-muted) p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">Ubicacion</h2>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Departamento</span>
              <select
                className="thsj-input px-3 py-2.5"
                value={form.locationDepartment}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, locationDepartment: event.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Selecciona un departamento
                </option>
                {SAN_JUAN_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Link de Google Maps (opcional)</span>
              <input
                className="thsj-input px-3 py-2.5"
                type="text"
                value={form.locationMapsUrl}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, locationMapsUrl: event.target.value }))
                }
                placeholder="https://maps.google.com/... o https://maps.app.goo.gl/..."
              />
              <span className="text-xs text-(--foreground-muted)">
                Si lo completas, debe ser un enlace valido de Google Maps.
              </span>
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {mode === 'create' ? 'Imagenes' : 'Imagenes'}
          </span>
          <input
            ref={imageInputRef}
            className="thsj-input px-3 py-2.5 text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-(--brand-secondary) file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#152638]"
            type="file"
            accept="image/*"
            multiple
            disabled={processingImages || galleryItems.length >= MAX_IMAGES}
            onChange={(event) => {
              void addImageFiles(Array.from(event.target.files ?? []))
              event.currentTarget.value = ''
            }}
            required={mode === 'create' && galleryItems.length === 0}
          />

          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="url"
              className="thsj-input px-3 py-2.5"
              value={imageImportUrl}
              onChange={(event) => setImageImportUrl(event.target.value)}
              placeholder="Pegar enlace de Google Drive o imagen directa"
            />
            <button
              type="button"
              onClick={handleImportFromUrl}
              disabled={importingUrl || processingImages}
              className="thsj-btn thsj-btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importingUrl ? 'Importando...' : 'Importar enlace'}
            </button>
          </div>

          <span className="text-xs text-(--foreground-muted)">
            Google Drive: comparte el archivo con acceso publico y pega el link.
          </span>

          <span className="text-xs text-(--foreground-muted)">Limite: hasta {MAX_IMAGES} imagenes.</span>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={processingImages || galleryItems.length >= MAX_IMAGES}
              className="thsj-btn thsj-btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingImages ? 'Procesando...' : 'Agregar mas fotos'}
            </button>
          </div>

          {showVehicleSection ? (
            <div className="mt-2 rounded-xl border border-(--line) bg-(--background-muted) p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-(--foreground-muted)">
                Guia sugerida para vehiculos (estilo marketplace)
              </p>
              <p className="mt-1 text-xs text-(--foreground-muted)">
                Carga y ordena las fotos en este orden para mejorar conversion: {VEHICLE_PHOTO_ORDER.join(' - ')}.
              </p>
            </div>
          ) : null}

          {galleryItems.length > 0 ? (
            <div className="mt-3 rounded-xl border border-(--line) bg-(--background-muted) p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--foreground-muted)">
                Imagenes ({galleryItems.length}) - arrastra para reordenar
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {galleryItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-lg border border-(--line) bg-(--background-elevated)"
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={() => setDraggingImageId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropOn(item.id)}
                  >
                    <img
                      src={item.url}
                      alt={`Imagen ${index + 1}`}
                      className="h-26 w-full object-cover sm:h-30"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-2 py-1 text-xs text-white">
                      {index === 0 ? 'Principal' : `Foto ${index + 1}`}
                      {showVehicleSection && VEHICLE_PHOTO_ORDER[index] ? ` - ${VEHICLE_PHOTO_ORDER[index]}` : ''}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCropTarget({ itemId: item.id, itemUrl: item.url })}
                      className="absolute left-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--line) bg-white/95 text-xs leading-none text-(--foreground-muted) shadow-sm transition hover:bg-white hover:text-foreground"
                      aria-label={`Editar imagen ${index + 1}`}
                      title="Recortar/Reencuadrar"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(item.id)}
                      className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-(--line) bg-white/95 text-base leading-none text-(--foreground-muted) shadow-sm transition hover:bg-white hover:text-foreground"
                      aria-label={`Quitar imagen ${index + 1}`}
                    >
                      ×
                    </button>
                    {draggingImageId === item.id ? (
                      <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-(--brand-primary)" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {needsImage ? (
            <span className="text-xs text-(--foreground-muted)">Agrega al menos una imagen para publicar.</span>
          ) : null}
        </label>

        {cropTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-xl rounded-2xl border border-(--line) bg-(--background-elevated) p-4 sm:p-5">
              <p className="text-base font-semibold text-foreground">Recortar y reencuadrar imagen</p>
              <p className="mt-1 text-xs text-(--foreground-muted)">Ajusta el encuadre y zoom para mejorar la portada.</p>

              <div className="relative mt-3 h-72 overflow-hidden rounded-xl bg-black sm:h-84">
                <Cropper
                  image={cropTarget.itemUrl}
                  crop={crop}
                  zoom={cropZoom}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onZoomChange={setCropZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>

              <div className="mt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-(--foreground-muted)">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={cropZoom}
                    onChange={(event) => setCropZoom(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="thsj-btn thsj-btn-ghost"
                  onClick={() => {
                    setCropTarget(null)
                    setCrop({ x: 0, y: 0 })
                    setCropZoom(1)
                    setCroppedAreaPixels(null)
                  }}
                  disabled={applyingCrop}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="thsj-btn thsj-btn-primary"
                  onClick={() => {
                    void applyCropOnCurrentImage()
                  }}
                  disabled={applyingCrop}
                >
                  {applyingCrop ? 'Aplicando...' : 'Aplicar recorte'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
            disabled={submitting || (mode === 'edit' && !hasPendingChanges)}
          >
            {submitting ? 'Guardando...' : mode === 'edit' && !hasPendingChanges ? 'Sin cambios' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
