# Mi Profe de Mate — Tutor Matemático IA

Plataforma web educativa full-stack (**Nuxt 3 + Tailwind CSS + Prisma + Gemini Multimodal**) para estudiantes de 9 a 15 años, padres y profesores de matemáticas.

- **Producción (Vercel):** https://mi-profe-de-mate.vercel.app
- **Portal Docente:** https://mi-profe-de-mate.vercel.app/profesor/login
- **Guía de Uso / Ayuda:** https://mi-profe-de-mate.vercel.app/ayuda

## Arranque rápido en local

```bash
npm install
npm run db:setup
npm run dev
```

Abre `http://localhost:3000`.

### Cuenta de demostración (1 clic en `/login`)
- **Correo:** `familia@miprofedemate.edu`
- **Contraseña:** `Demo123*`
- **PIN Portal Padres:** `1234`

## Variables de entorno (`.env`)
- `DATABASE_URL`: `file:./dev.db` en local o cadena PostgreSQL de Supabase en producción.
- `JWT_SECRET`: clave secreta para firmar sesiones.
- `GEMINI_API_KEY`: clave de Google Gemini para Tutor Socrático real y análisis visual de fotos/PDFs de tareas (sin clave, funciona con motor pedagógico socrático integrado).
- `GEMINI_MODEL`: `gemini-2.5-flash` (por defecto).
- `DEMO_MODE`: `true` para mostrar botón de acceso demo rápido.

## Paso a producción (Supabase + Vercel)
1. Cambia `provider = "sqlite"` a `provider = "postgresql"` en `prisma/schema.prisma`.
2. Configura `DATABASE_URL` (Supabase), `JWT_SECRET` y `GEMINI_API_KEY` en Vercel.
3. Ejecuta `npx prisma db push && npm run db:seed` contra Supabase y despliega desde GitHub en Vercel.
