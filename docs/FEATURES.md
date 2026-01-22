# SmartSpend - Características

## Resumen

SmartSpend es una aplicación PWA de control de gastos personales con enfoque local-first. Los datos se almacenan en el dispositivo y opcionalmente se sincronizan con la nube.

---

## Gestión de Transacciones

### Registro de Movimientos
- Gastos e ingresos con monto, descripción, fecha y categoría
- Estados: Pagado, Pendiente, Planeado
- Notas opcionales por transacción
- Formulario optimizado para móvil con teclado numérico

### Transacciones Programadas
- Configuración de recurrencia: diaria, semanal, mensual, anual
- Intervalos personalizables (cada 2 semanas, cada 3 meses, etc.)
- Visualización de transacciones futuras (virtuales) en el listado
- Confirmación individual o edición antes de registrar
- Desactivación de programaciones (irreversible)
- Panel de gestión de programadas (Perfil → Programadas)

### Listado y Filtros
- Vista mensual con navegación por meses
- Agrupación por día con totales
- Búsqueda por nombre o categoría
- Filtros: Gastos, Ingresos, Pendientes, Exportar

---

## Categorías

### Gestión de Categorías
- Categorías predefinidas para gastos e ingresos
- Creación de categorías personalizadas
- Iconos y colores personalizables
- Categorías separadas por tipo (gasto/ingreso)

### Grupos de Categorías
- Agrupación de categorías relacionadas
- Presupuestos mensuales por grupo
- Visualización de progreso vs presupuesto

---

## Presupuesto

### Vista de Presupuesto
- Resumen mensual: ingresos vs gastos
- Balance disponible
- Progreso por grupo de categorías
- Indicadores visuales de cumplimiento

### Detalle por Categoría
- Historial de gastos por categoría
- Comparativa mensual

---

## Estadísticas

### Gráficos y Análisis
- Distribución de gastos por categoría (gráfico de dona)
- Tendencia mensual de ingresos y gastos
- Top categorías con mayor gasto
- Comparativa entre períodos

---

## Viajes

### Gestión de Viajes
- Registro de viajes con nombre, fechas y presupuesto
- Gastos asociados al viaje
- Categorías específicas para viajes
- Resumen de gastos por viaje
- Tracking de presupuesto vs gastado

---

## Backup y Sincronización

### Modo Local (Guest)
- Datos almacenados en localStorage
- Backups automáticos cada 7 días
- Exportación manual de datos (JSON)
- Restauración desde archivo

### Modo Cloud
- Autenticación con Supabase
- Sincronización automática con la nube
- Backups automáticos en cloud storage
- Funcionamiento offline-first (cambios pendientes se sincronizan al reconectar)

---

## Interfaz y Experiencia

### PWA
- Instalable en dispositivos móviles
- Funcionamiento offline
- Actualización automática

### Diseño
- Mobile-first, optimizado para touch
- Navegación inferior (Home, Budget, Stats, Trips)
- Interfaz en español (es-CO)
- Temas claros con acentos de color por tipo de transacción

---

## Perfil y Configuración

### Opciones de Usuario
- Gestión de categorías
- Gestión de programadas
- Backup y restauración
- Información de cuenta (modo cloud)
