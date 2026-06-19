export type UserProfileRow = {
  display_name: string | null
  full_name: string | null
  whatsapp_number: string | null
  domicile: string | null
  recovery_email: string | null
}

export type UserProfileInput = {
  fullName: string
  whatsappNumber: string
  domicile: string
  recoveryEmail: string
}

export type UserProfileSnapshot = {
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
  const fullName = normalizeText(input.fullName)
  const whatsappNumber = sanitizeWhatsAppNumber(input.whatsappNumber)
  const domicile = normalizeText(input.domicile)
  const recoveryEmail = normalizeEmail(input.recoveryEmail)

  return {
    user_id: userId,
    display_name: fullName,
    full_name: fullName,
    whatsapp_number: whatsappNumber,
    domicile,
    recovery_email: recoveryEmail,
  }
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

  return {
    fullName: pickFirstText(
      args.profile?.full_name,
      metadata.full_name as string | undefined,
      args.profile?.display_name,
      metadata.display_name as string | undefined,
      fallbackEmail.split('@')[0]
    ),
    whatsappNumber: pickFirstText(
      args.profile?.whatsapp_number,
      metadata.whatsapp_number as string | undefined
    ),
    domicile: pickFirstText(args.profile?.domicile, metadata.domicile as string | undefined),
    recoveryEmail: pickFirstText(
      args.profile?.recovery_email,
      metadata.recovery_email as string | undefined,
      fallbackEmail
    ),
  }
}
