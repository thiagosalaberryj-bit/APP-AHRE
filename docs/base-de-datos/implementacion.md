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

## Errores

`ErrorBaseDatos` ofrece mensajes seguros para inicialización, migraciones,
consultas, escrituras, integridad y transacciones. Los errores de SQLite se
clasifican centralmente; en desarrollo solo se registra la etapa y el código
técnico, no los valores de la operación.

## Verificación

Para los cambios de persistencia se comprobó el análisis sintáctico de los
repositorios modificados y se ejecutó el esquema inicial en SQLite en memoria.
La primera etapa verificó trece tablas, las claves foráneas y la aceptación
de ejemplos de transferencia y reversión de movimiento. Para autenticación
también se verificó el índice único normalizado del correo, la tabla de
credenciales y las preferencias iniciales. Las comprobaciones de credenciales
correspondieron a una revisión anterior. El formato actual usa SHA-256 con sal;
esta modificación no se probó en un dispositivo. Como los datos son locales de
desarrollo, las cuentas creadas con el formato anterior se descartan y se
registran de nuevo. `git diff --check` no reportó errores.

Este entorno no tiene un script de pruebas del proyecto. No se ejecutó el
adaptador de repositorios de `expo-sqlite` dentro de Expo, ni se probó el flujo
completo de Registro, Login y cierre/reapertura en un dispositivo Android o en
modo avión. Esas comprobaciones manuales siguen pendientes. El código de
autenticación no invoca interfaces de red.

### Esquema de Social

El esquema inicial ampliado contiene quince tablas en total. Las pruebas de
Social ejecutan el SQL completo sobre SQLite en memoria, incluidas claves
foráneas, restricciones, triggers, relaciones por cuenta y rollback. Los flujos
y limitaciones de esta etapa se describen en [social.md](social.md). La
validación en un dispositivo con Expo SQLite sigue pendiente. Los servicios y
formularios ya están conectados y cubiertos por pruebas automatizadas; ver los
alcances y comandos en [social.md](social.md).
