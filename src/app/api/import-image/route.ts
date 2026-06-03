import { NextResponse } from 'next/server'

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024

function extractGoogleDriveFileId(value: URL) {
  const pathMatch = value.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (pathMatch?.[1]) {
    return pathMatch[1]
  }

  const idFromQuery = value.searchParams.get('id')
  if (idFromQuery) {
    return idFromQuery
  }

  return null
}

function normalizeImportUrl(rawUrl: string) {
  const parsed = new URL(rawUrl)

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Solo se permiten enlaces http o https.')
  }

  if (parsed.hostname === 'drive.google.com') {
    const fileId = extractGoogleDriveFileId(parsed)
    if (!fileId) {
      throw new Error('No se pudo detectar el archivo de Google Drive en ese enlace.')
    }

    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }

  return parsed.toString()
}

function inferFileName(sourceUrl: string, contentType: string | null) {
  const parsed = new URL(sourceUrl)
  const fromPath = parsed.pathname.split('/').filter(Boolean).pop()

  if (fromPath && fromPath.includes('.')) {
    return decodeURIComponent(fromPath)
  }

  if (contentType?.includes('png')) return `importada-${Date.now()}.png`
  if (contentType?.includes('webp')) return `importada-${Date.now()}.webp`
  if (contentType?.includes('gif')) return `importada-${Date.now()}.gif`

  return `importada-${Date.now()}.jpg`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string }
    const url = body.url?.trim()

    if (!url) {
      return NextResponse.json({ error: 'Debes indicar una URL.' }, { status: 400 })
    }

    const normalizedUrl = normalizeImportUrl(url)
    const response = await fetch(normalizedUrl, { redirect: 'follow' })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'No se pudo descargar la imagen desde ese enlace.' },
        { status: 400 }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El enlace no apunta a una imagen valida o no es publico.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera el limite de 15MB.' },
        { status: 400 }
      )
    }

    const fileName = inferFileName(normalizedUrl, contentType)

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'x-file-name': fileName,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo importar la imagen. Verifica que el enlace sea publico.' },
      { status: 400 }
    )
  }
}
