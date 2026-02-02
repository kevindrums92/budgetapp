# Plan de Monetización con Anuncios - Versión Free

**Fecha:** 1 de febrero de 2026
**Objetivo:** Implementar anuncios en la versión gratuita de la app de presupuestos sin comprometer la experiencia de usuario

---

## 📊 Contexto del Mercado 2026

Según las últimas tendencias del mercado:

- La publicidad in-app alcanzará **$533.90 mil millones** para 2029 (crecimiento del 8.17% anual)
- Los anuncios intersticiales tienen las tasas de engagement más altas
- Los rewarded ads son la segunda estrategia de monetización más efectiva
- Los banner ads tradicionales tienen solo 0.1% CTR (están en declive)

**Fuentes:** [Publift - App Monetization 2026](https://www.publift.com/blog/app-monetization), [AdPushup - Estrategias 2025](https://www.adpushup.com/es/blog/app-monetization-strategies/)

---

## 🎯 Alternativas de SDKs para Capacitor

### Opción 1: Google AdMob (Recomendada) ⭐

**SDK:** `@capacitor-community/admob`

**Ventajas:**
- Plugin oficial de la comunidad Capacitor con soporte activo
- Mayor red de anunciantes (88.90% de market share en apps móviles)
- Soporte completo para iOS y Android
- Documentación extensa en español
- Integración directa con Google Analytics para tracking

**Desventajas:**
- Requiere cuenta de Google AdMob y configuración por plataforma
- Pagos mínimos de $100 USD
- Políticas estrictas de contenido

**Instalación:**
```bash
npm install @capacitor-community/admob
npx cap update
```

**Configuración:**
- Android: Agregar App ID en `AndroidManifest.xml`
- iOS: Configurar `info.plist` con GADApplicationIdentifier

**Fuentes:** [Capacitor Community AdMob](https://github.com/capacitor-community/admob), [AdMob Documentation](https://capgo.app/plugins/capacitor-admob/)

---

### Opción 2: Meta Audience Network

**SDK:** Integración vía plugin nativo o custom

**Ventajas:**
- Targeting ultra-preciso (usa datos de Facebook/Instagram)
- eCPM competitivos en LATAM
- Buena integración con audiencias hispanas

**Desventajas:**
- No hay plugin Capacitor oficial (requiere desarrollo custom)
- Proceso de aprobación más estricto
- Requiere volumen mínimo de usuarios

**Fuentes:** [G2 - AdMob Alternatives](https://www.g2.com/products/google-admob/competitors/alternatives)

---

### Opción 3: AppLovin MAX (Mediación)

**SDK:** MAX SDK

**Ventajas:**
- Plataforma de mediación que conecta múltiples redes
- Optimización automática de eCPM
- Competencia entre redes aumenta ingresos (auction system)
- Payouts competitivos

**Desventajas:**
- Configuración más compleja (requiere setup de múltiples redes)
- Puede aumentar el tamaño del bundle
- Curva de aprendizaje más alta

**Fuentes:** [Playwire - AdMob Alternatives](https://www.playwire.com/blog/admob-alternatives-app-monetization-solutions-from-diy-to-fully-managed)

---

### Opción 4: Unity Ads

**SDK:** Unity Ads SDK

**Ventajas:**
- Mejor implementación de rewarded video del mercado
- Soporte técnico con developers reales
- Gran rendimiento en apps de productividad

**Desventajas:**
- Orientado principalmente a gaming (menor performance en apps de utilidad)
- Requiere integración custom para Capacitor

**Fuentes:** [AppExperts - AdMob Alternatives](https://appexperts.io/blog/google-admob-alternatives/)

---

### Opción 5: InMobi

**SDK:** InMobi SDK

**Ventajas:**
- Excelente segmentación (OS, device, location, timezone)
- Soporte completo para LATAM
- Formatos: banner, native, interstitial, rewarded, carousel

**Desventajas:**
- Menor share que AdMob
- Requiere plugin custom para Capacitor

**Fuentes:** [MetaCTO - AdMob Competitors](https://www.metacto.com/blogs/admob-competitors-and-alternatives-in-2024-comprehensive-guide)

---

## 🎨 Tipos de Anuncios Recomendados

### 1. Banner Ads (NO RECOMENDADO)

**Ubicación:** Top o bottom de la pantalla
**eCPM:** Bajo ($0.10 - $0.50)
**CTR:** 0.1% (muy bajo)

**Razón para NO usar:**
- "Banner blindness" - usuarios los ignoran
- Afecta negativamente la experiencia (ocupa espacio permanente)
- En declive según tendencias 2026

---

### 2. Interstitial Ads (RECOMENDADO) ⭐

**Ubicación:** Pantalla completa en transiciones naturales
**eCPM:** Alto ($2 - $10)
**CTR:** 3-5% (excelente)

**Cuándo mostrar:**
- Después de guardar una transacción (cada 3-5 veces)
- Al cambiar de tab principal (cada 5 cambios)
- Al salir de una página de detalle (Budget detail → Home)
- Al completar una acción importante (crear categoría, restaurar backup)

**Frecuencia sugerida:**
- Máximo 1 cada 3 minutos de uso activo
- Máximo 5 por sesión
- No mostrar en los primeros 2 minutos de uso

**Ejemplo de código:**
```typescript
// services/ads.service.ts
let interstitialCounter = 0;
const INTERSTITIAL_FREQUENCY = 3;

export async function maybeShowInterstitial() {
  interstitialCounter++;
  if (interstitialCounter >= INTERSTITIAL_FREQUENCY) {
    await AdMob.showInterstitial();
    interstitialCounter = 0;
  }
}
```

---

### 3. Rewarded Video Ads (ALTAMENTE RECOMENDADO) ⭐⭐⭐

**Ubicación:** Opt-in del usuario
**eCPM:** Muy alto ($10 - $30)
**Engagement:** 80%+ (los usuarios eligen verlo)

**Recompensas sugeridas para esta app:**

1. **Desbloquear Estadísticas Premium** (7 días)
   - Ver gráficas avanzadas
   - Análisis de tendencias
   - Proyecciones de gasto

2. **Desbloquear Categorías Ilimitadas** (3 días)
   - Usuarios free limitados a 10 categorías
   - Reward: +10 categorías temporales

3. **Backup Cloud Extra** (instantáneo)
   - Usuarios free: 1 backup en cloud
   - Reward: 1 backup adicional

4. **Exportar a Excel/PDF** (1 uso)
   - Feature bloqueada en free
   - Reward: 1 exportación gratis

5. **Eliminar Anuncios Intersticiales** (24 horas)
   - Ver ad rewarded para no ver ads intersticiales por 1 día

**Ubicación en UI:**
- Card en HomePage: "🎁 Desbloquea estadísticas premium - Ver video (30s)"
- Botón en StatsPage cuando está bloqueada: "Ver video para desbloquear 7 días"
- Alert cuando llega a límite de categorías: "¿Ver video para +10 categorías?"

**Ejemplo de código:**
```typescript
// components/RewardedAdCard.tsx
export function RewardedAdCard({ reward }: { reward: RewardType }) {
  const handleWatchAd = async () => {
    try {
      await AdMob.prepareRewardedVideo();
      const { rewarded } = await AdMob.showRewardedVideo();

      if (rewarded) {
        // Unlock feature
        await unlockFeature(reward);
        showSuccess("¡Feature desbloqueada por 7 días!");
      }
    } catch (error) {
      console.error("[Ads] Error showing rewarded video:", error);
    }
  };

  return (
    <button
      onClick={handleWatchAd}
      className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white shadow-lg active:scale-98"
    >
      <Gift className="h-6 w-6" />
      <div className="flex-1 text-left">
        <p className="font-semibold">Desbloquea estadísticas premium</p>
        <p className="text-xs opacity-90">Ver video de 30s</p>
      </div>
      <ChevronRight className="h-5 w-5" />
    </button>
  );
}
```

---

### 4. Native Ads (CONSIDERADO)

**Ubicación:** Integrado en el feed de transacciones
**eCPM:** Medio-Alto ($1 - $5)
**CTR:** 1-2%

**Cuándo usar:**
- En la lista de transacciones (cada 10 items)
- En la lista de categorías (cada 8 items)

**Ventaja:** Se ve como parte del contenido, menos invasivo

**Desventaja:** Más complejo de implementar, puede confundir al usuario

---

## 📋 Plan de Implementación Recomendado

### Fase 1: Setup Inicial (1 semana)

**Tareas:**
1. Crear cuenta Google AdMob
2. Registrar la app (iOS + Android)
3. Configurar Ad Units:
   - Interstitial: "app-interstitial"
   - Rewarded Video: "app-rewarded-video"
4. Instalar `@capacitor-community/admob`
5. Configurar AndroidManifest.xml y info.plist
6. Crear servicio `ads.service.ts` con lógica de ads

**Archivos a crear/modificar:**
```
src/
├── services/
│   ├── ads.service.ts          (NEW)
│   └── adRewards.service.ts    (NEW)
├── components/
│   ├── RewardedAdCard.tsx      (NEW)
│   └── AdConsentModal.tsx      (NEW)
├── types/
│   └── ads.types.ts            (NEW)
└── state/
    └── ads.store.ts            (NEW - Zustand store para rewards)
```

---

### Fase 2: Implementar Rewarded Ads (1 semana)

**Ubicaciones:**
1. `HomePage.tsx`: Card de "Desbloquear estadísticas premium"
2. `StatsPage.tsx`: Botón cuando stats están bloqueadas
3. `CategoriesPage.tsx`: Alert cuando llega a límite de 10 categorías
4. `BackupPage.tsx`: Botón para backup cloud extra

**Lógica de rewards:**
```typescript
// state/ads.store.ts
interface AdsState {
  premiumStatsUnlockedUntil: string | null;
  extraCategoriesUnlockedUntil: string | null;
  noInterstitialsUntil: string | null;
  extraBackupsAvailable: number;
}

export const useAdsStore = create<AdsState>((set, get) => ({
  premiumStatsUnlockedUntil: null,
  extraCategoriesUnlockedUntil: null,
  noInterstitialsUntil: null,
  extraBackupsAvailable: 0,

  isPremiumStatsUnlocked: () => {
    const until = get().premiumStatsUnlockedUntil;
    if (!until) return false;
    return new Date(until) > new Date();
  },

  unlockPremiumStats: (days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    set({ premiumStatsUnlockedUntil: until.toISOString() });
  },

  // ... más métodos
}));
```

---

### Fase 3: Implementar Interstitial Ads (3 días)

**Ubicaciones:**
1. Después de guardar transacción (cada 3 veces)
2. Al cambiar de tab (cada 5 cambios)
3. Al completar acciones importantes

**Lógica de frecuencia:**
```typescript
// services/ads.service.ts
import { AdMob, InterstitialAdPluginEvents } from "@capacitor-community/admob";
import { useAdsStore } from "@/state/ads.store";

let interstitialCounter = 0;
const INTERSTITIAL_FREQUENCY = 3;
let lastInterstitialTime = 0;
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos

export async function initializeAds() {
  await AdMob.initialize({
    initializeForTesting: false, // true en desarrollo
  });

  // Precargar interstitial
  await prepareInterstitial();
}

export async function prepareInterstitial() {
  try {
    await AdMob.prepareInterstitial({
      adId: "ca-app-pub-XXXXXXXX/INTERSTITIAL_ID",
    });
  } catch (error) {
    console.error("[Ads] Error preparing interstitial:", error);
  }
}

export async function maybeShowInterstitial() {
  const adsStore = useAdsStore.getState();

  // No mostrar si tiene reward activo de "no ads"
  if (adsStore.isNoInterstitialsActive()) {
    return;
  }

  // Chequear tiempo mínimo
  const now = Date.now();
  if (now - lastInterstitialTime < MIN_INTERVAL_MS) {
    return;
  }

  // Chequear contador
  interstitialCounter++;
  if (interstitialCounter < INTERSTITIAL_FREQUENCY) {
    return;
  }

  try {
    await AdMob.showInterstitial();
    lastInterstitialTime = now;
    interstitialCounter = 0;

    // Precargar siguiente
    await prepareInterstitial();
  } catch (error) {
    console.error("[Ads] Error showing interstitial:", error);
  }
}

// Listener para cuando se cierra el ad
AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
  console.log("[Ads] Interstitial dismissed");
  prepareInterstitial();
});
```

**Integración en componentes:**
```typescript
// pages/AddEditTransactionPage.tsx
import { maybeShowInterstitial } from "@/services/ads.service";

const handleSave = async () => {
  // ... lógica de guardar ...

  // Mostrar ad después de guardar (cada 3 veces)
  await maybeShowInterstitial();

  navigate("/");
};
```

---

### Fase 4: Consentimiento GDPR/CCPA (2 días)

**Requerido por ley en EU/California:**

```typescript
// components/AdConsentModal.tsx
import { useEffect, useState } from "react";
import { AdMob } from "@capacitor-community/admob";

export default function AdConsentModal() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  async function checkConsent() {
    const consentGiven = localStorage.getItem("ad_consent");
    if (!consentGiven) {
      setShowConsent(true);
    }
  }

  async function handleAccept() {
    localStorage.setItem("ad_consent", "true");
    setShowConsent(false);

    // Inicializar ads
    await initializeAds();
  }

  if (!showConsent) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Anuncios Personalizados
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Esta app muestra anuncios para mantener la versión gratuita.
          ¿Aceptas que usemos tus datos para personalizar los anuncios?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleAccept()}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Aceptar
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 text-center">
          Puedes cambiar tu preferencia en Configuración
        </p>
      </div>
    </div>
  );
}
```

---

### Fase 5: Testing y Optimización (1 semana)

**A/B Testing:**
1. **Frecuencia de interstitials:** 3 vs 5 acciones
2. **Ubicación de rewarded cards:** Top vs bottom de HomePage
3. **Copy de CTAs:** "Ver video" vs "Desbloquear gratis"
4. **Rewards:** 7 días vs 3 días para stats premium

**Métricas a trackear:**
- Impresiones por usuario (goal: 5-10 por sesión)
- CTR de rewarded ads (goal: >50%)
- Retention D1, D7, D30 (comparar con versión sin ads)
- eCPM promedio
- Revenue per User (RPU)

**Herramientas:**
- Google Analytics 4 (ya integrado con Supabase)
- AdMob reporting dashboard
- Custom events en Zustand store

---

## 💰 Proyección de Ingresos

**Suposiciones:**
- 1,000 usuarios activos mensuales (MAU)
- 5 sesiones por mes por usuario
- 2 impresiones por sesión (mix de interstitial + rewarded)

**Cálculo conservador:**

| Métrica | Valor |
|---------|-------|
| Impresiones mensuales | 10,000 |
| eCPM promedio (LATAM) | $2.00 |
| **Ingresos mensuales** | **$20 USD** |

**Cálculo optimista (con 10K MAU):**

| Métrica | Valor |
|---------|-------|
| Impresiones mensuales | 100,000 |
| eCPM promedio (rewarded heavy) | $5.00 |
| **Ingresos mensuales** | **$500 USD** |

**Fuentes:** [MonetizeMore - Cuánto dinero generan apps con ads](https://www.monetizemore.com/es/blog/cuanto-dinero-aplicaciones-ads/)

---

## ⚖️ Consideraciones de UX

### ✅ Buenas Prácticas

1. **Transparencia:** Explicar por qué hay ads ("para mantener la app gratis")
2. **Control:** Dar opción de "eliminar ads por 24h" vía rewarded video
3. **Timing:** Solo mostrar ads en transiciones naturales
4. **Frecuencia:** Limitar a máximo 5 interstitials por sesión
5. **Valor:** Ofrecer rewards genuinamente útiles (no cosméticos)
6. **Escape:** Siempre permitir cerrar ads después de countdown

### ❌ Errores a Evitar

1. **No mostrar ad inmediatamente al abrir la app** (peor experiencia)
2. **No interrumpir input del usuario** (e.g., mientras escribe)
3. **No usar banner permanente** (reduce espacio útil + bajo ROI)
4. **No exceder 10 impresiones por sesión** (usuarios desinstalan)
5. **No bloquear features core** (agregar transacciones debe ser siempre gratis)

---

## 🔐 Plan de Versión Premium (Upsell)

**Precio sugerido:** $2.99 USD/mes o $19.99 USD/año (70% descuento)

**Beneficios vs Free:**

| Feature | Free | Premium |
|---------|------|---------|
| Transacciones | Ilimitadas | Ilimitadas |
| Categorías | 10 máx | Ilimitadas |
| Cloud sync | ✅ | ✅ |
| Estadísticas básicas | ✅ | ✅ |
| **Estadísticas avanzadas** | ❌ (unlock con ad) | ✅ |
| **Exportar Excel/PDF** | ❌ (1 uso con ad) | ✅ Ilimitado |
| **Múltiples presupuestos** | 1 | Ilimitados |
| **Backups cloud** | 1 | Ilimitados |
| **Anuncios** | ✅ (con opción de ver rewarded para quitar) | ❌ Sin ads |
| **Temas personalizados** | ❌ | ✅ |
| **Soporte prioritario** | ❌ | ✅ |

**Conversión esperada:** 2-5% de usuarios free → premium

---

## 🛠️ Stack Técnico Final

```typescript
// Dependencias a instalar
{
  "dependencies": {
    "@capacitor-community/admob": "^6.0.0"
  }
}
```

**Configuración AdMob IDs:**
```typescript
// src/config/ads.config.ts
export const ADS_CONFIG = {
  android: {
    appId: "ca-app-pub-XXXXXXXX~XXXXXXXXXX",
    interstitial: "ca-app-pub-XXXXXXXX/XXXXXXXXXX",
    rewarded: "ca-app-pub-XXXXXXXX/XXXXXXXXXX",
  },
  ios: {
    appId: "ca-app-pub-XXXXXXXX~XXXXXXXXXX",
    interstitial: "ca-app-pub-XXXXXXXX/XXXXXXXXXX",
    rewarded: "ca-app-pub-XXXXXXXX/XXXXXXXXXX",
  },
  // Testing IDs (usar en desarrollo)
  test: {
    interstitial: "ca-app-pub-3940256099942544/1033173712",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
  },
};
```

---

## 📊 Roadmap de Implementación

### Sprint 1 (Semana 1-2)
- [ ] Crear cuenta AdMob y configurar app
- [ ] Instalar y configurar `@capacitor-community/admob`
- [ ] Crear `ads.service.ts` y `ads.store.ts`
- [ ] Implementar AdConsentModal (GDPR/CCPA)
- [ ] Testing en modo sandbox con test IDs

### Sprint 2 (Semana 3-4)
- [ ] Implementar Rewarded Video Ads
- [ ] Crear RewardedAdCard component
- [ ] Integrar rewards en HomePage, StatsPage, CategoriesPage
- [ ] Crear lógica de unlock temporal (ads.store.ts)
- [ ] Testing end-to-end de rewards

### Sprint 3 (Semana 5-6)
- [ ] Implementar Interstitial Ads
- [ ] Integrar en AddEditTransactionPage (después de guardar)
- [ ] Integrar en navegación entre tabs
- [ ] Implementar lógica de frecuencia y cooldowns
- [ ] Testing de frecuencia (no molestar usuarios)

### Sprint 4 (Semana 7-8)
- [ ] A/B testing de frecuencia y ubicaciones
- [ ] Optimizar eCPM (ajustar mix de ad types)
- [ ] Implementar analytics tracking (impresiones, clicks, rewards)
- [ ] Crear dashboard interno para monitorear revenue
- [ ] Preparar para production (cambiar a production Ad IDs)

### Sprint 5 (Semana 9-10)
- [ ] Soft launch con 10% de usuarios
- [ ] Monitorear retention y feedback
- [ ] Ajustar frecuencia según feedback
- [ ] Full rollout a 100% usuarios
- [ ] Documentar resultados y optimizaciones

---

## 🎯 Recomendación Final

**Estrategia sugerida:**

1. **Empezar SOLO con Rewarded Video Ads** (mes 1)
   - Menor fricción, mayor engagement
   - Permite testear infraestructura
   - Genera goodwill (usuarios eligen ver ads)

2. **Añadir Interstitials conservadoramente** (mes 2)
   - Frecuencia: cada 5 acciones (no 3)
   - Solo después de validar que rewarded ads funcionan
   - Monitorear retention agresivamente

3. **Optimizar mix según datos** (mes 3+)
   - Si retention se mantiene: aumentar interstitials a cada 3 acciones
   - Si cae: reducir o eliminar interstitials, solo rewarded

4. **Ofrecer Premium desde día 1**
   - Botón visible en ProfilePage: "Quitar anuncios - $2.99/mes"
   - Highlight el valor: "Sin ads + stats premium + exportar ilimitado"
   - Meta: 2% de conversión = revenue más predecible que ads

**SDK:** Google AdMob vía `@capacitor-community/admob`

**Ad Types:** Rewarded Video (primary) + Interstitial (secondary, conservador)

**Proyección:** $20-50 USD/mes con 1K MAU + $30-60/mes de premium subscriptions

---

## 📚 Referencias y Fuentes

### SDKs y Documentación
- [Capacitor Community AdMob Plugin](https://github.com/capacitor-community/admob)
- [AdMob Plugin Documentation](https://capgo.app/plugins/capacitor-admob/)
- [Google AdMob Official Docs](https://developers.google.com/admob)
- [Implement AdMob in Ionic React Capacitor](https://medium.com/enappd/implement-admob-in-ionic-react-capacitor-apps-ebc7af360b41)

### Market Research y Tendencias
- [12 Mobile App Monetisation Strategies for 2026 - Publift](https://www.publift.com/blog/app-monetization)
- [Las 10 mejores plataformas de monetización de apps - AdPushup](https://www.adpushup.com/es/blog/best-app-monetization-platform/)
- [12 estrategias probadas de monetización de apps - AdPushup](https://www.adpushup.com/es/blog/app-monetization-strategies/)
- [Guía definitiva para monetización de apps - MonetizeMore](https://www.monetizemore.com/blog/guia-definitiva-para-monetizacion-de-aplicaciones/)

### Alternativas y Competidores
- [Top 10 Google AdMob Alternatives - G2](https://www.g2.com/products/google-admob/competitors/alternatives)
- [AdMob Alternatives - Playwire](https://www.playwire.com/blog/admob-alternatives-app-monetization-solutions-from-diy-to-fully-managed)
- [AdMob Competitors Guide - MetaCTO](https://www.metacto.com/blogs/admob-competitors-and-alternatives-in-2024-comprehensive-guide)
- [Best Mobile Ad Networks - Publift](https://www.publift.com/blog/best-mobile-ad-networks-for-publishers)
- [Best Google AdMob Alternatives - AppExperts](https://appexperts.io/blog/google-admob-alternatives/)

### Revenue y Proyecciones
- [¿Cuánto dinero pueden generar las aplicaciones con anuncios? - MonetizeMore](https://www.monetizemore.com/es/blog/cuanto-dinero-aplicaciones-ads/)
- [Anuncios móviles para videojuegos - Google AdMob](https://admob.google.com/intl/es-419/home/resources/monetize-mobile-game-with-ads/)

---

**Última actualización:** 1 de febrero de 2026
**Próxima revisión:** Después del Sprint 1 (2 semanas)
