# Mi Profe de Mate — Contexto Oficial del Proyecto

## Visión
Plataforma educativa de tutoría matemática con IA socrática para estudiantes de **9 a 15 años** (Primaria alta y 1.º a 5.º año de Secundaria/Bachillerato), con **currículo multi-país configurable** (Venezuela por defecto + Perú, Colombia, México, Chile).

## Pilares Pedagógicos (Constitución Pedagógica)
1. **El error es útil y parte del aprendizaje** (*"🧠 El error es útil para aprender"*).
2. **Prohibido entregar respuestas directas** (Reglas P01 + P07): el Tutor IA guía paso a paso en máximo 3 ideas cortas y termina con una acción concreta.
3. **Carta Cognitiva del Alumno (CCA):** expediente académico vivo en base de datos con competencias, nivel de dominio (0–100%), errores frecuentes y superados, racha y XP.
4. **MMCG (Motor de Misiones Cognitivas Generativas):** genera misiones personalizadas a partir de tareas subidas (foto/PDF con Gemini Vision), errores de la CCA y la Biblioteca del Padre (`PARENT_LIBRARY_FIRST`).
5. **Motores de Juego Cognitivos (Catálogo A–H):** instrumentos pedagógicos interactivos (MVP incluye Motor A Disparo Numérico, Motor C Memory Matemático y Motor F Constructor de Expresiones, con interfaz modular para B, D, E, G y H).
6. **SECC (Sistema de Evidencia y Certificación de Competencias):** valida dominio real (`90%+` de aciertos en 3 sesiones de dificultad media+ sin ayuda) y emite **Certificados Oficiales en PDF**.

## Arquitectura Unificada
- **Full-Stack:** Nuxt 3 (Vue 3 + TypeScript) + Tailwind CSS (diseño luminoso, moderno y amigable tipo Duolingo/Khan Academy).
- **Base de Datos:** Prisma ORM (SQLite en desarrollo local, 1 cambio de línea a PostgreSQL/Supabase para producción).
- **IA Multimodal:** Gemini Flash para Tutor Socrático estructurado y lectura real de fotos/PDFs de tareas.
- **PDFs:** `pdf-lib` para Certificados SECC e Informes Semanales para Padres.
- **Despliegue:** GitHub + Vercel (un solo repositorio, cero Docker/Nginx).
