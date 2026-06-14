export function mapSupabaseAuthErrorMessage(rawMessage: string) {
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) {
    return 'Se alcanzo el limite temporal de envios de email. Espera unos minutos e intenta nuevamente.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Tu cuenta aun no fue confirmada. Revisa tu correo y confirma el registro antes de iniciar sesion.'
  }

  if (
    normalized.includes('confirmation link expired') ||
    normalized.includes('expired') ||
    normalized.includes('invalid or expired')
  ) {
    return 'El enlace de confirmacion expiro o ya no es valido. Reenviamos uno nuevo desde login.'
  }

  if (normalized.includes('token not found') || normalized.includes('invalid token')) {
    return 'No pudimos validar el enlace de confirmacion. Pide un nuevo correo desde login.'
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  return rawMessage
}

export function isConfirmationPendingAuthError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase()

  return normalized.includes('email not confirmed')
}
