import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function ascii(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function generateSeccCertificatePdf(params: {
  alumnoNombre: string
  grado: string
  pais: string
  padreNombre: string
  codigoCompetencia: string
  tema: string
  nivelDominio: number
  sesionesExitosas: number
  motoresUsados: string[]
  erroresSuperados: string[]
  fechaCertificacion: Date
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([842, 595]) // A4 Horizontal
  const { width, height } = page.getSize()

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  // Fondo y marco diplomático
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.97, 0.98, 1) })
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.145, 0.388, 0.922),
    borderWidth: 3,
    color: rgb(1, 1, 1)
  })
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: rgb(0.063, 0.725, 0.506),
    borderWidth: 1
  })

  // Banda superior azul
  page.drawRectangle({ x: 40, y: height - 122, width: width - 80, height: 82, color: rgb(0.145, 0.388, 0.922) })

  page.drawText('MI PROFE DE MATE — SISTEMA SECC', {
    x: 70,
    y: height - 78,
    size: 13,
    font: bold,
    color: rgb(0.85, 0.92, 1)
  })
  page.drawText('CERTIFICADO OFICIAL DE DOMINIO DE COMPETENCIA', {
    x: 70,
    y: height - 104,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1)
  })

  // Cuerpo central
  page.drawText('Se certifica que el estudiante:', {
    x: 70,
    y: height - 175,
    size: 13,
    font: regular,
    color: rgb(0.35, 0.4, 0.48)
  })

  page.drawText(ascii(params.alumnoNombre.toUpperCase()), {
    x: 70,
    y: height - 215,
    size: 28,
    font: bold,
    color: rgb(0.06, 0.09, 0.16)
  })

  page.drawText(ascii(`${params.grado} · Curriculo ${params.pais}`), {
    x: 70,
    y: height - 242,
    size: 12,
    font: regular,
    color: rgb(0.35, 0.4, 0.48)
  })

  page.drawText('Ha demostrado dominio verificado de la competencia matematica:', {
    x: 70,
    y: height - 285,
    size: 13,
    font: regular,
    color: rgb(0.2, 0.25, 0.33)
  })

  page.drawRectangle({
    x: 70,
    y: height - 352,
    width: width - 140,
    height: 54,
    color: rgb(0.93, 0.99, 0.96),
    borderColor: rgb(0.063, 0.725, 0.506),
    borderWidth: 1.5
  })

  page.drawText(ascii(`${params.codigoCompetencia} — ${params.tema}`), {
    x: 88,
    y: height - 331,
    size: 17,
    font: bold,
    color: rgb(0.02, 0.47, 0.34)
  })

  // Métricas SECC
  const rows: Array<[string, string]> = [
    ['Precision alcanzada en CCA:', `${params.nivelDominio}% de dominio comprobado`],
    ['Criterio SECC cumplido:', `${params.sesionesExitosas} sesiones >= 90% en dificultad media+ sin pistas`],
    ['Motores cognitivos usados:', params.motoresUsados.length ? params.motoresUsados.map((m) => `Motor ${m}`).join(', ') : 'Motor F'],
    ['Errores superados:', params.erroresSuperados.length ? params.erroresSuperados.join(', ') : 'Sin errores pendientes'],
    ['Representante:', params.padreNombre],
    ['Fecha de certificacion:', params.fechaCertificacion.toISOString().slice(0, 10)]
  ]

  let y = height - 390
  for (const [label, value] of rows) {
    page.drawText(ascii(label), { x: 70, y, size: 11, font: bold, color: rgb(0.15, 0.2, 0.28) })
    page.drawText(ascii(value), { x: 265, y, size: 11, font: regular, color: rgb(0.25, 0.3, 0.38) })
    y -= 22
  }

  // Pie de página
  page.drawText(
    'Evidencia emitida automaticamente por la Carta Cognitiva del Alumno (CCA) — Mi Profe de Mate.',
    {
      x: 70,
      y: 58,
      size: 9.5,
      font: regular,
      color: rgb(0.45, 0.5, 0.58)
    }
  )

  return await pdf.save()
}

export async function generateParentWeeklyPdf(params: {
  padreNombre: string
  pais: string
  alumnoNombre: string
  grado: string
  nivel: number
  xp: number
  racha: number
  competencias: Array<{ tema: string; nivelDominio: number; certificada: boolean }>
  erroresActivos: Array<{ tema: string; errorTag: string; conteo: number }>
  misionesCompletadas: number
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const { width, height } = page.getSize()

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: rgb(0.145, 0.388, 0.922) })
  page.drawText('MI PROFE DE MATE — REPORTE PARA PADRES', {
    x: 42,
    y: height - 48,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1)
  })
  page.drawText(ascii(`Estudiante: ${params.alumnoNombre} (${params.grado}) · ${params.pais}`), {
    x: 42,
    y: height - 74,
    size: 11,
    font: regular,
    color: rgb(0.88, 0.94, 1)
  })
  page.drawText(ascii(`Representante: ${params.padreNombre} · Emitido: ${new Date().toISOString().slice(0, 10)}`), {
    x: 42,
    y: height - 92,
    size: 10,
    font: regular,
    color: rgb(0.88, 0.94, 1)
  })

  let y = height - 148
  page.drawText('RESUMEN DE ACTIVIDAD', { x: 42, y, size: 12, font: bold, color: rgb(0.145, 0.388, 0.922) })
  y -= 24
  const resumen = [
    `Nivel actual: Nivel ${params.nivel} (${params.xp} XP acumulados)`,
    `Racha activa: ${params.racha} dias consecutivos`,
    `Misiones completadas: ${params.misionesCompletadas}`
  ]
  for (const line of resumen) {
    page.drawText(ascii(line), { x: 42, y, size: 11, font: regular, color: rgb(0.1, 0.14, 0.2) })
    y -= 18
  }

  y -= 14
  page.drawText('CARTA COGNITIVA DEL ALUMNO (COMPETENCIAS)', {
    x: 42,
    y,
    size: 12,
    font: bold,
    color: rgb(0.145, 0.388, 0.922)
  })
  y -= 22
  for (const c of params.competencias.slice(0, 10)) {
    const estado = c.certificada ? '[CERTIFICADA SECC]' : 'En progreso'
    page.drawText(ascii(`- ${c.tema}: ${c.nivelDominio}% dominio ${estado}`), {
      x: 48,
      y,
      size: 10.5,
      font: regular,
      color: rgb(0.15, 0.2, 0.28)
    })
    y -= 18
  }

  y -= 14
  page.drawText('FOCOS DE REFUERZO RECOMENDADOS', {
    x: 42,
    y,
    size: 12,
    font: bold,
    color: rgb(0.75, 0.25, 0.15)
  })
  y -= 22
  if (params.erroresActivos.length === 0) {
    page.drawText('Sin errores frecuentes activos. Excelente avance!', {
      x: 48,
      y,
      size: 10.5,
      font: regular,
      color: rgb(0.05, 0.5, 0.3)
    })
  } else {
    for (const e of params.erroresActivos.slice(0, 8)) {
      page.drawText(ascii(`- ${e.tema}: foco en ${e.errorTag} (${e.conteo} incidencias recientes)`), {
        x: 48,
        y,
        size: 10.5,
        font: regular,
        color: rgb(0.2, 0.2, 0.25)
      })
      y -= 18
    }
  }

  return await pdf.save()
}
