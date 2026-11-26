import { prisma } from '~/server/utils/prisma'
import { requireAlumnoActivo } from '~/server/utils/auth'
import { generateSeccCertificatePdf } from '~/server/utils/seccPdf'

export default defineEventHandler(async (event) => {
  const { padre, alumno } = await requireAlumnoActivo(event)
  const competenciaId = getRouterParam(event, 'competenciaId')
  if (!competenciaId) {
    throw createError({ statusCode: 400, statusMessage: 'Competencia no especificada.' })
  }

  const comp = await prisma.competenciaCCA.findFirst({
    where: { id: competenciaId, alumnoId: alumno.id }
  })
  if (!comp) {
    throw createError({ statusCode: 404, statusMessage: 'Competencia no encontrada.' })
  }
  if (!comp.certificada) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Esta competencia aún no cumple el criterio SECC (3 sesiones >= 90% sin pistas).'
    })
  }

  const erroresSuperados = await prisma.errorFrecuenteCCA.findMany({
    where: { alumnoId: alumno.id, tema: comp.tema, superado: true }
  })

  const pdfBytes = await generateSeccCertificatePdf({
    alumnoNombre: alumno.nombre,
    grado: alumno.grado,
    pais: padre.pais,
    padreNombre: padre.nombre,
    codigoCompetencia: comp.codigo,
    tema: comp.tema,
    nivelDominio: comp.nivelDominio,
    sesionesExitosas: comp.sesionesExitosasSinAyuda,
    motoresUsados: JSON.parse(comp.motoresUsadosJson || '[]'),
    erroresSuperados: erroresSuperados.map((e) => e.errorTag),
    fechaCertificacion: comp.certificadaEn || new Date()
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="certificado-secc-${comp.codigo}.pdf"`)
  return Buffer.from(pdfBytes)
})
