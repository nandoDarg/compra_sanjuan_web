type MaybePostgrestError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

export function isMissingSubcategoryColumnError(error: MaybePostgrestError | null | undefined) {
  if (!error) {
    return false
  }

  const combinedText = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  return combinedText.includes('subcategory') && combinedText.includes('column')
}
