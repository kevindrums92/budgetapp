---
description: Stagea el cambio actual, actualiza CHANGELOG.md solo en [unreleased], commitea con nuestro estilo y hace push.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Bash(git diff --staged:*), Bash(git restore:*), Bash(git log:*), Bash(git grep:*)
argument-hint: [nota-opcional: 1 linea con lo que se hizo]
---

# /ship

## Contexto
Rama: !`git rev-parse --abbrev-ref HEAD`
Status: !`git status --porcelain`
Cambios: !`git diff --name-only`

## Objetivo
1) Subir el cambio actual al repo: stage -> commit -> push.
2) Actualizar `CHANGELOG.md` (raíz) **SOLO** en la sección:
   `## [unreleased] - {relase date}`
   - Agregar bullets claros de lo cambiado (si hay $ARGUMENTS úsalo como seed).
   - Mantener el formato y estilo actual del changelog.
   - NO tocar otras secciones/versiones.

## Reglas
- Si no hay cambios (`git status` vacío), detente y dilo.
- El commit debe incluir: (a) el cambio real y (b) `CHANGELOG.md`.
- Antes de commitear: mostrar `git diff --staged`.
- Evitar secretos: no stagear `.env*`, `*.pem`, `*.key`, `*serviceAccount*`, `supabase*.json`.

## Estilo de commit (como el repo)
- Formato: `type(scope opcional): mensaje`
- types: `feat | fix | refactor | chore | docs | test`
- scope opcional (ej): `ui | transactions | recurring | sync | auth | db`
- Mensaje corto, en inglés como vienes usándolo (ej: "bump version...", "implement ...", "simplify ...").

---

## Paso A — Entender el cambio
1) Revisa diff para resumir el cambio:
   - !`git diff`

2) Si $ARGUMENTS viene, úsalo como resumen humano; si no, deriva 1 frase.

---

## Paso B — Actualizar CHANGELOG.md (solo [unreleased])
1) Abre `CHANGELOG.md` y busca exactamente el heading:
   - `## [unreleased] - {relase date}`

2) Agrega 2–6 bullets nuevos describiendo el cambio.
   - Preferir verbos en imperativo (“add…”, “fix…”, “refactor…”, “improve…”).
   - Mantener el estilo de bullets ya usado en el archivo.
   - NO cambies el heading ni arregles el typo a menos que el cambio del PR sea precisamente sobre eso.

---

## Paso C — Stage seguro (incluye cambio real + changelog)
1) Stagea TODO excepto secretos:
   - !`git add -A`

2) Lista staged:
   - !`git diff --staged --name-only`

3) Si ves algo sensible, quítalo del stage:
   - !`git restore --staged <archivo>`

---

## Paso D — Revisión rápida + Commit + Push
1) Revisa lo staged:
   - !`git diff --staged`

2) Genera un mensaje de commit en nuestro estilo basado en el cambio real (no “update changelog”):
   - Debe empezar por `feat:` / `fix:` / `refactor:` / `chore:` etc.
   - Usa scope si aplica (ej `feat(recurring): ...`)

3) Commit + push:
   - !`git commit -m "<MENSAJE>"`
   - !`git push`
