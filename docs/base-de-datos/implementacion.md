# Implementación de la base de datos local

## Tecnología y archivo

AHRE utiliza `expo-sqlite` (`~57.0.4`) y una base local llamada `ahre.db`.
SQLite conserva el archivo en el almacenamiento privado de la aplicación y
las operaciones no requieren Internet, backend ni servicios externos.

La inicialización se expone mediante `inicializarBaseDatos()` en
`src/database/initialization.ts`. Mantiene una única conexión preparada y
comparte la promesa inicial entre llamadas simultáneas. `App.tsx` la ejecuta
antes de mostrar la navegación. Inicio queda como ruta inicial una vez lista la
base; la sesión se consulta recién cuando la persona completa el deslizador. Si
ocurre un error al preparar SQLite, se muestra el mensaje controlado y se puede
volver a intentar.

Al abrir la conexión se activa `PRAGMA foreign_keys = ON` y se comprueba que
SQLite lo haya aplicado. La aplicación nunca elimina la base para actualizar
el esquema.

## Versionado y migraciones

La versión se guarda en `PRAGMA user_version`. La migración inicial está en
`src/database/migrations/001_initialSchema.ts` y establece la versión `1`.
El mismo archivo contiene también las tablas de Social. La aplicación lo
ejecuta dentro de una transacción; una falla revierte el
cambio y permite volver a intentar la inicialización. Una base con una versión
superior a la que conoce esta versión de AHRE genera un error controlado y se
conserva intacta.

Mientras AHRE siga en desarrollo y no haya una versión final publicada, los
cambios al esquema se incorporan directamente en `001_initialSchema.ts`; no se
agregan migraciones para convertir bases locales de versiones anteriores de
desarrollo. No se borra una base existente automáticamente. Cuando el esquema
se estabilice para una versión publicada, los cambios posteriores usarán
nuevas migraciones incrementales para conservar los datos al actualizar.

## Esquema inicial

Los identificadores son `TEXT PRIMARY KEY` y se generan localmente como UUID.
Las fechas se guardan como texto ISO 8601. Los montos conservan el tipo `REAL`
definido en el modelo. Los indicadores utilizan `INTEGER` con valores `0/1`.

| Tabla | Campos |
| --- | --- |
| `usuarios` | `id`, `nombre`, `correo_electronico`, `activo`, `fecha_creacion`, `fecha_actualizacion` |
| `credenciales_usuario` | `usuario_id`, `contrasena_verificador`, `fecha_creacion`, `fecha_actualizacion` |
| `preferencias` | `id`, `usuario_id`, `deposito_predeterminado_id`, `notificaciones_activas`, `idioma`, `apariencia`, `fecha_creacion`, `fecha_actualizacion` |
| `depositos` | `id`, `usuario_id`, `nombre`, `tipo`, `saldo_inicial`, `saldo_actual`, `icono`, `color`, `descripcion`, `activo`, `fecha_creacion`, `fecha_actualizacion` |
| `historial_saldos_deposito` | `id`, `deposito_id`, `saldo_anterior`, `saldo_informado`, `descripcion`, `fecha_hora` |
| `movimientos` | `id`, `deposito_id`, `categoria`, `recurrencia_id`, `transferencia_id`, `tipo`, `monto`, `descripcion`, `fecha_hora`, `anulado`, `reversion_de_id`, `fecha_creacion`, `fecha_actualizacion` |
| `transferencias` | `id`, `usuario_id`, `deposito_origen_id`, `deposito_destino_id`, `monto`, `fecha_hora`, `descripcion`, `anulada`, `reversion_de_id`, `fecha_creacion`, `fecha_actualizacion` |
| `recurrencias` | `id`, `deposito_id`, `categoria`, `tipo`, `monto`, `descripcion`, `frecuencia`, `fecha_inicio`, `fecha_fin`, `proxima_ejecucion`, `activa`, `fecha_creacion`, `fecha_actualizacion` |
| Social | Siete tablas: personas, salas, personas_sala, gastos_compartidos, participantes_gasto, deudas y pagos_sociales. Campos completos en el [contrato de Social](social.md). |

Las categorías **no son una tabla** en el modelo acordado. `movimientos.categoria`
guarda el identificador constante de `CATEGORIAS_INGRESO` o
`CATEGORIAS_EGRESO` en `src/constants/movimientos.ts`; por eso no se copian a
SQLite ni se insertan de nuevo al iniciar.

## Claves, relaciones y restricciones

- `preferencias.usuario_id` es único, de modo que cada usuario tenga como
  máximo una configuración. El depósito predeterminado debe pertenecer al
  mismo usuario.
- Los depósitos y recurrencias pertenecen a un usuario o depósito existente.
- El historial de saldos pertenece a un depósito y conserva conciliaciones
  anteriores; no interviene como movimiento en el saldo.
- Las transferencias requieren dos depósitos distintos del usuario indicado.
  El repositorio crea el registro y sus movimientos de salida y entrada en una
  transacción. Al anularla se conserva la operación original y se crea una
  transferencia inversa con sus dos movimientos compensatorios.
- Todo movimiento requiere un depósito existente. Las referencias a
  recurrencias y transferencias, cuando están presentes, también deben existir.
  Un movimiento de transferencia debe usar uno de los dos tipos de transferencia
  y debe corresponder al depósito de origen o destino registrado.
- La reversión de un ingreso o egreso se guarda como otro movimiento del mismo
  depósito y monto, con el tipo opuesto y una referencia única al movimiento
  original. Los movimientos que pertenecen a una transferencia solo se revierten
  anulando la transferencia completa.
- Social relaciona salas, integrantes e ítems con pagador propio. Las claves
  compuestas no admiten datos de cuentas distintas; una sala cerrada es de solo
  lectura y no se permiten más de tres abiertas por cuenta.
- Las deudas involucran al usuario actual. Los pendientes entre terceros se
  conservan en las partes de la sala, fuera del registro personal.
- El registro común de pagos exige un movimiento único y compatible para dinero
  propio, y ningún movimiento propio para operaciones entre terceros. Su tabla
  reemplaza pagos_deuda. No copia entregas al vincularlas a una deuda al cierre.
- El contrato detallado distingue las restricciones SQL de las validaciones y
  transacciones que ejecutan los servicios de Social en `src/social/`.
- Los tipos, estados, frecuencias e indicadores documentados se controlan con
  restricciones `CHECK`. La categoría se conserva como texto para que el
  catálogo siga en las constantes del proyecto.
- Los montos de movimientos y transferencias deben ser positivos; la dirección
  del impacto se determina por el tipo. Los repositorios validan que la categoría
  corresponda al tipo de movimiento.
- Las eliminaciones físicas quedan bloqueadas mientras haya referencias. Las
  claves estables no se pueden cambiar desde los repositorios.

## Índices

La migración crea índices para los filtros previstos por el diseño:

- depósito y fecha del movimiento;
- fecha general, categoría y tipo del movimiento;
- transferencia o recurrencia asociada;
- usuario y estado de depósitos;
- correo electrónico de usuario;
- depósito y estado de recurrencias;
- usuario y fecha de transferencias, gastos y deudas;
- persona en participantes y deudas;
- deuda y fecha de pagos.

También limita a un correo electrónico normalizado por cuenta, a una la persona
marcada como usuario actual por cada usuario y a un movimiento de cada tipo por
transferencia.

## Repositorios y operaciones

**Social:** sus siete repositorios usan el contrato actual. Los formularios
acceden a ellos mediante `socialService.ts`, que coordina sesión, validaciones,
transacciones y movimientos. `pagosSocialesRepositorio` reemplaza al antiguo
repositorio de pagos de deuda; se agregan salas y pertenencias.

`src/database/repositories/` contiene los repositorios existentes: usuarios,
preferencias, depósitos, movimientos, transferencias, recurrencias, personas,
salas, pertenencias, gastos compartidos, participantes, deudas y pagos. Cada repositorio expone
`crear`, `consultar`, `consultarPorId`, `buscar`, `filtrar`, `actualizar` y
`eliminar`. Los nombres de tablas y campos provienen de definiciones internas;
los valores se envían como parámetros de SQLite.

Las consultas aceptan filtros por campos permitidos, ordenamiento validado,
límite y desplazamiento. `depositosRepositorio.consultarSaldoActual()` lee el
campo `depositos.saldo_actual`. Al crear un depósito, ese campo se inicializa
con `saldo_inicial`; cada ingreso, egreso, movimiento compensatorio o
transferencia cuya fecha y hora sea igual o posterior a la creación del depósito
actualiza el saldo en la misma transacción que guarda el movimiento. Un
movimiento anterior se conserva en el historial y no afecta el saldo actual;
las ediciones y reversiones respetan la fecha original. `saldo_actual` no se
modifica directamente mediante el CRUD genérico.
`depositosRepositorio.actualizarSaldoInformado()` permite fijar localmente el
saldo comunicado por el usuario: guarda el valor anterior y el nuevo en
`historial_saldos_deposito` y actualiza el depósito dentro de la misma
transacción. `consultarHistorialSaldos()` devuelve esas conciliaciones; no cambia
los movimientos existentes.

`transferenciasRepositorio.crear()` crea de forma atómica la transferencia y
los dos movimientos asociados. Al eliminarla, marca la original como anulada y
crea una transferencia inversa con dos movimientos nuevos. Los movimientos
originales se conservan y ambos lados de la reversión actualizan sus respectivos
saldos. La eliminación de un movimiento de ingreso o egreso crea un movimiento
opuesto enlazado mediante `reversion_de_id`, sin borrar el original. La
integración con `socialMovementReversal.ts` conserva el pago anulado y actualiza
la deuda, sin borrar registros ni duplicar movimientos. Impide revertir compras
de salas cerradas o compras abiertas con entregas todavía vigentes.

El catálogo `categoriasRepositorio` ofrece lectura, búsqueda y filtro sobre
las constantes. No ofrece escritura porque el modelo no guarda categorías en
SQLite.

## Transacciones y concurrencia

`ejecutarTransaccion()` utiliza `withTransactionAsync()` de `expo-sqlite`.
Todas las consultas de los repositorios pasan por una cola serial para que
ninguna consulta ajena se intercale con la transacción en curso. La cola usa
la misma conexión en la que se activaron las claves foráneas; la variante
exclusiva de Expo abre otra conexión y no hereda ese `PRAGMA`.

Las operaciones compuestas pasan la conexión recibida por la función de
transacción como último argumento del repositorio. Si una operación falla,
SQLite ejecuta `ROLLBACK`; el error no se devuelve como un mensaje SQL.

## Categorías iniciales y datos de ejemplo

No se insertan categorías en el arranque porque el modelo las define como
constantes inmutables. Así no hay filas de catálogo que se puedan duplicar.
La primera ejecución tampoco crea un usuario de ejemplo, depósitos de muestra
ni movimientos simulados.

El registro real crea `usuarios`, `credenciales_usuario` y `preferencias` en
una sola transacción. Si una inserción falla, SQLite revierte las tres filas.
No crea un depósito predeterminado: las preferencias empiezan sin uno asociado,
con idioma `es`, apariencia `sistema` y notificaciones activas.

## Eliminación y saldo

- Usuario: `activo = 0`.
- Depósito: `activo = 0`; mantiene el historial.
- Movimiento: se crea un movimiento opuesto enlazado; ambos registros se
  conservan en el historial.
- Transferencia: se marca como anulada y se crea otra transferencia inversa con
  dos movimientos compensatorios.
- Recurrencia: `activa = 0`; los movimientos generados permanecen.
- Persona: `activa = 0`.
- Deuda pendiente: estado `cancelada`. Una deuda saldada conserva su historial
  y no permite cancelación desde el servicio ni desde SQLite.
- Gasto compartido: estado `cancelado`; requiere revisar previamente sus pagos
  y compras. No ejecuta compensaciones por cambiar el estado.
- Preferencias: eliminación física, protegida por sus referencias.
- Participantes de ítems: no se borran si tienen pagos, deuda o pertenecen a
  una sala cerrada.
- Pagos sociales: se conservan con estado `anulado`; la reversión financiera
  coordina la compensación del movimiento y el estado de la deuda.
- Salas y pertenencias: no se borran; cierre o baja lógica según corresponda.
- Historial de saldo: las conciliaciones se agregan; no se editan ni eliminan.

El campo del saldo vigente se actualiza en la misma transacción que el cambio
del historial. Parte de `saldo_inicial` hasta la primera conciliación; luego,
parte del último `saldo_informado` y suma las variaciones posteriores. Al
registrar otro saldo informado, ese valor se convierte en la nueva base vigente;
las consultas leen el saldo guardado sin recorrer todos los movimientos.

Las variaciones se guardan con `ROUND(saldo_actual + variacion, 2)` para evitar
residuos de coma flotante en SQLite. El backend utiliza centavos enteros para
reproducir el lote desde el estado confirmado y comprobar el saldo final. Una
conciliación debe partir del saldo calculado, y su historial es inmutable.
Los lotes se confirman completos junto con su revisión y su diario canónico;
un error de negocio revierte la transacción MySQL y conserva la cola local.
Las transferencias requieren sus dos movimientos y las reversiones compensan
la operación original. En Social se validan repartos, financiación, cierres,
deudas, pagos y conservación del historial.

## Errores

`ErrorBaseDatos` ofrece mensajes seguros para inicialización, migraciones,
consultas, escrituras, integridad y transacciones. Los errores de SQLite se
clasifican centralmente; en desarrollo solo se registra la etapa y el código
técnico, no los valores de la operación.

## Verificación

La verificación más reciente de la etapa 7 aprobó tipos, 158 pruebas de la app
junto con las 45 del backend, sin fallos ni omisiones, usando MySQL 8.4.13
local aislado. Las pruebas de la app ejecutan el SQL y los servicios reales con
un adaptador SQLite en memoria; no son el adaptador nativo de Expo. El líder
confirmó los recorridos de registro, acceso, modo offline, reconexión, saldos y
Social en Expo Go. El alcance está en [Estado y validación](../estado-y-validacion.md).

El esquema contiene quince tablas de datos locales (catorce sincronizadas y
credenciales) y siete auxiliares del diario. La definición de origen es
`001_initialSchema.ts`. El esquema Social, sus restricciones y los recorridos
se detallan en [social.md](social.md). Las pruebas cubren FK, CHECK, triggers,
rollback y relaciones por cuenta; el guardado local de credenciales usa un
verificador SHA-256 con sal y la autorización remota usa SERVER-AHRE.

## Diario y reparación de perfil

El DDL de sincronización se define en `001_initialSchema.ts`, en `prepararEsquemaSincronizacion`, y se prepara de forma aditiva al abrir SQLite. No se agregan migraciones de transición ni se borran datos existentes. `journal.ts` conserva la generación de triggers y la gestión de eventos.

`sync_profile_rejection` conserva usuario, lote, base, generación y contenido exacto rechazado. `sync_profile_backup` conserva los eventos originales por usuario y secuencia, incluso tras su confirmación, como respaldo local no sincronizado. No incluye credenciales. La reparación comprueba la vista previa y guarda respaldo y cambios en una transacción. Solo cambia correos de eventos de usuarios; la cola financiera conserva contenido y orden.

Ante `lote_confirmado_otro_contenido`, se restauran los originales todavía pendientes, sin recrear registros ya confirmados, y se reintenta el reconocimiento idempotente. Si no existe un original diferente que restaurar, se conserva el conflicto.

La etapa 3 pasó tipos en ambos proyectos, 145 pruebas de la app y 36 del backend con MySQL 8.4.13 aislado, sin fallos ni omisiones. Se verificaron corrección de correo duplicado, persistencia al reiniciar, vista previa obsoleta, pérdida de confirmación, respaldo, restauración del lote original y bloqueo por revocación. El líder confirmó después el recorrido principal de corrección en Expo Go con el backend actualizado.


## Optimización de consultas locales (etapa 4)

`connectionQueue.ts` comparte una única cola serial entre lecturas y escrituras.
`ejecutarLecturaConConexion` ejecuta consultas sin preparar un lote ni consultar
los máximos del diario: elimina las dos consultas `MAX(secuencia)` y los dos
`UPDATE sync_context` que acompañaban a cada lectura. Se usa en las consultas
del repositorio genérico, autenticación, depósitos, movimientos, autorización,
pendientes y sincronización. Las escrituras siguen usando `ejecutarConConexion`
y conservan el lote común y la notificación al agregar eventos.

Ambas variantes aceptan la conexión de una transacción en curso para no volver
a encolarla. Las lecturas externas esperan su confirmación o rollback. El total
y la página de pendientes se leen dentro de una misma operación encolada para
que un ACK o una edición local no se intercalen entre ambas consultas.

`prepararEsquemaSincronizacion`, en `001_initialSchema.ts`, agrega el índice
`sync_outbox_usuario_lote(usuario_id,lote,secuencia)`. Se mantiene
`sync_outbox_usuario(usuario_id,secuencia)` para obtener el primer evento FIFO.
El índice nuevo cubre la selección ordenada y la eliminación de un lote sin
recorrer los demás lotes del usuario. Se crea al abrir la base, también si ya
existe; no cambia `user_version` ni requiere borrar datos de desarrollo.

El envío calcula los registros pendientes al inicio y al terminar. Durante el
envío actualiza el contador y publica el progreso como máximo una vez cada
250 ms entre confirmaciones, en lugar de reagrupar todo el JSON por cada ACK.
Si falla, vuelve a consultar el total antes de publicar el error o revocación.
No almacena una caché persistente de cantidades ni compacta o reordena eventos.
La consulta explícita de pendientes continúa mostrando el total actual.

### Verificación de la etapa 4

Pasaron `npm run typecheck` y 151 pruebas de la app, junto con las 36 pruebas
del backend sobre MySQL 8.4.13 local aislado, sin fallos ni omisiones. Se agregaron
seis casos que comprueban lecturas sin escrituras ni avisos, espera de lecturas
con commit y rollback, continuidad de la cola, uso del índice mediante
`EXPLAIN QUERY PLAN`, preparación del índice al reabrir una base existente y
recuentos correctos al finalizar o detener un envío.

En una ráfaga controlada de 21 lotes dentro del mismo intervalo se hicieron dos
recuentos completos (inicio y final), frente a los 23 que ejecutaba el flujo
anterior (inicio, cada ACK y final). Este resultado mide consultas del escenario
de prueba, no tiempos de rendimiento en un teléfono. La suite mantiene las
pruebas de FIFO, pérdida de respuesta, rechazo, revocación y recuperación de
correo de la etapa 3.

Para la revisión manual, reiniciar el proyecto actualizado en Expo Go, ingresar
con una cuenta de prueba del servidor y esperar cero pendientes. Con el proyecto
ya cargado y sin recargarlo mientras no hay red, cortar la conexión, crear un
depósito y varios ingresos/egresos y editar el depósito. Consultar pendientes:
los cambios del mismo registro deben agruparse solo para mostrarlos. Reconectar
y comprobar pendientes en cero, saldos correctos y ausencia de duplicados,
también tras cerrar y reabrir la app. El líder confirmó posteriormente este recorrido de la etapa 4 en Expo Go. No requiere otro despliegue del backend si ya está publicada la etapa 3.


## Corrección del primer movimiento de un depósito

Se reprodujo un fallo al crear un depósito y registrar un ingreso o egreso en
el mismo minuto desde el formulario: `combinarFechaYHora` fija segundos y
milisegundos en cero, de modo que la fecha resultante parecía anterior a la
creación del depósito. SQLite y el servidor conservaban correctamente el mismo
saldo según esa fecha, aunque la intención del formulario era un movimiento
actual. Sincronizar o volver a ingresar no podía cambiar esa clasificación.

`movementService.ts` normaliza únicamente ese minuto coincidente al instante
de creación del depósito, dentro de la transacción y antes de crear el movimiento
y su recurrencia. Las comparaciones precisas del repositorio y del servidor
siguen vigentes. No requiere migraciones, cambios de dependencias o despliegue
del backend. Los datos que ya se guardaron conservan su fecha y saldo anteriores.

La regresión se cubre en `tests/movementBalance.test.ts` con ingreso, egreso,
recurrencia, reversión e historial del minuto anterior (incluido cambio de día).
`tests/syncIntegration.test.ts` agrega el envío de los movimientos del formulario
a MySQL y la recuperación del saldo y sus dos movimientos en una base SQLite
vacía de la misma instalación después de volver a iniciar sesión.

La corrección pasó tipos, 155 pruebas de la app y 36 del backend con MySQL
8.4.13 local aislado, sin fallos ni omisiones. Las dos regresiones del mismo
minuto fallaban antes del cambio y pasaron después. El líder confirmó la comprobación manual
en Expo Go con un depósito nuevo.
