# Habilitar Firebase Cloud Messaging API

## Problema
Error 401 UNAUTHENTICATED al enviar notificaciones:
```
"THIRD_PARTY_AUTH_ERROR"
```

## Solución

### Opción 1: Desde Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (`smartspend-app-81le8`)
3. Ve a **Project Settings** (ícono de engranaje)
4. Pestaña **Cloud Messaging**
5. Si ves "Cloud Messaging API (Legacy) disabled":
   - Click en **Manage API in Google Cloud Console**
   - Esto te llevará a Google Cloud Console
6. Click en **ENABLE** para habilitar la API
7. Espera 1-2 minutos para que se propague

### Opción 2: Desde Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (`smartspend-app-81le8`)
3. En el menú lateral, ve a **APIs & Services** → **Library**
4. Busca "Firebase Cloud Messaging API"
5. Click en el resultado
6. Click en **ENABLE**
7. Espera 1-2 minutos

### Opción 3: Enlace directo

Abre esta URL (reemplaza `smartspend-app-81le8` con tu project ID):

```
https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=smartspend-app-81le8
```

## Verificación

Después de habilitar la API, ejecuta nuevamente la función de test en Supabase Dashboard.

**Logs esperados:**
```
[Debug] FCM response status: 200
```

**Si aún falla con 401:**
- Verifica que el Service Account tenga el rol "Firebase Cloud Messaging Admin"
- Ve a IAM & Admin en Google Cloud Console
- Busca el service account (firebase-adminsdk-xxxxx@smartspend-app-81le8.iam.gserviceaccount.com)
- Debe tener el rol "Firebase Admin SDK Administrator Service Agent"

## Tiempo de propagación

Después de habilitar la API:
- Espera **1-2 minutos** antes de probar
- En algunos casos puede tomar hasta **5 minutos**
