# Esquema local de Social

## Estado de esta etapa

El esquema inicial ya define las siete tablas de Social y sus restricciones.
`001_initialSchema.js` contiene tanto las entidades financieras como las sociales,
en una única definición inicial con versión `1`. No hay una segunda migración,
conversión de bases anteriores ni inserción automática de ejemplos.

Los repositorios y los formularios ya utilizan este contrato mediante los
servicios de `src/social/`. Las escrituras, cierres y pagos se prueban contra
SQLite real en memoria; queda pendiente comprobarlos en Expo Go en dispositivo.

Los [diagramas](../diagramas/social/README.md) explican los recorridos y la
[especificación funcional](../funcionalidades/social.md) define las reglas que
ejecutan los servicios.

## Convenciones

Los identificadores son `TEXT` estables, generados localmente. Todas las tablas
sociales tienen `usuario_id`; las referencias sociales usan claves compuestas
para no mezclar cuentas. `usuarios`, `depositos` y `movimientos` conservan su
modelo y sus repositorios financieros existentes.

Los importes usan `REAL` en pesos, positivos, con hasta dos decimales y máximo
de `999999999999.99`. El cálculo de repartos utiliza centavos enteros en memoria;
los límites se comprueban con sumas redondeadas a centavos en las restricciones.
No se almacenan símbolos de moneda ni campos paralelos de centavos.

`salas.fecha` es un día local válido `AAAA-MM-DD`. Las fechas de compras, deudas,
pagos y auditoría son marcas ISO 8601; su formato completo y la coherencia
cronológica deben validarse en el servicio. La base exige los campos obligatorios,
pero no interpreta husos horarios ni actualiza automáticamente las fechas.

## Tablas y campos

### Personas

| Campos de `personas` | Contrato |
| --- | --- |
| `id`, `usuario_id` | Identidad estable y propietario. |
| `nombre`, `apellido`, `apodo` | Nombre requerido; apellido y apodo requeridos para contactos. Apodo de 1 a 20 caracteres. |
| `nombre_normalizado`, `apellido_normalizado`, `apodo_normalizado` | Claves para comparar sin tildes, diferencias de mayúsculas o espacios repetidos. El servicio debe producirlas; SQLite no normaliza Unicode. |
| `correo_electronico` | Opcional, conservado del modelo previo. No es requisito del alta social. |
| `es_usuario_actual`, `activa` | Indicadores 0/1. Una sola fila por cuenta representa a Vos y no puede desactivarse ni convertirse en contacto. |
| `fecha_creacion`, `fecha_actualizacion` | Marcas de auditoría obligatorias. |

Los índices únicos de apodo y nombre/apellido normalizados incluyen contactos
inactivos y excluyen la representación interna de Vos. La fila interna puede
tener apellido, apodo y sus claves correspondientes en `NULL`. Eliminar significa
`activa = 0`: el borrado físico está bloqueado, incluso sin referencias previas.

### Salas y pertenencias

| Tabla | Campos |
| --- | --- |
| `salas` | `id`, `usuario_id`, `nombre`, `descripcion`, `categoria`, `icono`, `color`, `fecha`, `estado`, `fecha_cierre`, `fecha_creacion`, `fecha_actualizacion`. |
| `personas_sala` | `id`, `usuario_id`, `sala_id`, `persona_id`, `activa`, `fecha_alta`, `fecha_baja`. |

La sala está `abierta` sin fecha de cierre o `cerrada` con fecha de cierre.
SQLite limita a tres abiertas por cuenta y rechaza cualquier actualización de
una sala cerrada. Categoría, icono y color son textos no vacíos: el servicio debe
validarlos contra los catálogos de AHRE.

La pertenencia sala/persona es única y se reactiva sobre la misma fila. Una baja
requiere `activa = 0` y `fecha_baja`; una pertenencia activa no tiene fecha de baja.
Vos no puede retirarse. Agregar exige persona activa y sala abierta; después del
cierre no se cambia el listado. Ninguna de estas tablas admite borrado físico.
El servicio incluye a Vos al crear cada sala; la base no lo inserta sola.

### Ítems y partes

| Tabla | Campos |
| --- | --- |
| `gastos_compartidos` | `id`, `usuario_id`, `sala_id`, `pagador_id`, `descripcion`, `monto_total`, `fecha`, `reparto`, `plan_pagos`, `estado`, `version`, `fecha_creacion`, `fecha_actualizacion`. |
| `participantes_gasto` | `id`, `usuario_id`, `gasto_compartido_id`, `persona_id`, `monto_correspondiente`, `orden`. |

Un ítem es `vigente` o `cancelado`, con reparto `iguales` o `manual` y versión
entera positiva. Su pagador debe ser integrante activo cuando se crea o se cambia.
El pagador puede no tener una participación propia. Las referencias y el usuario
no pueden cambiarse para trasladar un registro a otra sala o cuenta.

La persona y el orden son únicos dentro de cada ítem. Las partes nuevas requieren
integrantes activos; las ya existentes conservan su identidad al retirar o
desactivar un contacto. No pueden superar el total del ítem ni reducirse por
debajo de lo ya pagado. Una parte con pagos o deuda no se borra.

La suma exacta de todas las partes se valida al finalizar la transacción del
ítem y al cerrar la sala. Durante una inserción incremental la base permite
un reparto incompleto, porque SQLite no difiere esa suma hasta el `COMMIT`.
El incremento y comprobación de `version` corresponden al servicio; el campo
no cambia automáticamente.

`plan_pagos` es texto JSON con `pagaron` y `financiaciones`, validado por el
servicio. Guarda identidades de personas y asociaciones por operación con depósito
o movimiento, fecha y nombre del depósito. No se inserta dinero en movimientos
ni filas en pagos_sociales al guardar el borrador. Se comprueban nuevamente
propiedad, estado, importe y dirección al cerrar, dentro de la transacción que
crea pagos, movimientos y deudas. Un movimiento reservado no se reutiliza en otro
borrador o pago social. Las reglas de estructura del JSON pertenecen al servicio.

Los ítems abiertos pueden reemplazar partes y marcas de pago sin compensaciones.
Se conserva la comprobación de versión. No se modifica un ítem de sala cerrada.

### Deudas propias

| Campos de `deudas` | Contrato |
| --- | --- |
| `id`, `usuario_id` | Identidad y propietario. |
| `deudor_id`, `acreedor_id` | Personas distintas de la misma cuenta. Exactamente una representa a Vos. |
| `participante_gasto_id` | Opcional para deuda manual; único y obligatorio para identificar el origen de una deuda de sala. |
| `monto`, `descripcion`, `fecha`, `fecha_vencimiento` | Importe original, descripción y fecha obligatorios; vencimiento opcional. |
| `estado` | `pendiente`, `parcial`, `pagada` o `cancelada`. |
| `fecha_cancelacion`, `motivo_cancelacion` | Fecha requerida al cancelar; motivo opcional. Cancelar no permite reactivar la deuda. |
| `fecha_creacion`, `fecha_actualizacion` | Auditoría. |

La deuda de sala debe coincidir con persona, pagador e importe original de su
participación. Una parte completamente pagada no puede originar una nueva deuda.
La deuda manual requiere personas activas al crearla; las deudas de sala y los
pagos previos conservan referencias a personas retiradas o desactivadas.

No se guardan `tipo` ni `persona_id` redundantes: la dirección se deriva de los
dos extremos. Las obligaciones entre terceros se quedan en partes y pagos de
la sala, sin filas de deuda personal. No se modifica el importe u origen de una
deuda ya creada ni se borra físicamente.
Una deuda saldada no admite cancelación: un trigger comprueba los pagos vigentes
sin incluir el adelanto de origen. El servicio aplica la misma validación.

### Registro común de pagos

`pagos_sociales` reemplaza la tabla anterior `pagos_deuda`.

| Campos | Contrato |
| --- | --- |
| `id`, `usuario_id`, `clave_operacion` | Identidad y clave de reintento única por usuario, también para pagos anulados. |
| `clase` | `compra`, `parte`, `deuda` u `origen_deuda`. |
| `gasto_compartido_id` | Solo para compra. |
| `participante_gasto_id` | Solo para entrega de parte. |
| `deuda_id` | Requerido en pago u origen de deuda manual; opcional en entrega de parte hasta asociarla al cierre. |
| `monto`, `fecha`, `descripcion` | Importe y fecha obligatorios; descripción opcional. |
| `movimiento_id` | Único en toda la tabla. Requerido para dinero propio; ausente para operaciones entre terceros. |
| `estado`, `fecha_anulacion` | `vigente` sin fecha de anulación o `anulado` con fecha. Los nuevos pagos comienzan vigentes. |
| `fecha_creacion`, `fecha_actualizacion` | Auditoría. |

Una compra debe cubrir el total del ítem y solo hay una compra vigente por ítem.
Si pagaste vos exige un egreso completo; si pagó otra persona no admite un
movimiento en tus depósitos. La compra no se suma como entrega de una parte.

Una entrega de parte relaciona participante y pagador distintos. Exige egreso
si entregás vos, ingreso si recibís vos y ningún movimiento entre terceros.
El pago directo de clase `deuda` solo admite deudas manuales: una deuda de sala
se paga por su participación para no eludir el límite común de sus entregas.

`origen_deuda` vincula el adelanto a una deuda manual a cobrar, con un único
registro por deuda. Exige un egreso propio por el importe completo y que Vos
sea acreedor. No admite deudas donde Vos es deudor, una participación de sala,
ni se cuenta en las sumas de devoluciones o límites de sobrepago. En Le debo no
hay movimiento inicial ni fila de origen: el egreso ocurre al pagar.
El servicio guarda la deuda a cobrar y su origen de manera atómica; el esquema
permite crear primero la obligación dentro de esa transacción.

Si una entrega tiene `deuda_id`, esa deuda debe corresponder exactamente a su
participación y cuenta. Vincular entregas previas al cerrar modifica esa referencia
en las mismas filas. El servicio debe vincular todas las entregas previas antes
de actualizar el estado de la deuda y confirmar el cierre.

No se superan el importe de la parte o deuda con pagos vigentes. Importe, fecha,
clase, movimiento, clave de operación y origen de un pago confirmado no se
reescriben. Solo se completa el vínculo de deuda pendiente, se actualizan datos
descriptivos o se anula conservando el registro. No se reactiva un pago anulado.
La anulación monetaria debe coordinarla el servicio con la compensación existente.

Después del cierre se admiten entregas y anulaciones vinculadas a deudas propias.
No se cambia la compra original ni los pagos cerrados entre terceros.

## Relación con movimientos y saldos

El movimiento debe pertenecer al propietario, ser del tipo e importe correctos,
estar vigente y no ser una transferencia interna ni una compensación. La base
impide cambiar los datos económicos de un movimiento que ya tenga un vínculo
social. No se calculan ni actualizan saldos mediante los triggers de Social.

Crear un movimiento, usar uno existente y verificar un depósito activo se
coordinan en `socialPaymentService.js`. Vincular un movimiento no vuelve a mover
el saldo. `socialMovementReversal.js` integra la compensación financiera con la
anulación del pago y el estado de su deuda en la misma transacción. Una compra
cerrada no se revierte; una compra abierta con entregas exige corregirlas antes.
Las pantallas recargan sus consultas al recuperar el foco.

Revertir un origen manual con devoluciones vigentes se rechaza hasta corregirlas.
Sin ellas, la reversión anula el origen y cancela su deuda, conservando las filas.
Cancelar la deuda desde Social no revierte el movimiento de origen.

Una clave única evita insertar dos pagos de la misma operación. Reconocer un
reintento, devolver el resultado anterior y mantener esa clave al reintentar
corresponde al servicio. Dos entregas legítimas iguales usan claves distintas.

## Base de desarrollo y pruebas

Una base creada con el esquema previo y `user_version = 1` no recibe columnas
nuevas automáticamente. Para desarrollar esta etapa se necesita una base nueva
o una limpieza explícita de datos descartables de desarrollo. No se cambió la
inicialización ni se borró o convirtió una base existente. Las bases con datos
reales deben conservarse; la migración de esas bases no forma parte de esta etapa.

`tests/socialSchema.test.js` ejecuta el esquema inicial completo sobre SQLite en
memoria, con claves foráneas activas. Cubre personas inactivas, cupo, referencias
por usuario, importes, repartos, pagos propios y de terceros, vinculación al cierre,
unicidad de movimientos, sobrepagos, cancelaciones, historial y rollback.

```powershell
node --experimental-vm-modules --test tests/socialSchema.test.js tests/socialService.test.js tests/socialInterface.test.js tests/developmentData.test.js tests/receiptParser.test.js tests/ocrExpenseDraft.test.js tests/ocrExpensePersistence.test.js
```

Las pruebas de servicios ejecutan repositorios, sesión y transacciones reales
con un adaptador SQLite en memoria. Las de interfaz recorren los componentes
reales en ambos temas con adaptadores de React y controles nativos; no verifican
la distribución visual ni sustituyen una prueba de Expo SQLite en dispositivo.
