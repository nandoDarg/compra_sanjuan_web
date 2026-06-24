export const SAN_JUAN_DEPARTMENTS = [
  'Capital',
  'Chimbas',
  'Rawson',
  'Rivadavia',
  'Santa Lucía',
  'Pocito',
  'Zonda',
  'Ullum',
  'Albardón',
  'Angaco',
  'San Martín',
  'Caucete',
  '25 de Mayo',
  'Sarmiento',
  'Valle Fértil',
  'Iglesia',
  'Jáchal',
  'Calingasta',
  '9 de Julio',
] as const

function normalizeDepartmentValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const SAN_JUAN_DEPARTMENT_LOOKUP = new Map(
  SAN_JUAN_DEPARTMENTS.map((department) => [normalizeDepartmentValue(department), department])
)

export function resolveSanJuanDepartment(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = normalizeDepartmentValue(value)
  return SAN_JUAN_DEPARTMENT_LOOKUP.get(normalized) ?? value.trim()
}
