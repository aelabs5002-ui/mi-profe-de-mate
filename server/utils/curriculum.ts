export interface EjercicioSeed {
  tema: string
  codigoCompetencia: string
  motorId: 'A' | 'C' | 'F'
  dificultad: number
  enunciado: string
  respuestaEsperada: string
  pistas: string[]
  explicacionBase: string
}

export const PAISES_CURRICULO = [
  {
    pais: 'Venezuela',
    grados: [
      '4to Grado (Primaria)',
      '5to Grado (Primaria)',
      '6to Grado (Primaria)',
      '1er Año (Secundaria)',
      '2do Año (Secundaria)',
      '3er Año (Secundaria)',
      '4to Año (Bachillerato)',
      '5to Año (Bachillerato)'
    ]
  },
  {
    pais: 'Perú',
    grados: [
      '4to Primaria',
      '5to Primaria',
      '6to Primaria',
      '1ro Secundaria',
      '2do Secundaria',
      '3ro Secundaria',
      '4to Secundaria',
      '5to Secundaria'
    ]
  },
  {
    pais: 'Colombia',
    grados: ['4° Primaria', '5° Primaria', '6° Bachillerato', '7° Bachillerato', '8° Bachillerato', '9° Bachillerato', '10° Media', '11° Media']
  },
  {
    pais: 'México',
    grados: ['4° Primaria', '5° Primaria', '6° Primaria', '1° Secundaria', '2° Secundaria', '3° Secundaria', '1° Preparatoria']
  },
  {
    pais: 'Chile',
    grados: ['4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio']
  }
]

export const AVATARES_ALUMNO = ['🦊', '🦁', '🦉', '🐼', '🚀', '⚡', '🧠', '🌟']

export const CATALOGO_MOTORES = [
  { id: 'A', nombre: 'Disparo Numérico', foco: 'Cálculo mental, múltiplos y primos', disponible: true, color: 'blue' },
  { id: 'C', nombre: 'Memory Matemático', foco: 'Equivalencias (1/2 = 0.5 = 50%)', disponible: true, color: 'emerald' },
  { id: 'F', nombre: 'Constructor de Expresiones', foco: 'Fórmulas, despeje y ecuaciones', disponible: true, color: 'violet' },
  { id: 'B', nombre: 'Plataformas de Fracciones', foco: 'Fracciones y visualización espacial', disponible: false, color: 'amber' },
  { id: 'D', nombre: 'Puzzle Lógico', foco: 'Operaciones encadenadas y patrones', disponible: false, color: 'cyan' },
  { id: 'E', nombre: 'Carreras de Cálculo', foco: 'Velocidad de cálculo mental', disponible: false, color: 'orange' },
  { id: 'G', nombre: 'Defensa de Problemas', foco: 'Comprensión lectora y problemas verbales', disponible: false, color: 'rose' },
  { id: 'H', nombre: 'Secuencias y Patrones', foco: 'Series numéricas y razonamiento lógico', disponible: false, color: 'indigo' }
] as const

export const TEMAS_CURRICULARES = [
  { codigo: 'MAT-OPB-01', tema: 'Operaciones y Cálculo Mental', motorRecomendado: 'A' as const },
  { codigo: 'MAT-FRAC-01', tema: 'Fracciones Equivalentes', motorRecomendado: 'C' as const },
  { codigo: 'MAT-SIG-01', tema: 'Números Enteros y Signos', motorRecomendado: 'A' as const },
  { codigo: 'MAT-ALG-01', tema: 'Ecuaciones Lineales', motorRecomendado: 'F' as const },
  { codigo: 'MAT-POR-01', tema: 'Porcentajes y Proporciones', motorRecomendado: 'C' as const },
  { codigo: 'MAT-GEO-01', tema: 'Perímetros y Áreas', motorRecomendado: 'F' as const }
]

export const BANCO_EJERCICIOS: EjercicioSeed[] = [
  // Operaciones y Cálculo Mental
  {
    tema: 'Operaciones y Cálculo Mental',
    codigoCompetencia: 'MAT-OPB-01',
    motorId: 'A',
    dificultad: 1,
    enunciado: 'Calcula mentalmente: 27 + 15',
    respuestaEsperada: '42',
    pistas: ['Separa en decenas y unidades: (20 + 10) + (7 + 5).', 'Suma 30 + 12 para llegar al resultado.'],
    explicacionBase: '20 + 10 = 30 y 7 + 5 = 12; al sumar ambos obtienes 42.'
  },
  {
    tema: 'Operaciones y Cálculo Mental',
    codigoCompetencia: 'MAT-OPB-01',
    motorId: 'A',
    dificultad: 2,
    enunciado: 'Resuelve respetando el orden de operaciones: 4 + 3 × 6',
    respuestaEsperada: '22',
    pistas: ['Recuerda la jerarquía: primero se multiplica y luego se suma.', 'Calcula 3 × 6 primero y después súmale 4.'],
    explicacionBase: 'Primero 3 × 6 = 18, luego 4 + 18 = 22.'
  },
  {
    tema: 'Operaciones y Cálculo Mental',
    codigoCompetencia: 'MAT-OPB-01',
    motorId: 'A',
    dificultad: 2,
    enunciado: 'Calcula: (18 - 6) ÷ 3 + 5',
    respuestaEsperada: '9',
    pistas: ['Empieza resolviendo lo que está dentro del paréntesis.', 'Divide el resultado del paréntesis entre 3 y luego suma 5.'],
    explicacionBase: '18 - 6 = 12; 12 ÷ 3 = 4; 4 + 5 = 9.'
  },
  {
    tema: 'Operaciones y Cálculo Mental',
    codigoCompetencia: 'MAT-OPB-01',
    motorId: 'A',
    dificultad: 3,
    enunciado: '¿Cuál es el valor de 2³ + 5 × 4?',
    respuestaEsperada: '28',
    pistas: ['Primero calcula la potencia 2³ (2 × 2 × 2) y la multiplicación 5 × 4.', 'Suma los dos resultados parciales.'],
    explicacionBase: '2³ = 8 y 5 × 4 = 20; 8 + 20 = 28.'
  },
  {
    tema: 'Operaciones y Cálculo Mental',
    codigoCompetencia: 'MAT-OPB-01',
    motorId: 'A',
    dificultad: 3,
    enunciado: 'Un bus escolar lleva 42 estudiantes en 3 viajes iguales. ¿Cuántos viajan en cada viaje?',
    respuestaEsperada: '14',
    pistas: ['Debes repartir 42 en 3 partes iguales.', 'Piensa: 3 × 10 = 30, ¿cuánto falta para 42?'],
    explicacionBase: '42 ÷ 3 = 14 estudiantes por viaje.'
  },

  // Fracciones Equivalentes
  {
    tema: 'Fracciones Equivalentes',
    codigoCompetencia: 'MAT-FRAC-01',
    motorId: 'C',
    dificultad: 1,
    enunciado: 'Completa el numerador para que sean equivalentes: 1/2 = ?/8',
    respuestaEsperada: '4',
    pistas: ['¿Por qué número se multiplicó el 2 para llegar a 8?', 'Multiplica el numerador (1) por ese mismo número (4).'],
    explicacionBase: '2 × 4 = 8, así que 1 × 4 = 4 (4/8).'
  },
  {
    tema: 'Fracciones Equivalentes',
    codigoCompetencia: 'MAT-FRAC-01',
    motorId: 'C',
    dificultad: 2,
    enunciado: 'Calcula y simplifica: 1/4 + 1/2',
    respuestaEsperada: '3/4',
    pistas: ['Convierte 1/2 a cuartos para tener el mismo denominador.', 'Si 1/2 = 2/4, ahora suma 1/4 + 2/4.'],
    explicacionBase: '1/2 = 2/4, entonces 1/4 + 2/4 = 3/4.'
  },
  {
    tema: 'Fracciones Equivalentes',
    codigoCompetencia: 'MAT-FRAC-01',
    motorId: 'C',
    dificultad: 2,
    enunciado: 'Simplifica a su mínima expresión la fracción 6/9',
    respuestaEsperada: '2/3',
    pistas: ['Busca un número que divida exactamente tanto a 6 como a 9.', 'Divide arriba y abajo entre 3.'],
    explicacionBase: '6 ÷ 3 = 2 y 9 ÷ 3 = 3, quedando 2/3.'
  },
  {
    tema: 'Fracciones Equivalentes',
    codigoCompetencia: 'MAT-FRAC-01',
    motorId: 'C',
    dificultad: 3,
    enunciado: 'Calcula: 5/6 - 1/3 (escribe el resultado simplificado)',
    respuestaEsperada: '1/2',
    pistas: ['Convierte 1/3 a sextos multiplicando arriba y abajo por 2.', 'Te quedará 5/6 - 2/6 = 3/6. ¿Cómo se simplifica 3/6?'],
    explicacionBase: '5/6 - 2/6 = 3/6, que al dividir entre 3 da 1/2.'
  },
  {
    tema: 'Fracciones Equivalentes',
    codigoCompetencia: 'MAT-FRAC-01',
    motorId: 'C',
    dificultad: 3,
    enunciado: '¿Qué número decimal equivale a la fracción 3/4?',
    respuestaEsperada: '0.75',
    pistas: ['Divide 3 entre 4, o recuerda cuánto es 1/4 en decimal (0.25).', 'Multiplica 0.25 por 3.'],
    explicacionBase: '3 ÷ 4 = 0.75.'
  },

  // Números Enteros y Signos
  {
    tema: 'Números Enteros y Signos',
    codigoCompetencia: 'MAT-SIG-01',
    motorId: 'A',
    dificultad: 2,
    enunciado: 'Calcula respetando los signos: -8 + 13',
    respuestaEsperada: '5',
    pistas: ['Imagina que debes 8 y pagas 13. ¿Te queda saldo positivo o negativo?', 'Resta 13 - 8 y conserva el signo del número con mayor valor absoluto.'],
    explicacionBase: '-8 + 13 = +5.'
  },
  {
    tema: 'Números Enteros y Signos',
    codigoCompetencia: 'MAT-SIG-01',
    motorId: 'A',
    dificultad: 2,
    enunciado: 'Resuelve: -7 - 5',
    respuestaEsperada: '-12',
    pistas: ['Ambos números tienen el mismo signo negativo.', 'Cuando dos números tienen el mismo signo, se suman sus valores y se mantiene el signo negativo.'],
    explicacionBase: '-7 - 5 = -12.'
  },
  {
    tema: 'Números Enteros y Signos',
    codigoCompetencia: 'MAT-SIG-01',
    motorId: 'A',
    dificultad: 2,
    enunciado: 'Calcula el producto: (-4) × (-6)',
    respuestaEsperada: '24',
    pistas: ['Revisa la ley de signos en la multiplicación: negativo por negativo.', 'Negativo × negativo da positivo; ahora multiplica 4 × 6.'],
    explicacionBase: '(-) × (-) = (+), y 4 × 6 = 24.'
  },
  {
    tema: 'Números Enteros y Signos',
    codigoCompetencia: 'MAT-SIG-01',
    motorId: 'A',
    dificultad: 3,
    enunciado: 'Calcula: 10 - (-4)',
    respuestaEsperada: '14',
    pistas: ['Restar un número negativo equivale a sumar su opuesto.', 'Transforma 10 - (-4) en 10 + 4.'],
    explicacionBase: '10 - (-4) = 10 + 4 = 14.'
  },
  {
    tema: 'Números Enteros y Signos',
    codigoCompetencia: 'MAT-SIG-01',
    motorId: 'A',
    dificultad: 3,
    enunciado: 'Resuelve: (-3) × 5 + 9',
    respuestaEsperada: '-6',
    pistas: ['Multiplica primero (-3) × 5. Recuerda el signo del resultado.', 'A -15 súmale 9. ¿Cuál número tiene mayor valor absoluto?'],
    explicacionBase: '(-3) × 5 = -15; -15 + 9 = -6.'
  },

  // Ecuaciones Lineales
  {
    tema: 'Ecuaciones Lineales',
    codigoCompetencia: 'MAT-ALG-01',
    motorId: 'F',
    dificultad: 1,
    enunciado: 'Despeja x en la ecuación: x + 7 = 15',
    respuestaEsperada: '8',
    pistas: ['Para dejar sola la x, el +7 pasa al otro lado haciendo la operación contraria.', 'Calcula 15 - 7.'],
    explicacionBase: 'x = 15 - 7 = 8.'
  },
  {
    tema: 'Ecuaciones Lineales',
    codigoCompetencia: 'MAT-ALG-01',
    motorId: 'F',
    dificultad: 2,
    enunciado: 'Encuentra el valor de x: 2x + 5 = 17',
    respuestaEsperada: '6',
    pistas: ['Primero resta 5 a ambos lados para dejar 2x solo.', 'Te queda 2x = 12. ¿Qué número multiplicado por 2 da 12?'],
    explicacionBase: '2x = 17 - 5 = 12 → x = 12 ÷ 2 = 6.'
  },
  {
    tema: 'Ecuaciones Lineales',
    codigoCompetencia: 'MAT-ALG-01',
    motorId: 'F',
    dificultad: 2,
    enunciado: 'Resuelve para x: 3x - 4 = 11',
    respuestaEsperada: '5',
    pistas: ['El -4 pasa al otro lado sumando: 3x = 11 + 4.', 'Divide 15 entre 3 para hallar x.'],
    explicacionBase: '3x = 15 → x = 5.'
  },
  {
    tema: 'Ecuaciones Lineales',
    codigoCompetencia: 'MAT-ALG-01',
    motorId: 'F',
    dificultad: 3,
    enunciado: 'Resuelve aplicando propiedad distributiva: 2(x + 3) = 16',
    respuestaEsperada: '5',
    pistas: ['Puedes dividir ambos lados entre 2 (x + 3 = 8) o distribuir: 2x + 6 = 16.', 'Ahora despeja x restando 3 a 8 (o 6 a 16 y dividiendo entre 2).'],
    explicacionBase: 'x + 3 = 8 → x = 5.'
  },
  {
    tema: 'Ecuaciones Lineales',
    codigoCompetencia: 'MAT-ALG-01',
    motorId: 'F',
    dificultad: 3,
    enunciado: 'Encuentra el valor de x: 4x - 2 = 2x + 10',
    respuestaEsperada: '6',
    pistas: ['Agrupa las x de un lado (4x - 2x) y los números del otro (10 + 2).', 'Te queda 2x = 12. ¿Cuánto vale x?'],
    explicacionBase: '2x = 12 → x = 6.'
  },

  // Porcentajes y Proporciones
  {
    tema: 'Porcentajes y Proporciones',
    codigoCompetencia: 'MAT-POR-01',
    motorId: 'C',
    dificultad: 2,
    enunciado: '¿Cuánto es el 25% de 80?',
    respuestaEsperada: '20',
    pistas: ['Recuerda que 25% equivale a 1/4 (la cuarta parte).', 'Divide 80 entre 4.'],
    explicacionBase: '80 ÷ 4 = 20.'
  },
  {
    tema: 'Porcentajes y Proporciones',
    codigoCompetencia: 'MAT-POR-01',
    motorId: 'C',
    dificultad: 2,
    enunciado: 'Un cuaderno cuesta $20 y tiene 10% de descuento. ¿Cuánto cuesta con descuento?',
    respuestaEsperada: '18',
    pistas: ['Calcula primero cuánto es el 10% de 20.', 'Resta ese descuento ($2) al precio original ($20).'],
    explicacionBase: '10% de 20 es 2; 20 - 2 = 18.'
  },
  {
    tema: 'Porcentajes y Proporciones',
    codigoCompetencia: 'MAT-POR-01',
    motorId: 'C',
    dificultad: 3,
    enunciado: 'Si 3 lápices cuestan 15 Bs., ¿cuánto cuestan 7 lápices al mismo precio?',
    respuestaEsperada: '35',
    pistas: ['Encuentra primero el precio de 1 solo lápiz dividiendo 15 ÷ 3.', 'Multiplica el precio unitario (5) por 7.'],
    explicacionBase: '1 lápiz = 5 Bs., 7 × 5 = 35 Bs.'
  },

  // Perímetros y Áreas
  {
    tema: 'Perímetros y Áreas',
    codigoCompetencia: 'MAT-GEO-01',
    motorId: 'F',
    dificultad: 2,
    enunciado: 'Un rectángulo mide 8 cm de base y 5 cm de altura. ¿Cuál es su área (en cm²)?',
    respuestaEsperada: '40',
    pistas: ['El área de un rectángulo se calcula multiplicando base × altura.', 'Multiplica 8 × 5.'],
    explicacionBase: 'Área = 8 × 5 = 40 cm².'
  },
  {
    tema: 'Perímetros y Áreas',
    codigoCompetencia: 'MAT-GEO-01',
    motorId: 'F',
    dificultad: 2,
    enunciado: 'Un triángulo tiene base 10 cm y altura 6 cm. ¿Cuál es su área (en cm²)?',
    respuestaEsperada: '30',
    pistas: ['La fórmula del área del triángulo es (base × altura) ÷ 2.', 'Multiplica 10 × 6 y luego divide entre 2.'],
    explicacionBase: '(10 × 6) ÷ 2 = 30 cm².'
  },
  {
    tema: 'Perímetros y Áreas',
    codigoCompetencia: 'MAT-GEO-01',
    motorId: 'F',
    dificultad: 3,
    enunciado: 'El perímetro de un cuadrado es 36 cm. ¿Cuánto mide cada lado (en cm)?',
    respuestaEsperada: '9',
    pistas: ['Un cuadrado tiene 4 lados iguales.', 'Divide el perímetro total (36) entre 4.'],
    explicacionBase: '36 ÷ 4 = 9 cm.'
  }
]

/**
 * Compara respuestas matemáticas aceptando equivalencias comunes:
 * - "x = 6", "x=6", "6", "+6", "6.0"
 * - "0,75" y "0.75" y "3/4"
 * - "2/4" y "1/2"
 */
export function evaluateMathAnswer(studentRaw: string, expectedRaw: string): boolean {
  const clean = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/,/g, '.')
      .replace(/\s+/g, '')
      .replace(/^[a-z]=/, '') // "x=6" -> "6"
      .replace(/^\+/, '')
      .replace(/(cm2|cm²|bs\.?|\$|%)$/i, '')

  const a = clean(studentRaw)
  const b = clean(expectedRaw)
  if (!a || !b) return false
  if (a === b) return true

  const toNumeric = (expr: string): number | null => {
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr)
    const frac = expr.match(/^(-?\d+)\/(-?\d+)$/)
    if (frac) {
      const den = Number(frac[2])
      if (den !== 0) return Number(frac[1]) / den
    }
    return null
  }

  const na = toNumeric(a)
  const nb = toNumeric(b)
  if (na !== null && nb !== null) {
    return Math.abs(na - nb) < 1e-4
  }

  return false
}

export function getCompetenciaForTopic(tema: string) {
  const lower = tema.toLowerCase()
  if (lower.includes('fracc')) return TEMAS_CURRICULARES[1]
  if (lower.includes('signo') || lower.includes('entero')) return TEMAS_CURRICULARES[2]
  if (lower.includes('ecuac') || lower.includes('álge') || lower.includes('alge') || lower.includes('despej')) {
    return TEMAS_CURRICULARES[3]
  }
  if (lower.includes('porcent') || lower.includes('proporc')) return TEMAS_CURRICULARES[4]
  if (lower.includes('geomet') || lower.includes('área') || lower.includes('area') || lower.includes('perím')) {
    return TEMAS_CURRICULARES[5]
  }
  return TEMAS_CURRICULARES[0]
}
