# Plan: Banner Ads + Rewarded Video Ads

## Context

AdMob SDK esta 95% integrado (interstitials funcionando). Las funciones `showBanner()`, `hideBanner()`, `removeBanner()`, `showRewardedVideo()` ya existen en `ads.service.ts` pero no se usan en la UI. El objetivo es:

1. **Banner Ads** en paginas sin bottom bar (mas impresiones = mas revenue)
2. **Rewarded Video** en el modal "Sin Limites" del batch entry para desbloquear 1 uso gratis de IA

### Decisiones tomadas
- **Banner en formularios**: NO (tienen boton fijo de guardar en el bottom)
- **Limite de bonus por rewarded video**: Sin limite (mas revenue por ads)
- **Android Banner Ad Unit ID**: Usuario ya lo tiene, se configurara al implementar

---

## Parte 1: Banner Ads

### Estrategia

El banner de AdMob es un **overlay nativo** que se posiciona sobre el WebView en `BOTTOM_CENTER`. No es un elemento HTML. Por tanto:
- Solo necesitamos **mostrar/ocultar** el banner segun la ruta
- Agregar **padding inferior** al contenido para que no quede tapado por el banner

### 1.1 Hook `useBannerAd` (NUEVO)

- [ ] **Archivo**: `src/hooks/useBannerAd.ts`

- Escucha cambios de ruta (`useLocation`)
- Determina si la ruta actual debe mostrar banner
- Llama `showBanner()` / `hideBanner()` segun corresponda
- Setea CSS custom property `--banner-height: 60px` o `0px`
- Solo actua en plataformas nativas (`Capacitor.isNativePlatform()`)
- Respeta `isPro` (nunca muestra ads a usuarios Pro)

**Logica de rutas**:
```
NO mostrar banner en:
  - Paginas con bottom bar: /, /plan, /stats, /profile, /trips
  - Paginas de formulario: /add, /edit/*, /category/new, /category/*/edit,
    /category-group/new, /category-group/*/edit, /trips/new, /trips/*/edit,
    /trips/*/expense/*
  - Onboarding: /onboarding/*
  - Auth: /auth/*

SI mostrar banner en (todas las demas):
  - /history, /scheduled, /backup
  - /categories, /category-groups, /category/*/month/*
  - /settings/*, /profile/subscription
  - /plan/* (detail), /trips/* (detail)
  - /legal/*
```

### 1.2 CSS Global para padding del banner

- [ ] **Archivo**: `src/index.css`

```css
:root { --banner-height: 0px; }
```

El hook setea `--banner-height` dinamicamente.

### 1.3 Ajustar padding en paginas con banner

- [ ] Agregar `style={{ paddingBottom: 'var(--banner-height)' }}` al contenedor de cada pagina afectada.

**Paginas a modificar**:
- [ ] `src/features/transactions/pages/HistoryPage.tsx`
- [ ] `src/features/transactions/pages/ScheduledPage.tsx`
- [ ] `src/features/categories/pages/CategoriesPage.tsx`
- [ ] `src/features/categories/pages/CategoryGroupsPage.tsx`
- [ ] `src/features/categories/pages/CategoryMonthDetailPage.tsx`
- [ ] `src/features/backup/pages/BackupPage.tsx`
- [ ] `src/features/budget/pages/PlanDetailPage.tsx`
- [ ] `src/features/trips/pages/TripDetailPage.tsx`
- [ ] `src/features/profile/pages/SubscriptionManagementPage.tsx`
- [ ] `src/features/profile/pages/ExportCSVPage.tsx`
- [ ] `src/features/profile/pages/CurrencySettingsPage.tsx`
- [ ] `src/features/profile/pages/LanguageSettingsPage.tsx`
- [ ] `src/features/profile/pages/ThemeSettingsPage.tsx`
- [ ] `src/features/notifications/pages/NotificationSettingsPage.tsx`

### 1.4 Actualizar `showBanner()` en ads.service.ts

- [ ] Agregar `bannerAdUnitId` a `AD_CONFIG` para iOS y Android
- [ ] Actualizar `showBanner()` para usar `AD_CONFIG[platform].bannerAdUnitId` en vez de ID hardcodeado

### 1.5 Montar hook en App.tsx

- [ ] Llamar `useBannerAd()` dentro de `AppFrame` para que reaccione a cambios de ruta

### 1.6 Precargar rewarded video en AdMobProvider

- [ ] Agregar `prepareRewardedVideo()` al init en `AdMobProvider.tsx`

---

## Parte 2: Rewarded Video (Batch Entry)

### Estrategia

Cuando un usuario free alcanza el rate limit de AI batch entry (2/dia), ve el modal "Sin Limites". Agregaremos un **segundo boton**: "Ver un anuncio para 1 uso gratis". El flujo:

1. Usuario toca "Ver un anuncio" -> se muestra rewarded video
2. Usuario completa el video -> cliente llama Edge Function `grant-batch-bonus`
3. Edge Function incrementa contador de bonus en Redis
4. Cliente auto-reintenta el batch entry -> `parse-batch` detecta bonus disponible -> lo consume -> procesa request

### 2.1 Edge Function `grant-batch-bonus` (NUEVO)

- [ ] **Archivo**: `supabase/functions/grant-batch-bonus/index.ts`

- Valida JWT de Supabase Auth
- Verifica que el usuario es free tier (Pro no necesita bonus)
- Incrementa Redis key `smartspend:batch:bonus:{userId}`
- TTL de 7 dias (bonus expira)
- Sin limite diario de bonus (usuario puede ver anuncios ilimitados = mas revenue por ads)

### 2.2 Modificar `parse-batch` Edge Function

- [ ] **Archivo**: `supabase/functions/parse-batch/index.ts` (~linea 459)

Antes de aplicar rate limiting a usuarios free:
1. Verificar Redis key `smartspend:batch:bonus:{userId}`
2. Si bonus > 0: decrementar y **skip** rate limit check
3. Si bonus = 0: aplicar rate limit normal

### 2.3 Servicio cliente `grantBatchBonus()`

- [ ] **Archivo**: `src/features/batch-entry/services/batchEntry.service.ts` (agregar funcion)

Funcion que llama a `grant-batch-bonus` Edge Function despues de completar el rewarded video.

### 2.4 Modificar modal "Sin Limites" en BatchEntrySheet

- [ ] **Archivo**: `src/features/batch-entry/components/BatchEntrySheet.tsx` (~lineas 711-772)

Cambios:
- Agregar estado `isLoadingAd` y `adError`
- Handler `handleWatchRewardedVideo()`:
  1. Muestra rewarded video (`showRewardedVideo()`)
  2. Si completa: llama `grantBatchBonus()`
  3. Si exito: reset estado y auto-retry batch entry
  4. Si error: muestra mensaje
- Agregar boton secundario debajo del CTA principal:
  - **Primario** (blanco): "Prueba Gratis por 7 Dias" -> PaywallModal
  - **Secundario** (blanco/10 transparente): "Ver un anuncio para 1 uso gratis" -> rewarded video

### 2.5 Traducciones i18n

- [ ] **Archivos**: `src/i18n/locales/{es,en,fr,pt}/batch.json`

Agregar keys para:
- `rewardedVideo.cta`: "Ver un anuncio para 1 uso gratis"
- `rewardedVideo.loading`: "Cargando anuncio..."
- `rewardedVideo.error`: "Error al cargar el anuncio"
- `rewardedVideo.adFailed`: "No completaste el anuncio"
- `rewardedVideo.bonusFailed`: "Error al otorgar el uso"

---

## Resumen de archivos

### Nuevos (2):
1. `src/hooks/useBannerAd.ts` -- Hook de banner por ruta
2. `supabase/functions/grant-batch-bonus/index.ts` -- Edge Function para bonus

### Modificados (~20):
1. `src/App.tsx` -- Montar `useBannerAd()`
2. `src/index.css` -- CSS variable `--banner-height`
3. `src/services/ads.service.ts` -- Usar config por plataforma en `showBanner()`
4. `src/shared/components/providers/AdMobProvider.tsx` -- Precargar rewarded video
5. `src/features/batch-entry/components/BatchEntrySheet.tsx` -- Boton rewarded video
6. `src/features/batch-entry/services/batchEntry.service.ts` -- Funcion `grantBatchBonus()`
7. `supabase/functions/parse-batch/index.ts` -- Check bonus antes de rate limit
8. `src/i18n/locales/{es,en,fr,pt}/batch.json` -- Traducciones (4 archivos)
9. ~14 paginas -- Agregar padding para banner

---

## Verificacion

1. **Banner**: Navegar entre paginas con/sin bottom bar -> banner aparece/desaparece correctamente
2. **Banner padding**: Contenido no queda tapado por el banner en ninguna pagina
3. **Rewarded video**: Alcanzar rate limit -> ver modal -> tocar "Ver anuncio" -> completar video -> bonus funciona -> batch entry se reintenta
4. **Pro users**: Nunca ven banner ni modal de rate limit
5. **Edge Functions**: `supabase functions serve` para test local, luego `supabase functions deploy`
6. **Build**: `npm run build` pasa sin errores TypeScript
