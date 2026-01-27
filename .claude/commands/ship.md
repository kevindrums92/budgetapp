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
- **NUNCA** modificar números de versión en ningún archivo
- **NUNCA** modificar el campo `version` en package.json
- **SIEMPRE** agregar entradas bajo `## [unreleased] - {release date}` (mantener ese heading exacto, incluyendo el typo "relase")
- **NUNCA** crear nuevas secciones con números de versión (ej: `## [0.8.0]` está prohibido)
- **NUNCA** commitear cambios de Bundle ID dev: Si los únicos cambios en `capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj` o `ios/App/App/Info.plist` son Bundle ID dev (`com.jhotech.smartspend.dev`), URL scheme dev (`smartspend-dev://`) o app name dev (`SmartSpend Dev`), excluirlos del commit usando `git restore --staged <file>`
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

2) Agrega 1-3 bullets nuevos describiendo el cambio **INMEDIATAMENTE después del heading** (antes de cualquier otro contenido).
   - Preferir verbos en imperativo ("add…", "fix…", "refactor…", "improve…").
   - Mantener el estilo de bullets ya usado en el archivo.
   - NO cambies el heading ni arregles el typo.
   - NO modifiques ni agregues números de versión.
   - NO crees nuevas secciones versionadas.

---

## Paso C — Stage seguro (incluye cambio real + changelog)
1) Stagea TODO excepto secretos:
   - !`git add -A`

2) Detecta y excluye cambios de Bundle ID dev:
   - Verifica si hay cambios staged en `capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj` o `ios/App/App/Info.plist`
   - Si los únicos cambios en esos archivos son:
     - Bundle ID: `com.jhotech.smartspend` → `com.jhotech.smartspend.dev`
     - App Name: `SmartSpend` → `SmartSpend Dev`
     - URL Scheme: `smartspend://` → `smartspend-dev://`
   - Entonces ejecuta: `git restore --staged capacitor.config.ts ios/App/App.xcodeproj/project.pbxproj ios/App/App/Info.plist`
   - Si hay OTROS cambios además del Bundle ID, mantenlos staged

3) Lista staged:
   - !`git diff --staged --name-only`

4) Verifica que no haya archivos sensibles en el stage (si los hay, usa `git restore --staged <filename>` manualmente)

---

## Paso D — Revisión rápida + Commit + Push
1) Revisa lo staged:
   - !`git diff --staged`

2) Genera un mensaje de commit en nuestro estilo basado en el cambio real (no "update changelog"):
   - Debe empezar por `feat:` / `fix:` / `refactor:` / `chore:` etc.
   - Usa scope si aplica (ej `feat(recurring): ...`)
   - Ejemplos:
     - `fix(ui): reset scroll on category edit pages`
     - `feat(transactions): add status badge to transaction items`
     - `refactor(auth): simplify login flow`
     - `chore(deps): update dependencies`

3) Commit + push:
   - Usa el mensaje generado en el paso 2, NO uses literalmente "<MENSAJE>"
   - Comando: `git commit -m "TU_MENSAJE_AQUI"`
   - Luego: !`git push`
