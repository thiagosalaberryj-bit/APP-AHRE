# Notificaciones de AHRE

## Alcance

Este documento registra el maquetado de la pantalla de Notificaciones. En
esta etapa no hay notificaciones push ni locales, programación de
recordatorios, lectura desde base de datos, contador real, permisos del
dispositivo ni navegación contextual. Todo es simulado y solo en pantalla.

## Estructura de la pantalla

`src/screens/NotificationsScreen.js` es secundaria con `EncabezadoSeccion`
(«Notificaciones») y lista desplazable. Se abre desde el botón de
notificaciones del Dashboard; la flecha del encabezado regresa. El contenido
limita su ancho a 480 puntos y acompaña los temas claro y oscuro, incluidos
el modal y los controles.

Encima de la lista hay una fila con el conteo visual (`2 nuevas sin leer`,
`Estás al día`) y la rueda de ajustes que abre el modal de tipos de alerta.

## Información mostrada por notificación

`TarjetaNotificacion` (`src/components/NotificationCard.js`), coherente en
toda la lista:

- ícono AHRE a la izquierda en contenedor verde;
- título en negrita (nuevas) con fecha u horario a la derecha;
- mensaje en gris abajo (2 líneas, completo al expandir);
- etiqueta `Nueva` en las no leídas.

Datos simulados propios de AHRE (no promociones externas):

```text
Recordatorio (Hoy · 20:00)
Vencimiento próximo (Ayer · 09:00)
Dinero recibido (25/09)
Resumen semanal (20/09)
Deuda pendiente (18/09)
```

## Diferenciación visual de estados

Nueva: borde de foco, punto verde, título en negrita y etiqueta `Nueva`.
Revisada: tarjeta normal. La diferencia no depende solo del color (punto,
negrita y texto). Tocar una tarjeta la expande con el mensaje completo y la
marca como leída solo en pantalla, sin persistencia.

## Ajustes de tipos de alerta

El modal `Ajustes de notificaciones` lista `Recordatorios de registro,
Vencimientos y deudas, Movimientos recibidos, Resúmenes y novedades` con
`Conmutador` reutilizado y nota al pie. Todo visual, sin permisos ni
programación. El badge con cantidad en el Dashboard queda como observación
para un Issue futuro (el Issue actual lo excluye y tocaría el header
compartido).

## Estado vacío y estado de carga

- **Cargando:** skeleton de 3 líneas (~1 segundo simulado) con texto
  `Buscando avisos...`.
- **Vacío:** tarjeta con ícono y `No tenés notificaciones.`
- La lista soporta ninguna, pocas o muchas notificaciones con scroll
  vertical.

## Componentes utilizados

`SectionHeader`, `NotificationCard` (nuevo común), `Toggle` (reutilizado) y
tokens de `colors.js`/`globalStyles.js`. Estilos locales en
`src/styles/NotificationsScreenStyles.js`. Sin Internet ni servicios
externos.
