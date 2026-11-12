# Validación de notificaciones y Mercado Pago · 9 de noviembre de 2026

App y servidor se prepararon desde `main` actualizado, en la rama
`codex/notificaciones-mercado-pago` de cada repositorio. El repositorio
AHRE-MP-MOVIMIENTOS se consultó como referencia sin modificarlo.

| Comprobación | Resultado |
| --- | --- |
| TypeScript de app y herramientas | Correcto. |
| TypeScript de backend y pruebas | Correcto. |
| Suite completa de APP-AHRE con backend y MySQL | 450 aprobadas, sin fallos ni omisiones. |
| Suite completa de SERVER-AHRE con MySQL | 73 aprobadas, sin fallos ni omisiones. |
| Casos específicos de inicialización, depósito, MP offline y planificación | 52 aprobados. |
| Exportación Android Metro/Hermes | Correcta; no genera APK. |
| Compose y flujo n8n | YAML/JSON válidos; ejecución Docker no comprobada. |

Se utilizó el binario MySQL 8.4.3 existente, con `--no-defaults`, una carpeta nueva,
`127.0.0.1:13317` y MySQL X desactivado. Se comprobó `@@datadir` y `@@port` antes
de escribir. Las suites crearon bases propias; al terminar se detuvo esa instancia
y se eliminaron únicamente sus carpetas temporales. No se usaron datos ni el
servicio habitual de Laragon.

Los casos nuevos verifican registro MP atómico offline, idempotencia, históricos,
ignorar/recuperar, asociación sin doble impacto, descarte al eliminar el depósito,
lectura independiente de resolución, horarios y cambio de zona, cuotas concurrentes,
PKCE/cancelación, cifrado autenticado, páginas Search con fallo de red y recibos push.
Search y Expo se simularon en los casos de transporte; no se consultaron cuentas
Mercado Pago reales ni se enviaron avisos a dispositivos reales.

Se agregaron contadores en el depósito, destinos contextuales de sala y
comprobación de canales Android. La presentación visual, batería, reinicio,
OAuth completo, cobertura real de Search y push en un Android físico requieren
la configuración externa de la [guía del servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).

Los recordatorios locales preparan 60 días, renovables al abrir la app. La entrega
no promete ejecución JavaScript mientras está cerrada ni recepción de eventos
nuevos del servidor sin internet. Expo Go omite el token remoto y conserva las
funciones locales compatibles; puede mostrar la advertencia informativa propia
de expo-notifications sobre sus límites.

La validación inicial del 9/11 no publicó ramas, PRs, APK ni despliegues.

## Cierre de versión · 11 de noviembre de 2026

- App 0.9.0/build 14 y backend 0.3.0; changelogs actualizados por pedido
  explícito del líder antes de abrir los PR.
- TypeScript de app, herramientas, backend y pruebas correcto.
- Suite completa de app: 463 aprobadas, cero fallos y cero omisiones, incluyendo
  integración real contra backend y MySQL aislado. Backend: 97 aprobadas, sin
  fallos ni omisiones. Instancia MySQL 8.4.3 temporal, loopback 13327.
- Los nuevos casos comprueban borradores de descripción offline, incorporación
  con texto personalizado sin sobrescribir el original, rechazo atómico de
  descripciones vacías, avisos persistentes de éxito/error e identificación
  antigua sin consumir usos. Los ensayos Search/push emplean datos sintéticos.
- Se actualizaron los adaptadores de la prueba de rendimiento del depósito
  para aislar la consulta de vinculación MP; permanecen las verificaciones
  de 10.000 movimientos y paginación del componente real.
- El usuario confirmó la reparación real: seis ingresos y seis egresos. Esto
  no acredita que Search entregue rendimientos ni todas las clases de movimientos.
- Pendiente configuración Firebase/FCM v1 y comprobación nativa de push,
  permisos, app cerrada, reinicio y modo avión en Android físico.
- No se despliega el servidor ni se publican APK en la landing durante este cierre.

## Ajustes de tarjetas · 12 de noviembre de 2026

Indicadores de movimientos por registrar en salas abiertas y cerradas, suma
en Gastos y distribución por gasto sin aumentar la altura de las tarjetas.
Los pagos de deudas sin gasto asociado se muestran en Pagos por registrar
y abren el formulario existente con la operación correcta. La selección previa
al cierre reduce pendientes sin registrar dinero anticipadamente.

Etiquetas sobre importes compartidas por movimientos, deudas, recurrencias,
MP, salas, gastos y balances: dos segundos al inicio, recorrido de un segundo
y dos segundos al final antes de reiniciar. Se midieron ancho y escala de fuente;
se conservan accesibilidad y desplazamiento manual con Reducir movimiento.
Las etiquetas financieras indicadas por el líder usan peso regular y colores
para distinguir importe, estado y revisión pendiente. Demos existentes actualizadas
sin borrar decisiones ni añadir cargos por mostrar ejemplos.

TypeScript correcto. Última ejecución: 57 pruebas (Social y etiqueta animada)
aprobadas, sin fallos ni omisiones; comprobación de varias repeticiones y pausas
con reloj simulado. Antes del ajuste de pausas, 84 pruebas de tarjetas, listas
y Social aprobadas. La animación nativa requiere revisión visual en el teléfono.
Este commit no incluye ajustes al comportamiento de plegado del encabezado.
