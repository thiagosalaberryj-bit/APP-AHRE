# Notificaciones y Mercado Pago

Implementación local del 9 de noviembre de 2026. Requiere publicar el backend
coordinado y preparar Firebase/Mercado Pago antes de validar servicios reales.
No se generó ni publicó una APK mediante estos cambios.

## Centro de notificaciones

Notificaciones consulta SQLite, con historial paginado y filtros Todas,
Pendientes y No vistas. Ver un aviso no resuelve la tarea. Las tarjetas conservan
ambos estados y abren deudas, salas, recurrencias, estadísticas, movimientos o
la revisión de Mercado Pago. Los destinos de push se validan y esperan el acceso
normal de la cuenta, incluida la biometría, sin abrir pantallas privadas desde Inicio.

Los ajustes por usuario permiten elegir tipos, hora, anticipación y zona horaria.
El interruptor general de Perfil controla los avisos del teléfono; no elimina el
historial. Los avisos ocultan detalles por defecto. Rechazar permisos no bloquea
la app: se muestra su estado y se ofrece abrir Ajustes sin volver a insistir.

Los recordatorios conocidos se programan mediante el sistema operativo para
funcionar sin conexión y con la app cerrada. Se preparan **60 días de fechas
concretas** y se renueva ese horizonte al usar la app; no se promete una
programación ilimitada si no vuelve a abrirse. La zona elegida se convierte a
instantes para respetar el horario de verano. Android puede demorar avisos y
no los garantiza después de Forzar detención hasta reabrir la aplicación.

Se cancelan o recalculan al registrar movimientos, resolver deudas, modificar
recurrencias, revisar pendientes y cambiar preferencias. El cierre mensual
invita a consultar estadísticas, sin mostrar cifras futuras o desactualizadas.
Los avisos de servidor se conservan aunque no se entregue su push.

## Mercado Pago

La fuente es exclusivamente `GET /v1/payments/search`. No se usan reportes ni se
presenta el resultado como el extracto completo de la cuenta. El servidor
autoriza cada cuenta con OAuth/PKCE; los tokens personales no llegan a la app ni
quedan en los flujos n8n. La dirección se determina por la identidad de la cuenta,
no por asumir que `regular_payment` significa un ingreso.

Desde un depósito activo y sincronizado se elige un rango orientativo de 1, 2 o
3 meses. La primera consulta recupera hasta 500 pagos recientes. Se muestran el
intervalo solicitado y, si se alcanza el límite, el inicio real recuperado.
Cada usuario y cada cuenta externa tienen una sola vinculación activa.

La app solicita una consulta automática al entrar con conexión, con límite
diario en el servidor, y admite dos manuales adicionales. Un worker separado
procesa las páginas con turnos entre usuarios; n8n supervisa su recuperación
cada minuto. Si no hay trabajos no consulta Mercado Pago. Cerrar la app no
cancela un trabajo iniciado. La ausencia durante varios días se recupera desde
el último tramo completo, con los límites de disponibilidad de Search.

Los resultados se muestran como pendientes, ignorados o registrados. Se puede
seleccionar hasta 500 por confirmación, registrar, ignorar, recuperar ignorados
o asociar un movimiento compatible existente. Desmarcar conserva el pendiente.
Las categorías propuestas son las existentes de AHRE; sin datos suficientes se
usa Transferencias o Transferencias recibidas según el sentido. Los pagos no
aprobados y las monedas distintas de ARS se muestran sin habilitar el registro.
La dirección desconocida exige confirmación. No hay conversión monetaria ni
transferencias automáticas entre dos depósitos.
Los pagos de importe cero se muestran con una explicación y pueden ignorarse;
no habilitan registro ni asociación financiera ni bloquean la descarga del resto.

Guardar una selección es transaccional: movimientos, saldo, asociación externa
y decisión pendiente se confirman o revierten juntos. Los históricos anteriores
al depósito reutilizan las reglas financieras existentes. Reintentar un pago
no duplica el movimiento. La sincronización confirma primero los movimientos
financieros y después la decisión externa; la descarga respeta decisiones offline.

La notificación de Mercado Pago sigue pendiente hasta resolver todos sus pagos,
aunque se haya visto. Puede recordar una vez al día mientras haya pendientes
conocidos. Los cambios posteriores de un pago registrado requieren revisión;
no editan silenciosamente el saldo.

## Desvinculación y eliminación

Ambas pueden hacerse offline. Se conservan los movimientos registrados, se
descartan los pendientes y se encola primero la cancelación remota. Eliminar
el depósito desactiva la vinculación en la misma transacción local. El backend
también cancela la vinculación al confirmar la baja del depósito.

Se conserva trazabilidad para impedir reimportaciones al vincular nuevamente.
Las respuestas de versiones anteriores se descartan. Hasta que el servidor
conozca una baja offline podría llegar un aviso de un trabajo ya iniciado.

## Datos y entorno

`001_initialSchema.ts` define `avisos_locales`, `programaciones_avisos`,
`integraciones_locales` e `integraciones_outbox`. Son auxiliares: no modifican
el protocolo financiero 3 ni requieren una migración de transformación. Las
bases existentes reciben únicamente las tablas auxiliares que faltan; un inicio
con el esquema ya preparado conserva la apertura sin escrituras.

Expo Go conserva interfaz, SQLite, revisión, sincronización y recordatorios
locales compatibles. El registro de token push remoto se omite allí. La prueba
completa requiere una APK propia, un Android físico y FCM v1 configurado.

### Revisión de interfaz · 11 de noviembre

El acceso está en Detalle del depósito → Opciones (tres puntos) → Mercado Pago,
con el contador de pendientes cuando hay vinculación. No se intercala un botón
de vinculación entre el saldo y las pestañas de movimientos.
La revisión actualiza la vinculación al recuperar foco y al volver del navegador.
Deslizar hacia abajo recupera resultados del servidor sin solicitar una nueva
búsqueda. Buscar movimientos solicita una manual y se deshabilita durante una
consulta activa o al consumir el cupo. Renovar autorización y desvincular están
en las opciones del depósito, junto a la entrada de Mercado Pago.
El retorno a Expo Go se hace manualmente; el enlace de esquema `ahre://` del
servidor puede abrir una APK instalada. No se modificó ese enlace en esta revisión.

El resumen usa el contenedor de superficie habitual y destaca la cantidad por
revisar. El botón muestra las manuales disponibles del cupo de dos, centradas; la automática es
independiente. Se muestra cuándo se habilita la próxima automática en la zona
configurada: se pide al entrar con conexión, sin una ejecución programada fija.
Desde el resumen se abre un modal con el historial de las últimas 20 consultas,
con clase, estado, período, novedades, errores y límite inicial alcanzado.

Las tarjetas reutilizan medidas y tipografía de los registros financieros.
Los movimientos se ordenan del más reciente al más antiguo y se agrupan por día
antes de limitar las filas visibles. El slider conserva el componente segmentado
habitual. Tocar una tarjeta abre directamente el mismo modal de categorías de
ingresos y egresos. El control compacto de la derecha solo selecciona.
Las opciones se consultan tocando la tarjeta; no hay tres puntos.
La hora queda a la altura de la categoría, fuera de la franja del importe.
El título conserva altura natural y la columna central usa la misma separación
entre líneas que movimientos recientes. La categoría propuesta sigue visible
aunque el sentido todavía no se haya completado; no se infiere uno del otro.
El icono y la franja del importe reutilizan los
estilos de movimientos recientes, con color según el sentido recibido.
No se vuelve a pedir el sentido: si Mercado Pago no permite identificar quién
paga o cobra respecto de la cuenta autorizada, el pago no se registra hasta
disponer de esa información. Los pagos de $0 se pueden
ignorar y su explicación completa queda en el detalle. Seleccionar todo y
deseleccionar ocupan el mismo control; el pie mantiene acciones apiladas, con
registro atenuado cuando no puede continuar: tocarlo explica la falta de selección
o qué pagos no son registrables, sin modificar saldos. Ignorar permanece
deshabilitado sin selección. Registrar no consume búsquedas manuales.

Buscar de nuevo usa un acceso compacto con lupa junto a la próxima automática y
muestra debajo los usos manuales disponibles. El historial abre en un modal y
hace un único intento remoto al abrir; si la conexión
falla, recupera la copia persistida del usuario. Solo muestra las filas cuando
termina ese proceso y no reinicia la carga por cambios de estado del trabajo.
Renovar autorización solo se ofrece si la vinculación informa un error de acceso;
la renovación normal del token es automática en el servidor.

Si el servidor anuncia identificación pendiente de una descarga antigua, la
sincronización solicita completar esos datos antes de traer los resultados. Se
retoma el trabajo original sin crear otra consulta diaria ni restablecer usos.
Funciona aunque queden cero búsquedas manuales. El seguimiento temporal muestra
«Completando identificación de pagos guardados» y termina con ese trabajo.

Mientras la búsqueda está pendiente o procesando, con esta pantalla enfocada y
la app activa, se abre una suscripción WebSocket autenticada al canal propio de
Mercado Pago. Los eventos solo invalidan la copia local y recuperan los datos
por HTTP. El socket y sus temporizadores se cierran al completar, fallar de forma
definitiva, cancelar, cambiar de vinculación, salir o pasar a segundo plano.
Las reconexiones usan espera creciente; una comprobación cada 15 segundos solo
mientras se sigue el trabajo recupera eventos perdidos. Refrescar no inicia una
automática ni consume consultas manuales. El controlador general de avisos y
la conexión de Social conservan su ciclo independiente.

La lista de depósitos muestra un aviso compacto junto al nombre, sin tercera
línea. Los tres puntos del detalle y la opción Mercado Pago del
modal muestran indicadores cuando quedan pendientes o cambios por revisar.
Comparten el resumen local y se actualizan al cambiar decisiones o sincronizar;
abrir la pantalla no los elimina. Desvincular retira los indicadores.

La guía de credenciales y arranque está en SERVER-AHRE:
`docs/notificaciones-mercado-pago.md`. Las claves privadas nunca deben copiarse
al chat ni versionarse. La nueva dependencia autorizada por el líder para esta
tarea es `expo-notifications`, compatible con SDK 57.

### Cierre de entrega 0.9.0

Al tocar una card pendiente registrable, el selector habitual permite editar
su descripción y categoría. El borrador persiste offline; al registrar se recortan
espacios y se exige una descripción de 1 a 500 caracteres. La descripción original
de Mercado Pago no cambia y la asociación no sobrescribe movimientos existentes.

Los errores se muestran en un diálogo central y en un aviso fijo junto a las
acciones, accesible aunque la lista esté desplazada. Los pagos de importe cero,
no aprobados, de otra moneda o sin sentido no se incorporan; se explica el motivo.

«Próxima búsqueda automática» indica disponibilidad al entrar con conexión,
no una ejecución fija a esa hora. Al completar la identificación no se mantiene
un texto técnico en el resumen: queda una notificación en el historial y un aviso
de éxito cuando la pantalla sigue el trabajo. Los fallos definitivos también
generan notificación; los reintentos intermedios no producen avisos repetidos.
Sin Firebase/FCM configurado no se garantiza entrega remota al teléfono.

Sin internet se revisan los datos descargados, guardan borradores y registran
o ignoran selecciones atómicamente. Se requiere conexión para vincular, buscar
y sincronizar. Rendimientos y transferencias entre cuentas propias quedan
pendientes de definición; no se agregaron en esta entrega.
