import { isVehicleRootCategory } from '@/lib/hierarchical-categories'

export const VEHICLE_BRAND_OPTIONS = [
  'Toyota',
  'Ford',
  'Volkswagen',
  'Chevrolet',
  'Fiat',
  'Renault',
  'Peugeot',
  'Citroen',
  'Honda',
  'Nissan',
  'Jeep',
  'Mercedes-Benz',
  'BMW',
  'Audi',
  'Otra',
] as const

export const VEHICLE_FUEL_OPTIONS = [
  'Nafta',
  'Diesel',
  'GNC',
  'Nafta + GNC',
  'Hibrido',
  'Electrico',
] as const

export const VEHICLE_TRANSMISSION_OPTIONS = ['Manual', 'Automatica', 'CVT'] as const

export const VEHICLE_CONDITION_OPTIONS = [
  'Excelente',
  'Muy bueno',
  'Bueno',
  'A reparar',
] as const

export const VEHICLE_FIRST_OWNER_OPTIONS = ['Si', 'No'] as const

export function isVehicleCategory(category: string) {
  return isVehicleRootCategory(category)
}

export function getVehicleYearRange() {
  const currentYear = new Date().getFullYear()

  return {
    min: 1950,
    max: currentYear + 1,
  }
}

export type VehicleDetailsInput = {
  brand: string
  model: string
  year: number
  mileage: number
  fuel_type: string
  transmission: string
  condition: string
  first_owner: boolean
}
