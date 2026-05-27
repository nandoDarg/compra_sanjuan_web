const PUBLIC_IMAGE_PREFIX = '/storage/v1/object/public/post-images/'

export function getPostImagePathFromPublicUrl(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null
  }

  const markerIndex = imageUrl.indexOf(PUBLIC_IMAGE_PREFIX)

  if (markerIndex === -1) {
    return null
  }

  const encodedPath = imageUrl.slice(markerIndex + PUBLIC_IMAGE_PREFIX.length)

  if (!encodedPath) {
    return null
  }

  return decodeURIComponent(encodedPath)
}
