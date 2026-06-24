export type UserProfileRow = {
  display_name: string | null
  first_name: string | null
  last_name: string | null
  dni: string | null
  phone: string | null
  show_phone: boolean | null
  address_street: string | null
  locality: string | null
  email: string | null
  full_name: string | null
  whatsapp_number: string | null
  domicile: string | null
  recovery_email: string | null
}

export type UserProfileInput = {
  displayName?: string
  firstName?: string
  lastName?: string
  dni?: string
  phone?: string
  showPhone?: boolean
  addressStreet?: string
  locality?: string
  email?: string
  fullName?: string
  whatsappNumber?: string
  domicile?: string
  recoveryEmail?: string
}

export type UserProfileSnapshot = {
  displayName: string
  firstName: string
  lastName: string
  dni: string
  phone: string
  showPhone: boolean
  addressStreet: string
  locality: string
  email: string
  fullName: string
  whatsappNumber: string
  domicile: string
  recoveryEmail: string
}

export function normalizeText(value: string) {
  return value.trim()
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function sanitizeWhatsAppNumber(value: string) {
  return value.replace(/\D+/g, '')
}

export function pickFirstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue
    }

    const normalized = value.trim()
    if (normalized) {
      return normalized
    }
  }

  return ''
}

export function isMissingProfileColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false
  }

  return error.code === '42703' || /column .* does not exist/i.test(error.message ?? '')
}

export function buildProfilePayload(userId: string, input: UserProfileInput) {
  const displayName = normalizeText(input.displayName ?? input.fullName ?? '')
  const firstName = normalizeText(input.firstName ?? '')
  const lastName = normalizeText(input.lastName ?? '')
  const dni = normalizeText(input.dni ?? '')
  const phone = sanitizeWhatsAppNumber(input.phone ?? input.whatsappNumber ?? '')
  const showPhone = input.showPhone ?? true
  const addressStreet = normalizeText(input.addressStreet ?? input.domicile ?? '')
  const locality = normalizeText(input.locality ?? '')
  const email = normalizeEmail(input.email ?? '')

  const fullName = normalizeText(input.fullName ?? `${firstName} ${lastName}`)
  const normalizedFullName = fullName || displayName
  const domicile = normalizeText(input.domicile ?? addressStreet)

  const payload: Record<string, unknown> = {
    user_id: userId,
    display_name: displayName,
    first_name: firstName,
    last_name: lastName,
    dni,
    phone,
    show_phone: showPhone,
    address_street: addressStreet,
    locality,
    email,
    full_name: normalizedFullName,
    whatsapp_number: phone,
    domicile,
  }

  if (typeof input.recoveryEmail === 'string') {
    payload.recovery_email = normalizeEmail(input.recoveryEmail)
  }

  return payload
}

export function buildMinimalProfilePayload(userId: string, fullName: string) {
  return {
    user_id: userId,
    display_name: normalizeText(fullName),
  }
}

export function resolveProfileSnapshot(args: {
  profile?: Partial<UserProfileRow> | null
  metadata?: Record<string, unknown> | null
  fallbackEmail?: string | null
}): UserProfileSnapshot {
  const metadata = args.metadata ?? {}
  const fallbackEmail = args.fallbackEmail?.trim() ?? ''
  const fallbackName = fallbackEmail.split('@')[0]

  const displayName = pickFirstText(
    args.profile?.display_name,
    metadata.display_name as string | undefined,
    args.profile?.full_name,
    metadata.full_name as string | undefined,
    fallbackName
  )

  const firstName = pickFirstText(
    args.profile?.first_name,
    metadata.first_name as string | undefined
  )

  const lastName = pickFirstText(
    args.profile?.last_name,
    metadata.last_name as string | undefined
  )

  const fullName = pickFirstText(
    args.profile?.full_name,
    metadata.full_name as string | undefined,
    `${firstName} ${lastName}`,
    displayName,
    fallbackName
  )

  const phone = pickFirstText(
    args.profile?.phone,
    metadata.phone as string | undefined,
    args.profile?.whatsapp_number,
    metadata.whatsapp_number as string | undefined
  )

  const addressStreet = pickFirstText(
    args.profile?.address_street,
    metadata.address_street as string | undefined,
    args.profile?.domicile,
    metadata.domicile as string | undefined
  )

  const locality = pickFirstText(
    args.profile?.locality,
    metadata.locality as string | undefined
  )

  const email = pickFirstText(
    args.profile?.email,
    metadata.email as string | undefined,
    fallbackEmail
  )

  const recoveryEmail = pickFirstText(
    args.profile?.recovery_email,
    metadata.recovery_email as string | undefined,
    email
  )

  const showPhoneMetadata = metadata.show_phone
  const showPhone =
    typeof args.profile?.show_phone === 'boolean'
      ? args.profile.show_phone
      : typeof showPhoneMetadata === 'boolean'
        ? showPhoneMetadata
        : showPhoneMetadata === 'true'
          ? true
          : showPhoneMetadata === 'false'
            ? false
            : true

  return {
    displayName,
    firstName,
    lastName,
    dni: pickFirstText(args.profile?.dni, metadata.dni as string | undefined),
    phone,
    showPhone,
    addressStreet,
    locality,
    email,
    fullName,
    whatsappNumber: phone,
    domicile: addressStreet,
    recoveryEmail,
  }
}
