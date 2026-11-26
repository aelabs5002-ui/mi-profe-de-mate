import { AVATARES_ALUMNO, CATALOGO_MOTORES, PAISES_CURRICULO, TEMAS_CURRICULARES } from '~/server/utils/curriculum'

export default defineEventHandler(() => {
  return {
    paises: PAISES_CURRICULO,
    avatares: AVATARES_ALUMNO,
    motores: CATALOGO_MOTORES,
    temas: TEMAS_CURRICULARES
  }
})
