# Social: salas y gastos compartidos

## Finalidad y alcance

Social presenta una base visual para organizar gastos entre varias personas. Esta etapa del Issue #18 es un maquetado con datos simulados. Las salas, los gastos y los balances no se guardan ni se comparten con otras personas.

## Pantalla principal y salas

La pestaña **Social** se abre desde la barra inferior, también disponible al estar en Dashboard. Usa el encabezado principal de AHRE y muestra **Mis salas**, la cantidad de salas representadas y tarjetas con nombre, icono, cantidad de participantes y descripción breve. Los ejemplos son **Viaje Bariloche** y **Cena con amigos**. Tocar una tarjeta abre su detalle dentro de `SocialScreen.js`.

La acción **Ver ejemplo sin salas** permite comprobar el estado vacío sin cambiar ni borrar datos. Allí se muestra «Todavía no participás en ninguna sala» y permanecen visibles **Crear sala** y **Unirse a sala**. **Ver salas de ejemplo** recupera la lista simulada.

## Crear o ingresar a una sala

**Crear sala** abre un modal con nombre, descripción opcional, **Crear** y **Cancelar**. **Unirse a sala** abre otro modal con un campo para un posible código o identificador, **Unirse** y **Cancelar**. El mecanismo de unión todavía no está definido. Los campos son solo visuales: confirmar informa que la acción estará disponible en otra etapa y no agrega ni modifica salas.

## Detalle de sala

El detalle conserva la pantalla Social existente y cambia a un encabezado secundario con flecha de regreso. Presenta nombre, descripción, cantidad de participantes y gastos, además de **Agregar gasto**. Tres secciones internas permiten recorrer **Participantes**, **Gastos** y **Balances**. La flecha y **Volver a mis salas** regresan a la lista. No se creó una pantalla ni una ruta adicional.

### Participantes

Cada fila muestra iniciales como avatar, nombre, resumen individual y una etiqueta textual de balance. Viaje Bariloche representa cuatro personas; Cena con amigos, seis. Las etiquetas **Debe**, **Debe recibir** y **Saldado** acompañan los colores e iconos para que el estado no dependa solo del color.

### Gastos compartidos

Cada gasto muestra descripción, monto, quién pagó, fecha y distribución resumida. Al tocarlo se abre un modal de detalle. Viaje Bariloche tiene dos gastos de ejemplo. Cena con amigos muestra **Todavía no hay gastos**.

**Agregar gasto** abre un formulario visual con descripción, monto, quién pagó y participantes involucrados. Los dos últimos campos indican el lugar de los selectores futuros. Confirmar informa que la acción estará disponible más adelante. No divide importes ni registra un gasto.

### Balances y distribución

El resumen de Viaje Bariloche representa una persona que debe, dos que deben recibir y una saldada, con valores simulados. Un bloque **Detalle de distribución** reserva el lugar para explicar posteriormente las relaciones de deuda. Cena con amigos representa **Sin balances pendientes**. Todavía no hay cálculos ni deudas reales.

## Estados y apariencia

La pantalla muestra brevemente **Cargando salas** al entrar. **Ver ejemplo de error** permite mostrar la presentación de error y **Reintentar** vuelve a la lista; los datos simulados no producen errores reales. Se representan los estados vacíos de salas, gastos y balances con textos explícitos. El contenido se desplaza verticalmente, los apartados del detalle pueden desplazarse horizontalmente y los modales tienen altura limitada para adaptarse a pantallas pequeñas y al teclado.

Los estilos locales están en `src/styles/SocialScreenStyles.js` y reutilizan los tokens de `src/styles/colors.js` y `src/styles/globalStyles.js`. Los temas claro y oscuro provienen de la preferencia de apariencia común de AHRE.

## Navegación y trabajo pendiente

El recorrido es **Dashboard → pestaña Social → sala → Participantes / Gastos / Balances**. Desde Social también se abren los modales **Crear sala** y **Unirse a sala**; desde el detalle se abren **Agregar gasto** y el detalle de cada gasto.

Quedan para otra etapa la creación y unión reales, invitaciones, usuarios online, sincronización, backend, selección funcional de pagador y participantes, división de gastos, cálculo de balances, deudas reales y persistencia.
