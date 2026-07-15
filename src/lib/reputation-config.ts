/**
 * Configuracion del sistema de reputacion bidireccional. Fuente unica de
 * verdad para los tiempos de confirmacion/expiracion y para los nombres de
 * los aspectos de calificacion (la base solo guarda 3 valores numericos
 * genericos por fila -- ver docs/sql/20260715_operations_reputation.sql).
 */

/** Dias desde el contacto a partir de los cuales se puede pedir confirmacion. */
export const CONFIRMATION_ASK_AFTER_DAYS = 5

/**
 * Dias desde el contacto tras los cuales una operacion sin resolver expira
 * automaticamente (debe coincidir con el intervalo usado en
 * expire_stale_operations() del lado de la base).
 */
export const OPERATION_EXPIRATION_DAYS = 15

export type OperationRole = 'buyer_to_seller' | 'seller_to_buyer'

export type RatingAspectLabels = {
  overall: string
  communication: string
  two: string
  three: string
  comment: string
  question: string
}

export const RATING_ASPECT_LABELS: Record<OperationRole, RatingAspectLabels> = {
  buyer_to_seller: {
    overall: 'Calificacion general del vendedor',
    communication: 'Comunicacion',
    two: 'Cumplimiento',
    three: 'Estado del producto respecto de la publicacion',
    comment: 'Comentario (opcional)',
    question: '¿Pudiste concretar la compra de este producto?',
  },
  seller_to_buyer: {
    overall: 'Calificacion general del comprador',
    communication: 'Comunicacion',
    two: 'Seriedad',
    three: 'Cumplimiento del acuerdo',
    comment: 'Comentario (opcional)',
    question: '¿Pudiste vender este producto?',
  },
}

export function getOperationRole(isBuyer: boolean): OperationRole {
  return isBuyer ? 'buyer_to_seller' : 'seller_to_buyer'
}
