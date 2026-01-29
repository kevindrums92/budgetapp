# Notificación de Fin de Mes para Ahorro

## 📋 Overview

**Feature**: Push notification automática enviada el último día de cada mes a usuarios con balance positivo, invitándolos a destinar ese balance (o parte de él) a sus metas de ahorro activas.

**Objetivo**: Incentivar el ahorro sistemático aprovechando el excedente mensual de los usuarios.

**Flujo**:
1. **Trigger**: Último día del mes (ejecutado por cron job)
2. **Condición**: Usuario tiene balance positivo en el mes actual
3. **Acción**: Enviar push notification personalizada
4. **Interacción**: Al abrir la notificación → Modal en Home → Formulario precargado

---

## 🎯 Criterios de Envío

### Usuarios Elegibles

Una notificación se envía a un usuario si cumple **TODOS** estos criterios:

1. **Balance positivo**:
   - `balance_del_mes = ingresos_totales - gastos_totales > 0`
   - Solo contar transacciones con `status = "paid"` (excluir "pending" y "planned")
   - Solo transacciones del mes actual (según `date` field)

2. **Push notifications habilitadas**:
   - Tiene token FCM activo (`push_tokens.is_active = true`)
   - Preferencias: necesita un nuevo flag `monthly_savings_reminder`

3. **No está en quiet hours**:
   - Respetar `quiet_hours` configuradas por el usuario
   - Enviar en horario UTC que corresponda a ~20:00 en su timezone

4. **No ha recibido esta notificación este mes**:
   - Verificar en `notification_history` que no se envió `monthly_savings_reminder` este mes
   - Importante para evitar duplicados si cron se ejecuta múltiples veces

### Cálculo de Balance

```typescript
// Pseudo-código
function calculateMonthBalance(userId: string, monthKey: string): number {
  const transactions = getTransactionsForMonth(userId, monthKey);

  const income = transactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  return income - expenses;
}
```

---

## 🏗️ Arquitectura

### 1. Backend (Supabase)

#### 1.1. Nueva Notificación Type

**Archivo**: `supabase/migrations/YYYYMMDD_add_monthly_savings_reminder.sql`

```sql
-- Add new notification type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'monthly_savings_reminder';
```

#### 1.2. Nueva Preferencia de Usuario

**Actualizar**: `NotificationPreferences` type

```typescript
// src/types/notifications.ts
export interface NotificationPreferences {
  scheduled_transactions: boolean;
  daily_reminder: DailyReminderPreference;
  daily_summary: DailySummaryPreference;
  monthly_savings_reminder: boolean; // 🆕 NEW
  quiet_hours: QuietHoursPreference;
}

// Actualizar DEFAULT_NOTIFICATION_PREFERENCES
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  scheduled_transactions: true,
  daily_reminder: { enabled: true, time: localToUTC('21:00') },
  daily_summary: { enabled: true, time: localToUTC('21:00') },
  monthly_savings_reminder: true, // 🆕 Enabled by default
  quiet_hours: { enabled: true, start: localToUTC('23:00'), end: localToUTC('06:00') },
};
```

**Migración SQL**: Actualizar default preferences en `push_tokens` table

```sql
-- Update default preferences to include monthly_savings_reminder
ALTER TABLE push_tokens
ALTER COLUMN preferences
SET DEFAULT jsonb_set(
  preferences,
  '{monthly_savings_reminder}',
  'true'::jsonb
);
```

#### 1.3. Edge Function: `send-monthly-savings-reminder`

**Archivo**: `supabase/functions/send-monthly-savings-reminder/index.ts`

**Responsabilidades**:
- Ejecutado el último día de cada mes
- Consultar usuarios elegibles
- Calcular balance del mes para cada usuario
- Enviar notificación personalizada con balance
- Registrar envío en `notification_history`

**Pseudo-código**:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

Deno.serve(async (req) => {
  const supabase = createClient(/* ... */);

  // 1. Get current month info
  const today = new Date();
  const isLastDayOfMonth = /* check if today is last day */;

  if (!isLastDayOfMonth) {
    return new Response(JSON.stringify({ skipped: 'Not last day of month' }), {
      status: 200,
    });
  }

  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

  // 2. Get all active users with push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('*, user_id')
    .eq('is_active', true);

  const results = [];

  for (const token of tokens) {
    // 3. Check preferences
    if (!token.preferences?.monthly_savings_reminder) continue;

    // 4. Check if already sent this month
    const { data: history } = await supabase
      .from('notification_history')
      .select('id')
      .eq('user_id', token.user_id)
      .eq('notification_type', 'monthly_savings_reminder')
      .gte('sent_at', `${currentMonth}-01T00:00:00Z`)
      .maybeSingle();

    if (history) continue; // Already sent this month

    // 5. Calculate balance
    const balance = await calculateMonthBalance(token.user_id, currentMonth);

    if (balance <= 0) continue; // No positive balance

    // 6. Check if user has active savings goals
    const { data: goals } = await supabase
      .from('budgets')
      .select('id, category_id, amount')
      .eq('user_id', token.user_id)
      .eq('type', 'goal')
      .eq('status', 'active');

    const hasGoals = goals && goals.length > 0;

    // 7. Get user's language from device_info
    const language = token.device_info?.language || 'es';

    // 8. Build notification payload
    const notification = buildNotificationPayload(language, balance, hasGoals);

    // 9. Send via FCM
    await admin.messaging().send({
      token: token.token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: 'monthly_savings_reminder',
        balance: String(balance),
        hasGoals: String(hasGoals),
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    });

    // 10. Log to notification_history
    await supabase.from('notification_history').insert({
      user_id: token.user_id,
      token_id: token.id,
      notification_type: 'monthly_savings_reminder',
      title: notification.title,
      body: notification.body,
      data: { balance, hasGoals },
      status: 'sent',
    });

    results.push({ userId: token.user_id, balance, hasGoals });
  }

  return new Response(JSON.stringify({
    processed: results.length,
    results
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Helper: Calculate month balance for user
async function calculateMonthBalance(userId: string, monthKey: string): Promise<number> {
  // Get user's state from user_state table
  const { data } = await supabase
    .from('user_state')
    .select('state')
    .eq('user_id', userId)
    .single();

  if (!data?.state) return 0;

  const transactions = data.state.transactions || [];
  const startDate = `${monthKey}-01`;
  const endDate = getLastDayOfMonth(monthKey);

  let income = 0;
  let expenses = 0;

  for (const tx of transactions) {
    // Only count paid transactions within month
    if (tx.status !== 'paid') continue;
    if (tx.date < startDate || tx.date > endDate) continue;

    if (tx.type === 'income') {
      income += tx.amount;
    } else if (tx.type === 'expense') {
      expenses += tx.amount;
    }
  }

  return income - expenses;
}

// Helper: Build notification text based on language
function buildNotificationPayload(language: string, balance: number, hasGoals: boolean) {
  const messages = {
    es: {
      title: '¡Mes exitoso!',
      bodyWithGoals: `Tienes un balance positivo de $${formatCurrency(balance)}. ¿Lo destinas a tus metas?`,
      bodyNoGoals: `Tienes un balance positivo de $${formatCurrency(balance)}. ¿Empiezas a ahorrar?`,
    },
    en: {
      title: 'Successful Month!',
      bodyWithGoals: `You have a positive balance of $${formatCurrency(balance)}. Add it to your goals?`,
      bodyNoGoals: `You have a positive balance of $${formatCurrency(balance)}. Start saving?`,
    },
    // ... más idiomas
  };

  const lang = messages[language] || messages.es;

  return {
    title: lang.title,
    body: hasGoals ? lang.bodyWithGoals : lang.bodyNoGoals,
  };
}
```

#### 1.4. Cron Job

**Archivo**: `supabase/migrations/YYYYMMDD_add_monthly_savings_cron.sql`

```sql
-- Monthly Savings Reminder - Check daily at 9:00 AM UTC
-- The function itself checks if it's the last day of the month
SELECT cron.schedule(
  'send-monthly-savings-reminder',
  '0 9 * * *', -- Daily at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/send-monthly-savings-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**Nota**: Se ejecuta diariamente, pero la función verifica internamente si es el último día del mes.

---

### 2. Frontend (React)

#### 2.1. Actualizar Tipos

**Archivo**: `src/types/notifications.ts`

```typescript
export type NotificationType =
  | 'daily_reminder'
  | 'upcoming_transaction_scheduled'
  | 'upcoming_transaction_pending'
  | 'upcoming_transactions_multiple'
  | 'daily_summary'
  | 'monthly_savings_reminder'; // 🆕 NEW
```

#### 2.2. Actualizar Push Notification Handler

**Archivo**: `src/services/pushNotification.service.ts`

**Función**: `handleNotificationTap`

```typescript
function handleNotificationTap(action: NotificationActionPerformedEvent): void {
  const data = action.notification?.data as Record<string, unknown> | undefined;

  if (!data?.type) {
    window.location.href = '/';
    return;
  }

  switch (data.type) {
    case 'daily_reminder':
      window.location.href = '/add';
      break;
    case 'upcoming_transaction_scheduled':
    case 'upcoming_transaction_pending':
    case 'upcoming_transactions_multiple': {
      try {
        sessionStorage.setItem('pending-upcoming-modal', String(data.type));
      } catch { /* ignore */ }
      window.dispatchEvent(
        new CustomEvent('show-upcoming-transactions', {
          detail: { type: data.type },
        })
      );
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      break;
    }
    case 'daily_summary':
      window.location.href = '/stats';
      break;

    // 🆕 NEW CASE
    case 'monthly_savings_reminder': {
      try {
        // Store notification data for modal
        sessionStorage.setItem('pending-savings-reminder', JSON.stringify({
          balance: data.balance,
          hasGoals: data.hasGoals,
        }));
      } catch { /* ignore */ }

      // Dispatch custom event to show modal
      window.dispatchEvent(
        new CustomEvent('show-savings-reminder-modal', {
          detail: {
            balance: data.balance,
            hasGoals: data.hasGoals,
          },
        })
      );

      // Navigate to home if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      break;
    }

    default:
      window.location.href = '/';
  }
}
```

#### 2.3. Nuevo Componente: `SavingsReminderModal`

**Archivo**: `src/features/savings/components/SavingsReminderModal.tsx`

**Props**:
```typescript
type Props = {
  open: boolean;
  onClose: () => void;
  balance: number;
  hasGoals: boolean;
};
```

**Diseño**:

```
┌─────────────────────────────────────┐
│  [Backdrop overlay - black/50]      │
│                                     │
│   ┌───────────────────────────┐    │
│   │  Modal Card (centered)     │    │
│   │                            │    │
│   │  💰 [Balance Amount]       │    │
│   │  "¡Mes exitoso!"           │    │
│   │                            │    │
│   │  "Tienes un balance        │    │
│   │   positivo de $XXX..."     │    │
│   │                            │    │
│   │  [Opciones]                │    │
│   │   - Si tiene metas:        │    │
│   │     "Agregar a una meta"   │    │
│   │   - Si NO tiene metas:     │    │
│   │     "Crear meta de ahorro" │    │
│   │                            │    │
│   │  [Cancelar] [Continuar]    │    │
│   └───────────────────────────┘    │
└─────────────────────────────────────┘
```

**Comportamiento**:

1. **Usuario CON metas activas**:
   - Botón: "Agregar a una Meta"
   - Al hacer click → Abrir drawer con lista de metas
   - Usuario selecciona meta → Abrir form de transacción precargado

2. **Usuario SIN metas activas**:
   - Botón: "Crear Meta de Ahorro"
   - Al hacer click → Abrir modal de crear budget con `type="goal"`
   - Después de crear meta → Abrir form de transacción precargado

**Código**:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudgetStore } from '@/state/budget.store';
import { useCurrency } from '@/features/currency';
import { PiggyBank, TrendingUp } from 'lucide-react';
import type { Budget } from '@/types/budget.types';

type Props = {
  open: boolean;
  onClose: () => void;
  balance: number;
  hasGoals: boolean;
};

export default function SavingsReminderModal({ open, onClose, balance, hasGoals }: Props) {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const budgets = useBudgetStore((s) => s.budgets);
  const categoryDefinitions = useBudgetStore((s) => s.categoryDefinitions);

  const [showGoalPicker, setShowGoalPicker] = useState(false);

  if (!open) return null;

  // Get active savings goals
  const activeGoals = budgets.filter(
    (b) => b.type === 'goal' && b.status === 'active'
  );

  const handleAddToGoal = () => {
    if (activeGoals.length === 1) {
      // Only one goal, go directly to form
      openTransactionForm(activeGoals[0]);
    } else {
      // Multiple goals, show picker
      setShowGoalPicker(true);
    }
  };

  const handleCreateGoal = () => {
    // TODO: Open AddEditBudgetModal with type="goal"
    // After goal is created, open transaction form
    onClose();
    // ... implementation
  };

  const openTransactionForm = (goal: Budget) => {
    const category = categoryDefinitions.find((c) => c.id === goal.categoryId);
    if (!category) return;

    const today = new Date();
    const monthName = today.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const notes = `Ahorro automático del mes de ${monthName}`;

    // Navigate to form with pre-filled data via state
    navigate('/add', {
      state: {
        prefilledData: {
          type: 'expense',
          categoryId: category.id,
          amount: String(balance),
          notes,
        },
      },
    });

    onClose();
  };

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Card */}
        <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          {/* Title */}
          <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
            ¡Mes Exitoso!
          </h3>

          {/* Balance */}
          <p className="mb-4 text-center text-3xl font-bold text-emerald-600">
            {formatAmount(balance)}
          </p>

          {/* Description */}
          <p className="mb-6 text-center text-sm text-gray-600">
            {hasGoals
              ? 'Tienes un balance positivo este mes. ¿Deseas agregarlo a una de tus metas de ahorro?'
              : 'Tienes un balance positivo este mes. ¿Quieres empezar a ahorrar creando una meta?'}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Después
            </button>
            <button
              type="button"
              onClick={hasGoals ? handleAddToGoal : handleCreateGoal}
              className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {hasGoals ? 'Agregar a Meta' : 'Crear Meta'}
            </button>
          </div>
        </div>
      </div>

      {/* Goal Picker Drawer (if multiple goals) */}
      {showGoalPicker && (
        <GoalPickerDrawer
          open={showGoalPicker}
          onClose={() => setShowGoalPicker(false)}
          goals={activeGoals}
          onSelect={openTransactionForm}
        />
      )}
    </>
  );
}
```

#### 2.4. Nuevo Componente: `GoalPickerDrawer`

**Archivo**: `src/features/savings/components/GoalPickerDrawer.tsx`

Similar a `CategoryPickerDrawer`, pero para seleccionar una meta de ahorro.

```tsx
type Props = {
  open: boolean;
  onClose: () => void;
  goals: Budget[];
  onSelect: (goal: Budget) => void;
};
```

#### 2.5. Integrar en HomePage

**Archivo**: `src/pages/HomePage.tsx`

```tsx
import { useEffect, useState } from 'react';
import SavingsReminderModal from '@/features/savings/components/SavingsReminderModal';

export default function HomePage() {
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsData, setSavingsData] = useState<{ balance: number; hasGoals: boolean } | null>(null);

  // Listen for savings reminder event
  useEffect(() => {
    const handleSavingsReminder = (event: CustomEvent) => {
      setSavingsData({
        balance: Number(event.detail.balance) || 0,
        hasGoals: event.detail.hasGoals === 'true' || event.detail.hasGoals === true,
      });
      setShowSavingsModal(true);
    };

    window.addEventListener('show-savings-reminder-modal', handleSavingsReminder as EventListener);

    // Check sessionStorage on mount (in case app was opened from notification)
    try {
      const pending = sessionStorage.getItem('pending-savings-reminder');
      if (pending) {
        const data = JSON.parse(pending);
        setSavingsData({
          balance: Number(data.balance) || 0,
          hasGoals: data.hasGoals === 'true' || data.hasGoals === true,
        });
        setShowSavingsModal(true);
        sessionStorage.removeItem('pending-savings-reminder');
      }
    } catch { /* ignore */ }

    return () => {
      window.removeEventListener('show-savings-reminder-modal', handleSavingsReminder as EventListener);
    };
  }, []);

  return (
    <div>
      {/* ... existing home content ... */}

      {/* Savings Reminder Modal */}
      {savingsData && (
        <SavingsReminderModal
          open={showSavingsModal}
          onClose={() => setShowSavingsModal(false)}
          balance={savingsData.balance}
          hasGoals={savingsData.hasGoals}
        />
      )}
    </div>
  );
}
```

#### 2.6. Actualizar AddEditTransactionPage

**Archivo**: `src/features/transactions/pages/AddEditTransactionPage.tsx`

Agregar soporte para datos precargados via `location.state`:

```tsx
// Al inicio del componente, después de los hooks
useEffect(() => {
  if (initialized) return;

  if (tx) {
    // ... existing edit logic ...
  } else {
    // New transaction - check for prefilled data
    const prefilledData = location.state?.prefilledData;

    if (prefilledData) {
      setType(prefilledData.type || 'expense');
      setName(prefilledData.name || '');
      setCategoryId(prefilledData.categoryId || null);
      setAmount(prefilledData.amount || '');
      setDate(prefilledData.date || todayISO());
      setNotes(prefilledData.notes || '');

      // Clear state to avoid reusing on next visit
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // Check URL params
      const typeParam = searchParams.get('type');
      if (typeParam === 'income' || typeParam === 'expense') {
        setType(typeParam);
      }
    }
  }

  setInitialized(true);
}, [initialized, tx, searchParams, location.state]);
```

---

## 🔄 Flujo Completo

### Caso 1: Usuario CON metas activas

```
1. Último día del mes, 9:00 AM UTC
   ↓
2. Cron job ejecuta Edge Function
   ↓
3. Edge Function verifica usuarios elegibles
   - Usuario tiene balance positivo: $500.000
   - Usuario tiene 2 metas activas
   ↓
4. Envía push notification:
   "¡Mes exitoso! Tienes un balance positivo de $500.000.
    ¿Lo destinas a tus metas?"
   ↓
5. Usuario toca la notificación
   ↓
6. App abre → HomePage
   ↓
7. Se muestra SavingsReminderModal con:
   - Balance: $500.000
   - Botón: "Agregar a Meta"
   ↓
8. Usuario hace click en "Agregar a Meta"
   ↓
9. Se muestra GoalPickerDrawer con las 2 metas:
   - "Vacaciones" (categoría: Viajes)
   - "Fondo de emergencia" (categoría: Ahorro)
   ↓
10. Usuario selecciona "Vacaciones"
    ↓
11. Se abre AddEditTransactionPage con datos precargados:
    - type: "expense"
    - categoryId: "viajes-id"
    - amount: "500000"
    - date: "2026-01-31" (hoy)
    - notes: "Ahorro automático del mes de enero 2026"
    ↓
12. Usuario puede ajustar el monto si desea
    ↓
13. Usuario guarda → Transacción registrada
```

### Caso 2: Usuario SIN metas activas

```
1-7. [Igual que arriba hasta modal]
   ↓
8. Usuario hace click en "Crear Meta"
   ↓
9. Se abre AddEditBudgetModal con:
   - type: "goal"
   - (usuario configura su meta)
   ↓
10. Usuario crea meta "Ahorro" con categoría "Ahorro General"
    ↓
11. Se abre AddEditTransactionPage con datos precargados:
    - type: "expense"
    - categoryId: "ahorro-general-id"
    - amount: "500000"
    - date: "2026-01-31"
    - notes: "Ahorro automático del mes de enero 2026"
    ↓
12-13. [Igual que arriba]
```

---

## 🧪 Casos Edge

### Edge Case 1: Balance negativo
**Escenario**: Usuario tiene más gastos que ingresos este mes.
**Acción**: No enviar notificación.

### Edge Case 2: Balance muy pequeño (<$1.000)
**Escenario**: Balance positivo pero insignificante.
**Opción A**: Enviar igual (motivar micro-ahorros).
**Opción B**: No enviar si balance < umbral mínimo.
**Decisión**: **Opción A** - enviar igual.

### Edge Case 3: Usuario tiene metas pero ya las completó
**Escenario**: Todas las metas con `isCompleted = true`.
**Acción**: Tratar como "sin metas activas" → sugerir crear nueva meta.

### Edge Case 4: Usuario cierra modal sin acción
**Escenario**: Usuario toca "Después".
**Acción**: Modal se cierra, no se vuelve a mostrar este mes.

### Edge Case 5: Usuario abre app sin tocar la notificación
**Escenario**: Notificación queda en bandeja, usuario abre app manualmente.
**Acción**: No mostrar modal automáticamente. Solo si toca la notificación.

### Edge Case 6: Múltiples dispositivos
**Escenario**: Usuario tiene iPhone y Android, ambos con tokens activos.
**Acción**: Enviar a ambos dispositivos. Modal solo aparece en el que abra primero.

### Edge Case 7: Cron job falla
**Escenario**: Edge Function no se ejecuta o falla.
**Acción**: No reintento automático. Se enviará el próximo mes.

### Edge Case 8: Usuario desactiva notificaciones después de recibirla
**Escenario**: Notificación ya enviada, usuario desactiva preferencia.
**Acción**: Modal aún aparece si ya está en sessionStorage. Próximos meses no recibirá.

---

## ⚙️ Configuración de Preferencias

### UI en Settings (Perfil)

Agregar toggle en `src/pages/SettingsPage.tsx` (sección de notificaciones):

```tsx
<div className="flex items-center justify-between py-3">
  <div>
    <p className="font-medium text-gray-900">
      Recordatorio de Ahorro Mensual
    </p>
    <p className="text-xs text-gray-500">
      Último día del mes si tienes balance positivo
    </p>
  </div>

  <button
    type="button"
    onClick={handleToggleMonthlySavings}
    className={`relative h-8 w-14 shrink-0 rounded-full transition-all ${
      preferences?.monthly_savings_reminder
        ? 'bg-emerald-500'
        : 'bg-gray-300'
    }`}
  >
    <span
      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
        preferences?.monthly_savings_reminder
          ? 'translate-x-6'
          : 'translate-x-0'
      }`}
    />
  </button>
</div>
```

---

## 📊 Analytics (Opcional)

Datos útiles para trackear:

1. **Tasa de apertura**: % de usuarios que abren la notificación
2. **Tasa de conversión**: % que completan transacción de ahorro
3. **Monto promedio ahorrado**: AVG(balance)
4. **Opt-out rate**: % que desactivan la notificación

Implementar con:
- Supabase Analytics
- Firebase Analytics
- Custom logging en `notification_history`

---

## 🚀 Plan de Implementación

### Fase 1: Backend (2-3 días)

1. ✅ **Migración de tipos**
   - [ ] Crear `YYYYMMDD_add_monthly_savings_reminder.sql`
   - [ ] Agregar `monthly_savings_reminder` a `notification_type` enum
   - [ ] Actualizar default preferences en `push_tokens`

2. ✅ **Edge Function**
   - [ ] Crear `supabase/functions/send-monthly-savings-reminder/index.ts`
   - [ ] Implementar lógica de selección de usuarios elegibles
   - [ ] Implementar cálculo de balance mensual
   - [ ] Implementar envío de notificaciones vía FCM
   - [ ] Agregar soporte multilenguaje (es, en, pt, fr)
   - [ ] Agregar logging a `notification_history`

3. ✅ **Cron Job**
   - [ ] Crear migración `YYYYMMDD_add_monthly_savings_cron.sql`
   - [ ] Configurar cron diario con verificación de último día
   - [ ] Probar manualmente desde Supabase Dashboard

4. ✅ **Testing Backend**
   - [ ] Test unitario: `calculateMonthBalance`
   - [ ] Test unitario: `buildNotificationPayload`
   - [ ] Test de integración: ejecutar función manualmente
   - [ ] Verificar logging en `notification_history`

### Fase 2: Frontend - Tipos y Servicios (1 día)

5. ✅ **Actualizar tipos**
   - [ ] Agregar `monthly_savings_reminder` a `NotificationType`
   - [ ] Actualizar `NotificationPreferences` con nuevo flag
   - [ ] Actualizar `DEFAULT_NOTIFICATION_PREFERENCES`

6. ✅ **Actualizar servicios**
   - [ ] Modificar `handleNotificationTap` en `pushNotification.service.ts`
   - [ ] Agregar custom event `show-savings-reminder-modal`
   - [ ] Agregar sessionStorage handling

### Fase 3: Frontend - Componentes (2-3 días)

7. ✅ **SavingsReminderModal**
   - [ ] Crear componente base con diseño
   - [ ] Implementar lógica para usuarios con metas
   - [ ] Implementar lógica para usuarios sin metas
   - [ ] Integrar con navegación a form
   - [ ] Agregar animaciones (fade + scale)

8. ✅ **GoalPickerDrawer**
   - [ ] Crear drawer para selección de metas
   - [ ] Listar metas activas con info de progreso
   - [ ] Implementar selección y callback
   - [ ] Añadir animación de slide-up

9. ✅ **Integración en HomePage**
   - [ ] Agregar listener de evento custom
   - [ ] Agregar check de sessionStorage al mount
   - [ ] Renderizar SavingsReminderModal condicionalmente
   - [ ] Probar flujo completo

10. ✅ **Actualizar AddEditTransactionPage**
    - [ ] Agregar soporte para `location.state.prefilledData`
    - [ ] Pre-fill campos: type, category, amount, notes
    - [ ] Limpiar state después de cargar
    - [ ] Probar precarga de datos

### Fase 4: Settings & Preferencias (1 día)

11. ✅ **UI de Preferencias**
    - [ ] Agregar toggle en SettingsPage
    - [ ] Conectar con `updatePreferences` del service
    - [ ] Mostrar descripción clara
    - [ ] Agregar feedback visual al cambiar

### Fase 5: Testing E2E (2 días)

12. ✅ **Testing Manual**
    - [ ] Test: Usuario con balance positivo + con metas
    - [ ] Test: Usuario con balance positivo + sin metas
    - [ ] Test: Usuario con balance negativo (no debe enviar)
    - [ ] Test: Usuario con balance positivo pero sin token activo
    - [ ] Test: Quiet hours (no enviar)
    - [ ] Test: Ya recibió notificación este mes (no duplicar)
    - [ ] Test: Selección de meta con múltiples opciones
    - [ ] Test: Creación de meta desde modal
    - [ ] Test: Precarga de datos en formulario
    - [ ] Test: Guardar transacción de ahorro

13. ✅ **Testing de Edge Cases**
    - [ ] Balance muy pequeño (<$1.000)
    - [ ] Metas completadas (sugerir crear nueva)
    - [ ] Cerrar modal sin acción
    - [ ] Abrir app sin tocar notificación
    - [ ] Múltiples dispositivos
    - [ ] Desactivar preferencia

### Fase 6: Documentación y Deploy (1 día)

14. ✅ **Documentación**
    - [ ] Actualizar README con nueva notificación
    - [ ] Documentar formato de notificación en código
    - [ ] Agregar comentarios en funciones complejas

15. ✅ **Deploy**
    - [ ] Deploy de migraciones a Supabase producción
    - [ ] Deploy de Edge Function
    - [ ] Configurar cron job en producción
    - [ ] Verificar secrets en Vault
    - [ ] Probar en staging primero
    - [ ] Deploy de app (frontend)

### Fase 7: Monitoreo (Continuo)

16. ✅ **Monitoreo Post-Launch**
    - [ ] Revisar logs de Edge Function diariamente (primera semana)
    - [ ] Verificar `notification_history` para envíos exitosos
    - [ ] Monitorear tasa de apertura y conversión
    - [ ] Revisar feedback de usuarios
    - [ ] Ajustar textos si es necesario

---

## 📝 Notas de Implementación

### Fecha de Trigger

**Decisión**: Ejecutar cron diariamente, pero verificar en la función si es último día del mes.

**Alternativa**: Usar cron expression más complejo para ejecutar solo último día:
```cron
0 9 28-31 * * # Ejecuta días 28-31, función verifica si es último día
```

**Por qué diaria es mejor**:
- Más simple y predecible
- Evita errores con meses de 28, 29, 30 o 31 días
- La función es ligera (early return si no es último día)

### Cálculo de Balance

**Opción 1**: Calcular en Edge Function (consultar user_state)
**Opción 2**: Pre-calcular con otra Edge Function y guardar en tabla

**Decisión**: **Opción 1** - calcular en runtime.

**Por qué**:
- User_state ya tiene toda la data necesaria
- No requiere tabla adicional
- Balance debe ser real-time (último día puede tener txs nuevas)

### Multilenguaje

Usar `device_info.language` del token para determinar idioma.

Textos a traducir:
- Título: "¡Mes exitoso!" / "Successful Month!"
- Body (con metas): "Tienes un balance positivo de $XXX. ¿Lo destinas a tus metas?"
- Body (sin metas): "Tienes un balance positivo de $XXX. ¿Empiezas a ahorrar?"
- Modal: Todos los textos del modal

### Seguridad

- Edge Function usa service_role key → Acceso total a DB
- No exponer service_role en cliente
- Validar user_id en todas las queries
- Rate limiting en Edge Function (1 ejecución/día)

---

## 🎨 Diseño del Modal

### Especificaciones Visuales

- **Overlay**: `bg-black/50`
- **Card**: `rounded-2xl bg-white p-6 shadow-xl max-w-sm`
- **Icon container**: `h-16 w-16 rounded-full bg-emerald-100`
- **Icon**: `TrendingUp` o `PiggyBank` de lucide-react, `h-8 w-8 text-emerald-600`
- **Title**: `text-xl font-bold text-gray-900 text-center mb-2`
- **Balance**: `text-3xl font-bold text-emerald-600 text-center mb-4`
- **Description**: `text-sm text-gray-600 text-center mb-6`
- **Buttons**:
  - Cancel: `flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700`
  - Primary: `flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white`

### Animación

```tsx
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  if (open) {
    requestAnimationFrame(() => setIsVisible(true));
  } else {
    setIsVisible(false);
  }
}, [open]);

// Overlay
className={`... transition-opacity duration-200 ${
  isVisible ? 'opacity-100' : 'opacity-0'
}`}

// Card
className={`... transition-all duration-200 ${
  isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
}`}
```

---

## 🔮 Mejoras Futuras

1. **Sugerencia de Monto Inteligente**:
   - Si balance > meta remaining → sugerir monto exacto para completar meta
   - Si balance < meta remaining → sugerir % del balance (50%, 80%, 100%)

2. **Historial de Ahorros Mensuales**:
   - Gráfica en Stats mostrando ahorros mensuales acumulados
   - "Este año has ahorrado $XXX gracias a esta feature"

3. **Recordatorio a Mitad de Mes**:
   - "Vas bien, ya llevas $XXX de ahorro este mes"

4. **Gamificación**:
   - Racha de meses consecutivos ahorrando
   - Badges por alcanzar metas

5. **Notificación de Meta Completada**:
   - Cuando complete una meta, enviar notificación de felicitación

---

## ✅ Checklist Final

- [ ] Migración de tipos creada y aplicada
- [ ] Edge Function implementada y testeada
- [ ] Cron job configurado en Supabase
- [ ] Tipos frontend actualizados
- [ ] Push notification handler actualizado
- [ ] SavingsReminderModal implementado
- [ ] GoalPickerDrawer implementado
- [ ] Integración en HomePage
- [ ] AddEditTransactionPage soporta precarga
- [ ] Settings page tiene toggle de preferencia
- [ ] Testing manual completo
- [ ] Testing de edge cases
- [ ] Documentación actualizada
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Deploy a producción
- [ ] Monitoreo activo primera semana

---

## 📚 Referencias

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Capacitor Firebase Messaging](https://github.com/capawesome-team/capacitor-firebase)

---

**Última actualización**: 2026-01-29
**Autor**: Claude Code
**Estado**: 📝 En Planeación
