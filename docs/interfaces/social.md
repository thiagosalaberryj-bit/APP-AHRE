# Social: salas y gastos compartidos

## Finalidad y alcance

Social presenta personas, deudas individuales y salas para gastos de una ocasión. Esta etapa del Issue #18 es un maquetado con datos simulados. Nada se guarda ni se comparte con otras personas y ninguna vista necesita Internet.

## Pantalla principal: personas, deudas y salas

La pestaña **Social** se abre desde la barra inferior, también disponible al estar en Dashboard. La primera sección lista personas registradas de ejemplo e indica con texto si **me deben**, **yo debo** o si estamos al día. **Registrar deuda** muestra un formulario visual que permite elegir una persona y una de las dos direcciones de la deuda, sin asociarla a una sala. **Registrar persona** muestra nombre y correo opcional. Confirmar cualquiera de los formularios informa que el guardado local queda pendiente.

Debajo aparecen **Salas recientes** para encuentros concretos, con nombre, fecha, cantidad de participantes y descripción. Los ejemplos son **Cena del viernes** y **Asado del domingo**. **Historial de salas cerradas** muestra una salida pasada; tocarla permite consultar su detalle sin ofrecer nuevas acciones de registro. **Ver ejemplo sin salas** representa el estado vacío y mantiene las acciones **Crear sala** y **Unirse a sala**.

## Crear o ingresar a una sala

**Crear sala** abre un modal con nombre de la ocasión, fecha, descripción opcional, **Crear** y **Cancelar**. **Unirse a sala** abre otro modal con un campo para un posible código o identificador, **Unirse** y **Cancelar**. El mecanismo de unión todavía no está definido. Esta vista es solo visual y no hace solicitudes de red. Confirmar no agrega ni modifica salas.

## Detalle de sala

El detalle reutiliza `SocialScreen.js` en la ruta secundaria `SalaSocial` del Stack principal. Así muestra el encabezado secundario y **no muestra la barra inferior**. Presenta nombre, fecha, estado abierta/cerrada, descripción y cantidad de participantes. Tres secciones internas permiten recorrer **Participantes**, **Gastos** y **Balances**. La flecha y **Volver a Social** regresan a la pestaña. No se creó un archivo de pantalla nuevo ni se alteró la barra de otras rutas.

### Participantes

Cada fila muestra iniciales como avatar, nombre y un resumen de su situación dentro de la sala, separado de las deudas personales de la pantalla principal. En salas abiertas, **Agregar participantes** abre una lista seleccionable de las personas registradas de ejemplo que todavía no están en esa sala. La selección se refleja durante la visita al detalle, pero no se guarda. Las salas cerradas solo permiten consultar integrantes.

### Gastos compartidos

Cada gasto muestra descripción, monto, quién pagó, fecha y distribución resumida. Al tocarlo se abre un modal de detalle. Cena del viernes tiene un gasto de ejemplo. Asado del domingo muestra **Todavía no hay gastos**.

**Agregar gasto** abre un formulario visual con descripción, monto, quién pagó y participantes involucrados. Los dos últimos campos indican el lugar de los selectores futuros. Confirmar informa que la acción estará disponible más adelante. No divide importes ni registra un gasto.

### Balances y distribución

El resumen de Cena del viernes representa con texto e iconos una persona que debe, otra que debe recibir y otra saldada. Un bloque **Detalle de distribución** reserva el lugar para explicar posteriormente las relaciones de deuda. Asado del domingo y la sala cerrada representan **Sin balances pendientes**. Todavía no hay cálculos ni deudas reales.

## Estados y apariencia

La pantalla muestra brevemente **Cargando información** al entrar. **Ver ejemplo de error** permite mostrar la presentación de error y **Reintentar** vuelve a la lista; los datos simulados no producen errores reales. Se representan los estados vacíos de salas, gastos y balances con textos explícitos. **Cerrar sala** muestra una explicación visual del cierre; la sala no cambia de estado ni se guarda. El contenido se desplaza verticalmente, los apartados del detalle pueden desplazarse horizontalmente y los modales tienen altura limitada para adaptarse a pantallas pequeñas y al teclado.

Los estilos locales están en `src/styles/SocialScreenStyles.js` y reutilizan los tokens de `src/styles/colors.js` y `src/styles/globalStyles.js`. Los temas claro y oscuro provienen de la preferencia de apariencia común de AHRE.

## Navegación y trabajo pendiente

El recorrido es **Dashboard → pestaña Social → personas y deudas / salas recientes / historial → sala → Participantes / Gastos / Balances**. Desde Social se abren los modales **Registrar persona**, **Registrar deuda**, **Crear sala** y **Unirse a sala**; desde el detalle se abren **Agregar participantes**, **Agregar gasto**, **Cerrar sala** y el detalle de cada gasto. Los modales cubren la pantalla principal y no dependen de Internet.

Quedan para otro Issue la conexión real con las personas y deudas de SQLite, la creación y cierre persistentes de salas, el registro de gastos, la selección funcional de pagador y participantes, la división y el cálculo de balances. Una eventual unión entre dispositivos, invitaciones, sincronización o backend también queda fuera de esta maqueta offline.
