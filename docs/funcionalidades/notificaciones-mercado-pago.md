# Notificaciones y Mercado Pago

Implementación iniciada el 9 de noviembre de 2026, con ajustes posteriores de
historial, revisión compacta y alarmas exactas. Requiere el backend coordinado
y Firebase/Mercado Pago configurados para validar servicios reales. El estado
de las compilaciones internas se registra en la guía de publicación; enviar
fuentes a EAS no equivale a tener una APK compilada ni publicada en la web.

## Centro de notificaciones

Notificaciones consulta SQLite, con historial paginado y filtros Todas,
Pendientes y No vistas. Ver un aviso no resuelve la tarea. Las tarjetas conservan
ambos estados y abren deudas, salas, recurrencias, estadísticas, movimientos o
la revisión de Mercado Pago. Los destinos de push se validan y esperan el acceso
normal de la cuenta, incluida la biometría, sin abrir pantallas privadas desde Inicio.

Los ajustes por usuario permiten elegir tipos, hora y anticipación. La zona horaria se toma del teléfono al guardar.
El interruptor general de Perfil controla los avisos del teléfono; no elimina el
historial. Los avisos del teléfono muestran el mismo título y mensaje del historial. Rechazar permisos no bloquea
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

Los recordatorios diarios de deudas y salas cubren ese mismo horizonte de
60 días. Identifican a la otra persona y su saldo pendiente, o a la sala y su
cantidad de movimientos. Los avisos de recurrencias incluyen el nombre del
movimiento y del depósito en sus tres momentos. Al cambiar nombres o saldo,
la reconciliación reemplaza las alarmas futuras sin duplicarlas. Una deuda
parcialmente pagada continúa pendiente; saldo cero,
perdón o cancelación resuelven sus avisos sin marcarlos vistos. Las salas usan
los mismos pendientes de sus tarjetas, tanto abiertas como cerradas. Una
recurrencia conserva su ocurrencia específica y solo se resuelve al avanzar
o desactivarla, nunca por haber llegado la fecha del aviso anticipado.

Registrar movimientos y revisar el mes son avisos informativos, sin obligación
de declarar actividad. Si un día no hubo registros, su aviso conserva fecha
y estado de lectura; el siguiente día tiene un recordatorio independiente.
No se crean movimientos ni se da por saldada una deuda por pasar el tiempo.

El historial conectado mezcla una página remota con los avisos locales usando
el mismo cursor de fecha/ID y devuelve como máximo diez elementos. Los filtros
se aplican a ambas fuentes y offline se consultan las copias disponibles.
El servidor cierra acciones de Social por su referencia y los errores de MP
al recuperarse; publicar el backend actualizado es necesario para estas reglas.

## Mercado Pago

El botón **Conectar Mercado Pago** aparece en todos los depósitos mientras no
haya una vinculación activa. Al vincular uno, se usa **Opciones → Mercado Pago**
en ese depósito. Los tres puntos muestran el contador de movimientos pendientes.
Al vincular, la persona elige
1, 2 o 3 meses de historial y autoriza su cuenta. Ese
rango termina en la fecha de creación del depósito. Cada usuario y cada
cuenta externa tienen una sola vinculación activa.

Antes de autorizar, tocá **Cuánto puede tardar** para abrir la ayuda. Los
primeros resultados aparecen progresivamente. Con un historial largo, la
revisión del reporte puede tardar unos diez minutos o más. Se puede cerrar la
app y volver para ver el avance.

Al volver de autorizar, **Verificando conexión** aparece mientras AHRE consulta el
estado. Cuando confirma el vínculo, la pantalla cambia a resultados y muestra
la barra de actividad antes de que termine de descargar la lista de movimientos.

El panel superior muestra cuándo AHRE busca movimientos, espera Settlement o
Liquidaciones y verifica sus datos. La parte llena de la barra representa el avance confirmado.
La animación en la parte libre indica actividad durante la espera. La lista
**Resultados** reúne los movimientos por fecha a medida que llegan y permanece
en solo lectura hasta que termine la consulta. Tocá un movimiento pendiente
para editar su descripción y elegir una categoría. La app conserva esos cambios
en borradores. Al lado de **Resultados** está **Historial**, con las últimas 20
consultas.

Liquidaciones confirma los **Rendimientos** y completa las transferencias
salientes. El importe neto distingue créditos y débitos. **Resultados**
omite los importes cero, los posibles duplicados y las filas no registrables.
El filtro **Registrados** conserva los movimientos incorporados y **Pendientes**
incluye los cambios que requieren revisión.
Si un importe aprobado en pesos queda sin sentido identificado, podés tocarlo
y elegir **Ingreso** o **Egreso**. La elección se guarda en borradores y el saldo
se actualiza recién al registrar. Si faltan otros datos para confirmar la
operación, sigue como **Pendiente de confirmar** con el importe fuera del saldo.

Desde el día siguiente a la vinculación, el servidor programa la consulta a
las 12:00 de Argentina para el día calendario anterior en esa misma zona,
de 00:00 a 23:59. La zona horaria del teléfono no cambia el rango. La consulta
se ejecuta aunque la app esté cerrada. **Retomar consulta** aparece ante un fallo y sigue el trabajo
guardado. Actualizar la pantalla trae el avance que ya tiene el servidor.

El servidor habilita la conciliación en todas las cuentas vinculadas. La
automatización de n8n despierta al worker y los tokens OAuth se manejan
en el servidor.

Los resultados se muestran como pendientes, ignorados o registrados. Se puede
seleccionar hasta 500 por confirmación, registrar, ignorar, recuperar ignorados
o asociar un movimiento compatible existente. Desmarcar conserva el pendiente.
AHRE propone una categoría según los datos del proveedor. Cuando solo conoce
el sentido, propone **Transferencias** o **Transferencias recibidas**. Se
revisan operaciones aprobadas en pesos. Registrar un movimiento afecta
únicamente el depósito vinculado.

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

### Actualización y conexión

Al recuperar el foco o volver de OAuth, la app consulta el estado del vínculo.
El enlace del navegador puede abrir la APK instalada. En Expo Go, volvé
manualmente a AHRE. Renovar autorización y desvincular están en las opciones
del depósito. El worker renueva el token automáticamente cuando corresponde.

Deslizar hacia abajo recupera el estado y las operaciones guardadas en el
servidor. El historial abre una consulta remota y usa la copia local si falla
la conexión. La lista ordena las operaciones por fecha y hora y las agrupa por
día antes de aplicar el límite de filas visibles.

Durante una consulta activa, la pantalla enfocada sigue el canal autenticado
de Mercado Pago por WebSocket. Los eventos avisan que hay cambios y la app
vuelve a cargar los datos por HTTP. Si se pierde un evento, una comprobación
cada 15 segundos recupera el avance mientras se sigue el trabajo. El socket
y sus temporizadores se cierran al terminar la consulta, cambiar de vínculo,
salir de la pantalla o pasar a segundo plano.

### Probar desde el inicio

Con una cuenta de pruebas, [Eliminar mis datos](../configuracion/reinicio-datos-pruebas.md)
borra de AHRE los depósitos, la vinculación, las consultas y las decisiones
asociadas. Se conservan el acceso a la cuenta y el dinero de Mercado Pago.
Después del reinicio, iniciá sesión, creá un depósito y elegí el período de
historial al volver a vincular. La nueva vinculación programa su primera
consulta diaria para el día siguiente a las 12:00 de Argentina.

Las comprobaciones de cada entrega se registran en
[Validación de notificaciones y Mercado Pago](../validacion-notificaciones-mercado-pago.md).
