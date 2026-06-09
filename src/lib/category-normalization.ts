import { resolveCategorySelection } from '@/lib/hierarchical-categories'

export function normalizeCategoryValue(rawCategory: string, rawSubcategory?: string | null) {
  if (!rawCategory?.trim()) {
    return ''
  }

  return resolveCategorySelection(rawCategory, rawSubcategory).category
}

export function normalizeSubcategoryValue(rawCategory: string, rawSubcategory?: string | null) {
  if (!rawCategory?.trim()) {
    return ''
  }

  return resolveCategorySelection(rawCategory, rawSubcategory).subcategory ?? ''
}
