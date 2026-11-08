# Social online, recurrencias y correcciones

## Solicitudes estructuradas y permisos de gastos

Sincronización combina la cola privada con comandos sociales y solicitudes
pendientes, respetando el orden por fecha y la paginación. Su acción manual
procesa ambas vías y las actualizaciones sociales refrescan la lista y el
contador del encabezado. Los conflictos sociales conservan su detalle.

MySQL incorpora de forma aditiva tipo, version_gasto, monto_parte y huella_gasto en
solicitudes_online, y puede_editar_gastos en integrantes_online. La revisión de
columnas existentes usa information_schema. El despliegue debe seguir el
procedimiento de respaldo y validación aislada antes de actualizar la base real.

Cada solicitud incluye el identificador de la persona participante que la envió.
Los avisos de parte pagada se validan contra su autor, el gasto vigente, la
huella económica (importe, pagador y reparto) y el importe correspondiente.
Aceptar un aviso incrementa la versión, pero no invalida avisos independientes
del mismo gasto. Un cambio económico sí exige revisión. Los avisos anteriores
sin huella conservan la comprobación estricta de versión. Aceptar y actualizar ocurre
en la misma transacción; no afecta movimientos privados ni pagos_online.
Únicamente el creador decide solicitudes o concede permisos de gastos. La
autorización delegada no admite más delegaciones ni cierre ni cambios de personas.

## Revisión del flujo de salas

La recuperación de eventos tolera la pérdida de acceso a un canal de sala o
deuda y actualiza el listado autorizado; las respuestas de sesión o red siguen
conservando la copia offline. Las suscripciones se obtienen del listado vigente.
El resumen principal suma los acuerdos online aceptados sin duplicar deudas
asociadas a un registro privado. El límite visual de salas cuenta las propias.

La primera publicación guarda su contenido en la misma transacción que lo lee.
Mientras no se confirme, la sala queda identificada como Publicación por confirmar
y se bloquean las escrituras y el cierre local. Reintentar recupera el resultado
del mismo envío. Esto evita editar una copia local después de perder la respuesta
de una publicación que el servidor ya pudo haber confirmado.

La instantánea de publicación incluye las asociaciones financieras privadas ya
preparadas. El servidor comprueba propiedad y compatibilidad y guarda sala,
integrantes y selecciones en la misma transacción. Una respuesta perdida se
reintenta con el contenido original; un rechazo HTTP confirmado permite corregir
el borrador. No se crean movimientos al publicar. El cierre reutiliza el depósito
o movimiento seleccionado y conserva la incorporación única por cuenta y clave.

La revisión incluye pruebas de publicación y cierre, reintentos, permisos,
invitaciones, invitados web, registro conservando identidad, pagos parciales,
retiro de integrantes, WebSocket y recuperación HTTP. Los recorridos de cámara,
portapapeles y selección de una app de mensajería necesitan validación manual
en el teléfono. Las pruebas automáticas no sustituyen esa comprobación visual.

Contrato de la rama `codex/social-online-recurrencias`, noviembre de 2026.
Esta guía complementa las pantallas sociales y el destino parametrizado de persona
de sala, registrado dentro de RegistroSocial.

## Fronteras de datos

- La agenda, depósitos, movimientos, recurrencias y deudas personales siguen en SQLite y en la sincronización privada de la cuenta.
- Las salas compartidas, identidades, invitaciones, solicitudes, obligaciones y pagos aceptados pertenecen a los servicios sociales del servidor.
- El servidor nunca elige depósitos ajenos ni genera movimientos de otra cuenta.
- Publicar conserva el ID de la sala y marca su fuente local como publicada. La copia compartida pasa a ser la vía de escritura.
- Una cuenta autoriza una instalación móvil. Las sesiones sociales web son independientes y no reemplazan esa autorización.

## Salas y categorías

Crear una sala no requiere categoría. Cada gasto requiere una categoría de egreso.
Las listas manuales y OCR parten de una selección común y permiten cambiar cada ítem.
Los repartos se calculan en centavos; los identificadores y versiones previenen duplicaciones.

El creador es administrador. Puede editar una sala compartida offline; la cola aplica
una vista provisional y muestra los envíos pendientes. Los participantes consultan
y envían solicitudes; pueden guardarlas offline para enviarlas al reconectar.
La administración desde navegador permanece deshabilitada en esta etapa.

Las salas locales se cierran sin Internet. Cerrar una sala compartida exige conexión
y confirmar primero los cambios pendientes. El servidor fija gastos y repartos
en una transacción y crea las obligaciones de todos los participantes.
Una respuesta perdida se recupera con el mismo identificador.

El egreso completo corresponde a quien pagó la compra. Las partes ajenas crean
obligaciones, sin registrar otra vez la parte propia como egreso.
Cada cuenta incorpora después su compra o pago en un depósito propio, o asocia un
movimiento existente compatible. Esa incorporación es independiente del cierre.

## Personas e invitados

La ficha privada conserva su ID, nombre, apodo e historial. Una identidad compartida
se vincula a una cuenta mediante invitación aceptada y confirmación del dueño de
la ficha. También puede solicitarse un vínculo directo desde el perfil usando
el correo exacto de la cuenta; el envío expresa el consentimiento del dueño
de la ficha y solo la cuenta destinataria puede aceptarlo desde Personas.
No se vincula automáticamente ni se fusiona por nombre o correo. Otra ficha ya vinculada a
esa cuenta impide confirmar un vínculo equivalente; se conservan ambas.

El acceso habitual utiliza un enlace global estable y QR con contraseña y
aprobación del creador. Una solicitud de ingreso no concede acceso a los datos
de la sala. La ficha se asigna explícitamente y una cuenta vinculada no puede
ser reemplazada por una identidad ajena.

Las invitaciones individuales heredadas son dirigidas a una participación, aleatorias, revocables, válidas
por siete días y almacenadas únicamente como hash. Reemitir invalida el enlace
anterior sin duplicar al integrante. La sesión de invitado solo accede a esa sala
y a sus obligaciones. Registrarse o ingresar conserva su identidad y participación.

La web vive en SERVER-AHRE, ruta `/invitacion/`, y no expone un buscador público.
Ofrece abrir `ahre://invitation` en la app; la app conserva el enlace durante el
ingreso. Un fallo muestra una invitación pendiente, que puede conservarse o descartarse.

Las deudas anteriores son privadas. Compartir crea una propuesta; rechazarla no
modifica el original. Al aceptar puede asociarse el registro equivalente de la otra
cuenta, verificando dirección, pendiente y ficha vinculada. La asociación requiere
confirmación explícita de esa ficha cuando aún no está vinculada.
El registro privado permanece y su vista toma el pendiente del acuerdo aceptado;
los pagos se administran desde la sección online para no llevar dos saldos del mismo acuerdo.
Un registro privado no puede respaldar dos acuerdos aceptados. Las propuestas
cruzadas se comprueban bajo bloqueo del registro de origen; una propuesta
duplicada se rechaza explícitamente sin borrar anotaciones ni fusionar importes.

## Pagos

Los estados son `informado`, `confirmado` y `rechazado`.
Informar no reduce el pendiente. Solo el acreedor confirma la recepción.
El servidor bloquea la deuda dentro de la transacción antes de confirmar; los pagos
simultáneos no pueden superar el pendiente.
El emisor incorpora su egreso al informar; el receptor solo incorpora el ingreso
confirmado. El rechazo conserva aviso, historial y egresos privados existentes,
pero no ofrece crear un movimiento nuevo desde el aviso rechazado.
El acreedor puede registrar directamente una recepción confirmada. Perdonar el
pendiente es otra acción: no crea un pago ni movimientos financieros.

## Conectividad y tiempo real

Las acciones que requieren red permanecen visibles y deshabilitadas con explicación.
Las acciones de administrador no se ofrecen al participante.
La copia local muestra su última actualización; los pendientes nunca aparecen confirmados.

Las escrituras usan HTTP autenticado e identificadores persistidos.
Los comandos incluyen versión base. Un conflicto no sobrescribe el servidor ni borra
el envío y no frena otras salas. El administrador revisa importes para reenviar, o usa
la versión remota. En ambos casos se archivan los envíos originales para consulta.

`ws` sirve `/api/v1/social/ws`. Un POST entrega un ticket de un solo uso y 30 segundos,
transportado en los subprotocolos del socket; no se ponen tokens permanentes en URLs.
Las suscripciones se autorizan por canal, se revalidan ante cada evento y tienen heartbeat.
Los eventos se guardan dentro de la transacción y se despachan después del commit.
El despachador recupera el registro persistido tras reinicios de la instancia única.
La app recupera por HTTP los eventos posteriores a sus cursores y confirma los cursores
solo después de actualizar sus instantáneas; las revisiones evitan retroceder datos.
La app consulta eventos cada 15 segundos, incluso como respaldo del socket.
Descarga instantáneas cuando hay novedades, pendientes por enviar, al iniciar o
reanudar y al menos cada 60 segundos como reconciliación. Sin novedades no
reescribe el caché. La web conserva su consulta de respaldo cada 15 segundos.
Volver del segundo plano recupera datos antes de presentarlos actualizados.

Revocar una instalación bloquea nuevos envíos y conserva sus pendientes.
Retirar una participación impide acceso futuro a la sala; las cuentas mantienen acceso
a sus obligaciones y operaciones personales. Los invitados siguen limitados a su sala.

## Recurrencias

`src/recurrences/recurrenceService.ts` es el único motor TypeScript.
Se ejecuta al iniciar/reanudar y durante el uso de la app; el módulo local
`modules/recurrence-worker` lo invoca mediante Expo TaskManager y WorkManager.
El trabajo periódico Android tiene intervalo de 15 minutos, sin requisito de red.
Se guarda la identidad real de la tarea de Expo en WorkManager para restaurarla.

Cada ejecución guarda movimiento, clave única de recurrencia/fecha y próxima fecha
en una transacción. El procesamiento se limita a 100 ocurrencias por pasada y recupera
el resto después. La primera ocurrencia ya creada queda reconocida.
La fecha prevista del movimiento y la fecha real de creación son distintas.
Se conserva zona horaria y día ancla: 31 pasa al último día del mes corto y vuelve a 31.

El detalle del depósito permite desactivar, reactivar con fecha futura y editar
la programación y el importe futuro. Modificar la regla no altera movimientos
ya registrados. El resumen muestra total vigente, cantidad de ejecuciones y
variación del importe respecto de la primera ejecución conservada.
Las fechas se interpretan en la zona guardada de la recurrencia.
No se generan ocurrencias del intervalo desactivado. Una revocación conocida o depósito
desactivado suspende la generación.

Android puede demorar el trabajo; apagar el teléfono o forzar su detención requiere
recuperación posterior. La generación es local; se sincroniza al volver a abrir la app.

## Eliminación lógica

Eliminar conserva el original con `fecha_eliminacion` y crea una corrección inversa
vinculada por `reversion_de_id`, en una transacción. El original mantiene su
importe e identidad y se presenta como eliminado. La corrección compensa el saldo
una única vez. Ambos registros se excluyen de las estadísticas.
Repetir la acción no duplica la corrección. Los eliminados anteriores con
`anulado=1` se conservan sin alterar su tratamiento.
Las transferencias mantienen su operación conjunta. Las deudas y pagos de Social
conservan el acuerdo aun cuando se corrigen las finanzas privadas.

Eliminar una ocurrencia permite desactivar también la recurrencia. Su ejecución
queda registrada y no vuelve a generarse.
El detalle del movimiento abre el formulario existente de ingreso o egreso para
corregir importe, descripción, categoría, depósito, fecha y hora cuando está vigente.
Una transacción conserva el original, registra su inversa y crea el reemplazo;
el saldo refleja la diferencia y las estadísticas cuentan el reemplazo. Una clave
estable de envío evita duplicados. Editar una ocurrencia no modifica la programación futura.
Las asociaciones sociales conservan sus restricciones de importe y dirección.

## Esquema y publicación

SQLite conserva versión 1 y actualiza `001_initialSchema.ts`; las bases locales
de desarrollo anteriores se recrean. No se borra información de producción.
MySQL usa `scripts/upgrade-schema.cjs` explícito después de respaldo y validación
en una copia aislada. La actualización es aditiva: copia categorías de salas a gastos,
conserva la columna histórica y los lotes originales y reconoce ocurrencias anteriores.

El protocolo de sincronización es 3 y el contrato de negocio es 2.
Las instalaciones nuevas recuperan `/sync/snapshot`; los lotes de esquema anterior
no se reinterpretan. Un cliente incompatible recibe 426.
Coordinar la actualización del servidor y la build Android antes de publicar.

Las pruebas incluyen SQLite real, MySQL aislado, HTTP y WebSocket.
Compilar un APK no verifica por sí solo la ejecución de WorkManager en un teléfono;
ese recorrido físico y el despliegue se registran por separado en Estado y validación.


El vínculo directo reutiliza vinculos_online: solicitado espera al destinatario,
confirmado habilita propuestas, rechazado/cancelado conserva ficha e historial.
El estado pendiente de invitaciones a salas mantiene su confirmación por el
propietario. Un propietario no puede confirmar sus propias solicitudes directas.
Los eventos de usuario actualizan el caché de vínculos sin depender de una sala.
Las rutas solicitar/responder/cancelar usan operaciones idempotentes. La app
sincroniza la ficha privada antes de solicitar el vínculo, y el servidor comprueba
propiedad, destinatario y duplicados por cuenta incluso con identidades históricas.
No hay nuevos campos SQLite ni cambios al esquema MySQL para este flujo.

## Acceso global y finanzas preparadas · build 10

El nuevo enlace usa /invitacion/#sala=<codigo>. Es estable y reutilizable; la
contraseña se deriva con scrypt y no se incluye en URL/QR. Una sesión de admisión
solo puede consultar su estado y canal ingreso:<id>; no es integrante hasta la
aprobación del creador. La decisión conserva la identidad histórica al recuperar
una participación y revoca la sesión invitada previa. Los enlaces individuales
anteriores siguen vigentes hasta su vencimiento.

Las asociaciones privadas se guardan por cuenta, sala y clave financiera, con
huella del importe, pagador y reparto. La cola local usa datos_sociales_online
y se envía antes de los comandos de cierre, después de sincronizar depósitos y
movimientos propios. Un rechazo queda para revisión; un fallo de red conserva el
identificador. Al recibir el cierre, la app incorpora una vez las operaciones con
selección válida; las demás permanecen en el detalle del gasto.

El contrato privado conserva su versión: no se agregan columnas SQLite ni se
reinterpretan lotes. El contrato social añade respuestas opcionales y tablas
aditivas en MySQL. Los pagos generados al cerrar llevan origen_cierre para que
una selección preparada no se aplique a un pago posterior. La incorporación y
su reconocimiento en servidor conservan las claves existentes.

## Matriz vigente de roles y estados

| Escenario | Comportamiento |
| --- | --- |
| Sala local sin conexión | Editar y cerrar; conserva el flujo privado. |
| Publicación en curso o respuesta perdida | Borrador bloqueado; reintentar el mismo envío, incluidas sus selecciones. |
| Publicación rechazada | Corregir el borrador; no quedan sala ni selecciones parciales en el servidor. |
| Creador de sala compartida offline | Guarda comandos pendientes; cierre requiere conexión y confirmación. |
| Solicitante sin admisión | Consulta únicamente el estado de ingreso. |
| Invitado web admitido | Consulta sala y avisa su parte pagada; no administra depósitos ni pagos de deuda. |
| Participante con cuenta | Consulta, prepara movimientos propios y envía solicitudes. |
| Editor autorizado | Modifica gastos desde la app; no administra accesos, personas, permisos ni cierre. |
| Dos avisos del mismo gasto | Se revisan independientemente mientras sus datos económicos coincidan. |
| Sala cerrada | Solo lectura; obligaciones y movimientos propios se actualizan sin repetir el cierre. |
| Pago informado, confirmado o rechazado | Solo confirmado reduce pendiente; rechazado conserva el historial privado. |
| Perdón | Cierra el pendiente sin dinero; visible para ambas partes y en el balance de sala. |
| Movimiento privado eliminado | Corrige finanzas privadas; no revierte el acuerdo compartido. |
| Sesión vencida, instalación revocada o participante retirado | Conserva pendientes; el servidor rechaza envíos o consultas no autorizados. |

Las simulaciones requieren `__DEV__`, cuenta `pruebas@ahre.test`, autorización
local vigente y generación cero. Expo Go y builds de desarrollo pueden usarlas;
release y cuentas reales no. No sirven como comprobación del transporte real.
