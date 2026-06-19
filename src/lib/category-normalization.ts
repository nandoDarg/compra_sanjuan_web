import { resolveCategorySelection } from '@/lib/hierarchical-categories'

export function normalizeCategoryValue(
  rawCategory: string,
  rawSubcategory?: string | null,
  rawTertiarySubcategory?: string | null
) {
  if (!rawCategory?.trim()) {
    return ''
  }

  return resolveCategorySelection(rawCategory, rawSubcategory, rawTertiarySubcategory).category
}

export function normalizeSubcategoryValue(
  rawCategory: string,
  rawSubcategory?: string | null,
  rawTertiarySubcategory?: string | null
) {
  if (!rawCategory?.trim()) {
    return ''
  }

  return resolveCategorySelection(rawCategory, rawSubcategory, rawTertiarySubcategory).subcategory ?? ''
}

export function normalizeTertiarySubcategoryValue(
  rawCategory: string,
  rawSubcategory?: string | null,
  rawTertiarySubcategory?: string | null
) {
  if (!rawCategory?.trim()) {
    return ''
  }

  return resolveCategorySelection(rawCategory, rawSubcategory, rawTertiarySubcategory).tertiarySubcategory ?? ''
}
