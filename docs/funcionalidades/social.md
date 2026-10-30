# Funcionamiento local de Social

## Alcance actual

Social guarda personas, salas, ítems, repartos, deudas y pagos en la misma base
local de AHRE. Funciona sin conexión, con los depósitos y movimientos del usuario
actual. Se mantuvo la identidad visual de la maqueta del Issue #18; el usuario
autorizó integrar la lógica en esa misma rama sin abrir otro Issue.

No hay invitaciones, sincronización ni comunicación entre cuentas. El OCR de
Social reutiliza el reconocimiento existente; ML Kit no está disponible en Expo Go.
La lista manual sí funciona en Expo Go. La preparación temporal
de Inicio solo carga depósitos y movimientos; Social comienza vacío.

Los [diagramas](../diagramas/social/README.md) explican los recorridos, la
[guía de interfaz](../interfaces/social.md) describe las pantallas y el
[contrato del esquema](../base-de-datos/social.md) enumera las restricciones SQL.

## Responsabilidades

| Módulo de src/social | Responsabilidad |
| --- | --- |
| socialService.js | Entrada pública para las interfaces y pruebas. |
| socialStore.js | Sesión, propiedad, transacción y representación interna de Vos. |
| socialValidation.js | Errores legibles, importes, normalización y reparto. |
| socialPeopleService.js | Alta, edición, desactivación y reactivación de personas. |
| socialRoomService.js | Crear salas, cambiar pertenencias y cerrar sin duplicados. |
| socialExpenseService.js | Revisar y guardar ítems, partes y asociaciones de depósito sin mover dinero. |
| socialRoomDraft.js | Leer planes de pago, preparar operaciones y reservar movimientos existentes. |
| socialPaymentService.js | Deuda manual, pago, cancelación y vinculación de movimientos. |
| socialQueryService.js | Datos de presentación y totales derivados de registros vigentes. |
| useSocialScreen.js y SocialDataContext.js | Carga al recuperar el foco y provisión de datos por pantalla. |

Los repositorios sociales están adaptados a las siete tablas del esquema. El
servicio comprueba propiedad de cada referencia antes de utilizarla. Las
pantallas no ejecutan SQL y las operaciones compuestas utilizan la conexión
recibida de la transacción, sin abrir otra cola dentro de ella.

## Personas y pertenencias

Crear contactos, salas, deudas, ítems, pertenencias o pagos exige al menos un
depósito propio activo con saldo actual positivo. Saldo cero, negativo o dinero
en otra cuenta no habilitan las altas. La comprobación se repite en los servicios;
el cierre con gastos también exige ese requisito antes de confirmar movimientos.
La consulta, edición de registros existentes y bajas siguen disponibles.

Cada cuenta tiene una representación interna única del usuario actual. Se crea
al acceder a Social; su identificador real se conserva en SQLite. La interfaz
utiliza Vos como representación visible, sin guardar ese alias como clave.

Nombre, apellido y apodo son obligatorios para contactos; nombre y apellido
admiten hasta 80 caracteres y apodo hasta 20. La comparación ignora mayúsculas,
tildes y espacios exteriores o repetidos. No se permite repetir apodo ni nombre
y apellido dentro de una agenda, incluyendo fichas desactivadas.

Editar conserva el identificador y sus relaciones. Eliminar marca activa = 0,
previa confirmación. No borra salas, partes, pagos o deudas; las obligaciones
anteriores siguen visibles y pueden saldarse. La ficha inactiva puede abrirse
desde una deuda o una coincidencia del formulario y reactivarse desde edición.
Eliminarla desde el perfil vuelve a la agenda, sin dejar el perfil desactivado
como pantalla actual. Editar datos y reactivar mantienen la vista actual.

Las pertenencias a salas son independientes de la actividad de la ficha. Quitar
una persona desactiva solo esa pertenencia y no cambia el reparto anterior.
Agregarla nuevamente reactiva la misma fila. Nuevas selecciones requieren un
contacto activo. Vos no puede retirarse ni desactivarse.

## Salas e ítems

Una sala guarda nombre de hasta 100 caracteres, descripción opcional de hasta
500, categoría de egreso, icono, color y fecha de la ocasión. La creación guarda
su fecha por separado e incluye a Vos automáticamente. Categorías, iconos y
colores se validan contra los catálogos existentes. Solo hay tres salas abiertas
por cuenta; cerrar una libera el lugar sin borrar historial.

Cada ítem tiene descripción de hasta 500 caracteres, importe, pagador, fecha,
reparto y versión. El pagador pertenece a la sala al crear el ítem y puede estar
fuera del reparto. Las partes usan un orden estable, sin repetir personas.

Los importes son positivos, con hasta dos decimales y máximo 999999999999.99.
El cálculo se hace en centavos enteros en memoria y se persiste en pesos. En
Iguales, $100 entre tres da $33,34, $33,33 y $33,33. En Manual, las partes deben
ser positivas y sumar exactamente el total antes de guardar.

La parte del pagador está cubierta por la compra. No genera una deuda consigo
mismo ni un segundo pago. Marcar Todos pagaron prepara las entregas pendientes
de las demás personas y solicita los movimientos propios necesarios.

Mientras la sala está abierta, los ítems son borradores. Guardar no crea compras,
pagos sociales ni movimientos financieros. `plan_pagos` conserva las personas
marcadas como pagadas y las asociaciones de depósito o movimiento para cada
operación propia. Esas marcas se muestran provisionalmente dentro de la sala.

La edición comprueba la versión, permite cambiar reparto, importe, pagador y
marcas de pago, y reemplaza el plan sin crear compensaciones. Las asociaciones
se validan al guardar y nuevamente al cerrar. Un movimiento existente asociado
no puede reservarse en otro gasto ni usarse para otro pago de Social.
Las salas cerradas no permiten editar ítems.

## Dinero y movimientos

### Carga múltiple

La carga múltiple se abre desde Agregar gasto → Registrar lista y conserva sus
opciones rápidas para aplicar cambios comunes a los ítems que se están cargando.
La pestaña Gastos de la sala muestra los registros sin el acceso Edición rápida;
los gastos existentes se pueden abrir y editar individualmente antes del cierre.

Registrar lista guarda entre 1 y 100 ítems, cada uno con identificador estable,
pagador y reparto propios. La interfaz aplica valores comunes y permite cambiar
los de cada fila. La previsualización valida toda la lista; guardar utiliza una
única transacción y revierte todos los ítems si falla uno. Reintentar conserva
los identificadores y no duplica las filas confirmadas. Los saldos solo cambian
al cerrar la sala.

Escanear ticket comparte OcrScreen, ocrService y receiptParser con el OCR general.
El resultado social devuelve ítems editables, sin invocar el servicio de egresos.
El parser conserva productos y total existentes y agrega items con descripción y
un importe candidato por línea. Los campos dudosos permanecen revisables; no se
reparte el total automáticamente ni se inventan importes faltantes.

| Operación | Efecto en tus depósitos |
| --- | --- |
| Registrar persona o sala | Ninguno. |
| Registrar Me debe | Egreso por el adelanto en el depósito elegido, categoría Deudas automática. |
| Registrar Le debo | Ninguno; solo se guarda la obligación. El egreso ocurre al pagarla. |
| Guardar o editar un ítem de sala abierta | Ninguno: guarda el reparto y las asociaciones. |
| Cerrar sala con un ítem pagado por Vos | Egreso por el total en el depósito asociado. |
| Otra persona paga el ítem | Ninguno hasta que entregues tu parte. |
| Parte marcada como recibida durante la sala | Ingreso al cerrar, categoría devoluciones. |
| Parte propia marcada como entregada | Egreso al cerrar, categoría de la sala. |
| Pago entre otras personas | Solo registro en la sala, sin movimiento propio. |
| Pagar deuda manual | Egreso, categoría deudas. |
| Cobrar deuda manual | Ingreso, categoría devoluciones. |
| Cancelar una deuda pendiente | Ninguno; no ocurre un pago por cambiar de estado. |

La deuda manual a cobrar exige crear o vincular el egreso de origen
en la misma transacción que la obligación. Su registro `origen_deuda` conserva
el vínculo con el movimiento y depósito; no reduce el pendiente ni cuenta como
devolución. El importe es el dinero adelantado a esa persona; para una compra
con varias partes se usa una sala. El movimiento existente debe coincidir en
usuario, importe y dirección, estar vigente y no tener otro vínculo social.
Cancelar el diálogo no guarda datos. Reintentar el mismo alta no duplica el origen.

Ejemplo: adelantar $800 deja un egreso de $800 y una deuda pendiente de $800.
Cobrarla completa crea el ingreso de $800 y recupera el dinero adelantado.
Registrar Le debo no genera un ingreso ni modifica el saldo, incluso si la
descripción indica un préstamo. Al registrar cada pago se elige el depósito
y se crea o vincula el egreso correspondiente.

El total gastado de la sala suma los ítems vigentes una sola vez, sin sumar
reembolsos. Los totales personales mantienen separadas ambas direcciones. Los
movimientos y estadísticas conservan sus reglas de entradas y salidas; no se
modificaron sus gráficos para convertirlos en estadísticas de consumo personal.

### Vincular dinero ya registrado

Al guardar una operación propia se puede crear un movimiento o usar uno existente.
El existente debe pertenecer a la cuenta, coincidir en importe y dirección y no
ser una transferencia, compensación, movimiento anulado o ya compensado. Tampoco
puede estar vinculado a otra operación de Social, aunque ese pago esté anulado.
Vincular conserva su fecha, categoría, depósito y saldo, sin otro movimiento.

Para crear uno nuevo se exige un depósito propio activo y fecha/hora válidas.
Se reutiliza la lógica financiera del repositorio. Un movimiento anterior a la
creación del depósito no cambia su saldo, conforme a las reglas existentes.
Sin depósitos, el diálogo ofrece crearlos y regresar al borrador.

Varias operaciones se revisan por separado y pueden utilizar depósitos diferentes.
Un identificador estable y una clave de operación evitan duplicar altas o pagos
al repetir un envío. Un error de guardado revierte la operación completa; el
formulario conserva sus datos para corregirlos o reintentar.

## Cierre y obligaciones propias

Los pendientes de salas abiertas son provisionales y se consultan dentro de
la sala. El cierre recarga y valida partes, planes y depósitos en una transacción.
Primero crea compras y entregas, junto con sus movimientos nuevos, o vincula
los existentes sin duplicarlos. Luego calcula las obligaciones restantes.
Solo crea deudas cuando hay una parte pendiente distinta de la del pagador y
Vos es deudor o acreedor. Los pendientes entre terceros permanecen en la sala.

La deuda guarda el importe original de la parte. Sus entregas previas se vinculan
en las mismas filas, sin copiar pagos ni repetir movimientos. Si tu parte es $4.000
y ya entregaste $1.000, la deuda conserva $4.000 originales y $3.000 pendientes.

Se incluyen partes de integrantes retirados o fichas desactivadas. Una sala
vacía, completamente pagada o con pendientes solo entre terceros se cierra sin
deudas propias. Repetir un cierre devuelve el registro cerrado sin duplicarlo.
Un fallo revierte movimientos, saldos, pagos, deudas y cierre. Los borradores
permanecen disponibles para corregir su asociación y reintentar.

Después del cierre, ítems y personas permanecen en solo lectura. Tus pagos
posteriores actualizan las deudas y el pendiente consultable en la sala; los
pagos cerrados entre terceros no se editan. Una sala cerrada no se reabre.

## Pagos y cancelaciones

Los pagos parciales o completos deben ser positivos y no superar el pendiente
actual. Las comprobaciones se repiten dentro de la transacción. Una deuda de
sala se paga por su participación para mantener un único límite de entregas.
Su estado se actualiza a parcial o pagada junto con el movimiento y el pago.
Al saldar muestra Deuda saldada y regresa directamente al inicio de Social.
Los pagos parciales muestran Pago registrado y regresan a la vista anterior.

Eliminar deuda pide confirmación y marca cancelada con fecha. No registra pago,
no devuelve dinero ni borra persona, origen o movimientos. Se retira de los
pendientes y del listado visible, conservando su historial en SQLite.
Una deuda saldada conserva su historial y no puede eliminarse: se oculta la
acción y se rechaza la cancelación tanto en el servicio como en SQLite.

La anulación desde Movimientos de un pago propio vinculado coordina la
compensación financiera, la anulación del pago y el estado de su deuda. Una
compra de sala cerrada no puede anularse. La edición de un borrador abierto
no utiliza reversiones: todavía no generó movimientos.

Revertir el movimiento de origen de una deuda manual requiere corregir primero
sus devoluciones vigentes. Después compensa el movimiento y cancela la obligación
en la misma transacción, conservando el historial. Eliminar solamente la deuda
no compensa el adelanto.

## Consultas y errores

Los totales y estados visibles se derivan de importes y pagos vigentes. Los
contactos inactivos no desaparecen de sus deudas anteriores. Las búsquedas y
filtros se aplican sobre los datos reales y no escriben filas.

La carga se repite al recuperar el foco. Guardar una persona espera la recarga
antes de cerrar su modal y limpia la búsqueda anterior para mostrarla enseguida.
Textos descriptivos e importes se presentan en una línea con puntos suspensivos;
los resúmenes mantienen sus columnas y el tamaño de fuente.
Los errores de carga ofrecen Reintentar;
los de validación y guardado se comunican mediante toast. Se bloquean envíos
repetidos y se evita navegar dos veces cuando una pantalla deja de estar montada.
No se insertan personas, salas o deudas ficticias al arrancar.

## Verificación y límites

Las pruebas de servicios ejecutan autenticación, esquema y repositorios reales
sobre SQLite en memoria, sustituyendo únicamente adaptadores Expo. Incluyen
repartos, pagos en ambas direcciones, terceros, personas inactivas, propiedad,
reintentos, cierres, movimientos vinculados, compensaciones, sobrepagos y rollback.
Las pruebas de interfaces ejecutan callbacks reales sobre esos servicios con
un adaptador de React/native en claro y oscuro; no comprueban layout nativo.

```powershell
node --experimental-vm-modules --test tests/socialSchema.test.js tests/socialService.test.js tests/socialInterface.test.js tests/developmentData.test.js tests/receiptParser.test.js tests/ocrExpenseDraft.test.js tests/ocrExpensePersistence.test.js
```

Quedan para revisión en Expo Go: tamaño de texto, teclado, navegación de regreso,
crear depósito y volver, modo avión, reinicio y cambio de cuenta. Se conectó el
OCR existente, sin preparar un APK ni validar captura nativa. El esquema inicial requiere una base de desarrollo
compatible; no convierte ni borra automáticamente bases anteriores.
