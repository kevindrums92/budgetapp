🚀 Tarea: Implementación de Metas de Ahorro (Modelo "Piggy Bank")
📋 Contexto
Queremos transformar el módulo de Budget para que soporte dos tipos de comportamiento: Límites de Gasto (restrictivos) y Metas de Ahorro (acumulativos). Para las metas, utilizaremos el modelo de "Hucha": el usuario registra transacciones de "salida" hacia una meta, lo que reduce su balance disponible pero aumenta el progreso de su objetivo.

🛠️ Especificaciones Técnicas
1. Evolución del Modelo de Datos 
No creo conveniente una migración de schema, puesto que todos los usuarios ahora mismo tiene budget vacio

Añadir al objeto Budget la propiedad:

type: 'limit' | 'goal' (Default: 'limit').

2. Lógica de Acumulación (Modelo Piggy Bank)
El cálculo del progreso de un presupuesto dependerá de su type:

Para type: 'limit' (Comportamiento actual):

Se suman las transacciones para ver cuánto se ha consumido del límite.

UX: Color Rojo si se supera el 100%. Texto: "Restante".

Para type: 'goal' (Nuevo comportamiento):

Lógica: El sistema sumará el valor de las transacciones asociadas a la categoría de la meta.

Impacto en Balance: Estas transacciones deben restar del balance general (el dinero ya no está "disponible" para gastar), pero sumar al progreso de la meta.

UX: Color Teal (#18B7B0) siempre. El 100% es un estado de éxito, no de alerta.

3. Interfaz de Usuario (UI/UX)
A. Listado de Presupuestos (Cards)
Diferenciar el renderizado según el type:

Límites: Mostrar cuánto queda disponible antes de excederse.

Metas: Mostrar cuánto se ha "aportado" y cuánto falta para el objetivo.

Ejemplo de texto: "Llevas $400.000 de $1.000.000. ¡Faltan $600.000!"

B. Header del Módulo
Sustituir el resumen global por un Health Check:

"Tienes [X] límites excedidos" (Si hay limits > 100%).

"Has completado el [X]% de tus metas de ahorro" (Promedio ponderado de los goals).

C. Formulario de Creación
Añadir un selector inicial (Step 0) que pregunte:

"Quiero controlar un gasto" (Crea un limit).

"Quiero ahorrar para una meta" (Crea un goal).

D. pensar en un reombre de la funcionalidad. Actualmente la llamamos budget.
Aqui te dejo un poco lo que me propuso un asistente 

Esa es una excelente pregunta. La palabra "Budget" (Presupuesto) suele sentirse pesada, técnica y, sobre todo, muy enfocada a la restricción. Si ahora vas a incluir metas de ahorro, el nombre debería ser más aspiracional y abarcar ambos conceptos.

Aquí te doy mis mejores opciones para renombrar el módulo, dependiendo de la personalidad que quieras darle a SmartSpend:

1. "Plan" (Mi favorita)
Es corta, clara y bilingüe (funciona perfecto en español e inglés).

Por qué funciona: Planear implica tanto "cuánto voy a gastar" (límites) como "qué quiero lograr" (metas).

En la UI: La pestaña se llamaría "Plan" o "Mi Plan".

2. "Objetivos" (Focus en resultados)
Si quieres que la app se sienta como una herramienta para progresar.

Por qué funciona: Un límite es un objetivo de control y una meta es un objetivo de ahorro.

En la UI: Se siente muy limpio. "Vamos a ver mis Objetivos de este mes".

3. "Control" (Focus en orden)
Si SmartSpend quiere posicionarse como la app para quienes sienten que el dinero se les escapa de las manos.

Por qué funciona: Engloba el tener bajo control lo que sale y asegurar lo que se guarda.

4. "Límites y Metas" (Descriptivo)
Es la opción más clara, aunque un poco larga para el menú inferior (BottomBar).

Por qué funciona: No hay pérdida. El usuario sabe exactamente qué va a encontrar ahí.

💡 Mi Recomendación: "Plan"
Si decides cambiarlo a "Plan", el prompt para tu equipo debería incluir este cambio de naming para mantener la consistencia:

Actualización de Naming:

Renombrar el módulo de Budget a Plan.

Actualizar el label en la BottomBar y los headers de las páginas.

El concepto ahora es: "Tú defines el plan, SmartSpend te ayuda a cumplirlo".

Cómo se vería el menú inferior:
Home | Plan | Stats | Settings





------------------------------------------------------

🌍 i18n y Adaptaciones
Actualizar namespaces (es, en, fr, pt) con strings como:

"Estás a {{amount}} de cumplir tu meta"

"Llevas ahorrado {{amount}}"

"Meta alcanzada"

"¿Qué quieres hacer? / Controlar gasto / Ahorrar para meta"

✅ Criterios de Aceptación
[ ] Las transacciones asociadas a una Meta deben restar del Balance Home (Imagen 2) para que el usuario sienta que el dinero está "apartado".

[ ] El progreso de las Metas debe mostrarse en color Teal (#18B7B0) y nunca cambiar a rojo.

[ ] El usuario puede ver claramente en el listado qué items son límites y cuáles son ahorros.

[ ] La migración de base de datos debe ser transparente y marcar todos los presupuestos existentes como limit.

El componente ProgressBar debe recibir el color como prop según el tipo de presupuesto.