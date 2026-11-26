export type ErrorTag =
  | 'signos'
  | 'operaciones_basicas'
  | 'fracciones'
  | 'despeje'
  | 'distribucion'
  | 'igualdad'
  | 'orden_operaciones'
  | 'lectura'
  | 'otro'

export const ERROR_TAG_LABELS: Record<ErrorTag, string> = {
  signos: 'Manejo de signos (+ / −)',
  operaciones_basicas: 'Cálculo y operaciones básicas',
  fracciones: 'Fracciones y simplificación',
  despeje: 'Despeje de incógnitas',
  distribucion: 'Propiedad distributiva y paréntesis',
  igualdad: 'Equilibrio de la igualdad',
  orden_operaciones: 'Orden de operaciones (jerarquía)',
  lectura: 'Comprensión del enunciado',
  otro: 'Revisión de procedimiento'
}

export function detectErrorTag(opts: {
  studentAnswer: string
  expectedAnswer: string
  enunciado: string
  tema: string
}): ErrorTag {
  const user = opts.studentAnswer.trim().replace(/,/g, '.').replace(/^[a-z]\s*=\s*/i, '')
  const exp = opts.expectedAnswer.trim().replace(/,/g, '.')
  const text = `${opts.enunciado} ${opts.tema}`.toLowerCase()

  if (!user) return 'lectura'

  const uNum = Number(user)
  const eNum = Number(exp)
  if (!Number.isNaN(uNum) && !Number.isNaN(eNum)) {
    if (Math.abs(uNum) === Math.abs(eNum) && uNum !== eNum) {
      return 'signos'
    }
  }

  if (text.includes('signo') || text.includes('(-') || text.includes('- (')) {
    return 'signos'
  }
  if (exp.includes('/') || user.includes('/') || text.includes('fracc')) {
    return 'fracciones'
  }
  if (text.includes('distribu') || (text.includes('(') && text.includes('x'))) {
    return 'distribucion'
  }
  if (text.includes('orden') || (text.includes('×') && text.includes('+'))) {
    return 'orden_operaciones'
  }
  if (text.includes('=') || text.includes('despej') || text.includes('ecuac')) {
    return 'despeje'
  }
  if (!Number.isNaN(uNum) && !Number.isNaN(eNum)) {
    return 'operaciones_basicas'
  }
  return 'otro'
}
