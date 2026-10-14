# Gestión local de depósitos

## Alcance

El formulario existente de `src/screens/DepositScreen.js` crea depósitos en la
base SQLite local. La pantalla recoge y valida los campos, `src/deposits/`
aplica las reglas del dominio y `src/database/repositories/depositsRepository.js`
realiza la inserción. La pantalla no ejecuta SQL. El flujo no depende de una
conexión de red y funciona con el almacenamiento local disponible en modo
avión.

Al crear el depósito, el formulario se cierra y vuelve a la pantalla anterior.
El Dashboard consulta los depósitos activos de la sesión local y abre el detalle
enviando el identificador del depósito, no su nombre ni una copia permanente
del registro.

## Validación y almacenamiento

- **Nombre:** obligatorio, se recortan los espacios al comienzo y al final y
  admite hasta 30 caracteres.
- **Saldo inicial:** obligatorio, admite cero o valores positivos con hasta dos
  decimales. La entrada usa coma para separar los decimales, por ejemplo
  `25000,50`. Se convierte a un número en pesos antes de persistirlo; nunca se
  guarda la cadena de presentación con `$`.
  La columna usa el tipo `REAL` del esquema local. El saldo actual comienza con
  el mismo valor que el saldo inicial.
- **Tipo:** obligatorio y limitado a `efectivo`, `banco` o
  `billetera_virtual`, que corresponden a Efectivo, Banco y Billetera virtual
  en la interfaz.
- **Ícono:** obligatorio en el formulario. Se persiste únicamente el nombre
  permitido de Ionicons, como `cash-outline`, para reconstruirlo después; no se
  almacena un componente visual.
- **Color:** se guarda el color elegido de `COLORES_DEPOSITOS`. Si no se elige
  uno, se usa `COLOR_DEPOSITO_PREDETERMINADO` (`#C3D1E3`).
- **Descripción:** opcional, se recortan los espacios y admite hasta 60
  caracteres. Si queda vacía, una regla centralizada en
  `src/deposits/depositService.js` genera `Fuente «{nombre}» · {tipo}` con el
  nombre y el tipo legible del depósito.

La validación se ejecuta en el formulario para mostrar errores junto a los
campos y vuelve a ejecutarse en la lógica de depósitos antes de guardar. Si hay
campos inválidos, también se muestra un toast con un aviso general; el mensaje
específico permanece junto a cada campo. Se validan también los valores
permitidos para tipo, ícono y color; la interfaz no puede introducir
referencias arbitrarias.

## Identificador, fecha y atomicidad

`depositosRepositorio` usa la fábrica de repositorios para generar un UUID que
no depende del nombre, además de las fechas `fecha_creacion` y
`fecha_actualizacion` en formato ISO. La creación del registro se ejecuta en
una transacción SQLite. Si la inserción falla, la transacción no deja un
depósito parcial y se informa un mensaje seguro para la persona usuaria, que
puede volver a intentar.

## Envíos repetidos, cancelación y errores

Durante el guardado, el botón principal muestra el estado de carga y queda
deshabilitado; un bloqueo con `useRef` evita iniciar otra creación por una
pulsación repetida. Los controles del formulario también quedan deshabilitados.
Los errores de validación se muestran junto al campo y los errores de sesión o
de almacenamiento local se comunican mediante los avisos compartidos, sin
exponer detalles técnicos de SQLite.

«Cancelar» y la flecha del encabezado vuelven sin llamar al servicio ni guardar
información. La acción está protegida mientras existe una creación en curso.

## Componentes relacionados

- `src/screens/DepositScreen.js`: formulario, estados visuales y coordinación
  de navegación.
- `src/constants/deposits.js`: tipos e íconos permitidos.
- `src/utils/depositValidation.js`: normalización monetaria y validaciones
  reutilizables.
- `src/deposits/depositService.js`: reglas del dominio, sesión local y
  descripción automática.
- `src/database/repositories/depositsRepository.js`: inserción transaccional,
  valores inicial y actual, UUID y fechas.

## Consulta del detalle y movimientos

`src/screens/DepositDetailScreen.js` solicita el depósito por su ID a
`src/deposits/depositService.js`. El servicio verifica que pertenezca al usuario
de la sesión y que continúe activo. Si el ID falta, no existe, pertenece a otra
cuenta o está inactivo, el detalle muestra un error recuperable y permite volver
o reintentar; no navega con información ficticia.

El saldo mostrado proviene de `depositos.saldo_actual`, actualizado por las
operaciones del repositorio de movimientos según la estrategia local de la
base de datos. Un movimiento con fecha y hora anterior a `depositos.fecha_creacion`
queda en el historial, pero no afecta ese saldo; la misma regla aplica a sus
reversiones y a las transferencias. Debajo se compara con el saldo al cierre del
mes anterior. El servicio reconstruye ese cierre a partir del saldo actual, los
movimientos no anulados fechados en el mes actual y los ajustes de saldo
informados durante ese mes. Si el depósito se creó este mes o no existe una
base positiva para calcular un
porcentaje, se muestra un mensaje neutral o la variación en pesos, según
corresponda. El detalle nunca edita el saldo inicial ni el saldo actual: los
cambios de dinero siguen correspondiendo a operaciones financieras.

Los movimientos se consultan con `deposito_id` del registro seleccionado y
`anulado = 0`, ordenados por fecha y hora descendente. No se cargan movimientos
de otros depósitos. Si no hay ninguno, se conserva la tarjeta de saldo y se
muestra un estado vacío. La información se lee y guarda en SQLite local; no se
requiere red.

## Búsqueda y filtros del detalle

La búsqueda se aplica sobre la descripción y categoría de los movimientos del
depósito. Al vaciar el texto vuelve a mostrarse el conjunto que cumpla los
filtros seleccionados. La búsqueda funciona al mismo tiempo que los filtros.

Los criterios combinables son tipo de movimiento, fecha, monto y categoría.
Fecha ofrece Día, Semana, Mes y Personalizado. La semana comienza el lunes y
termina el domingo. El rango personalizado incluye ambas fechas y valida que
`desde <= hasta`. El monto acepta límites mínimo y máximo con el formato local y
valida que sean números no negativos y que el mínimo no supere al máximo.
Categoría ofrece las categorías presentes en el depósito y se puede combinar
con los demás criterios. Los criterios activos se pueden quitar por separado o
limpiar junto con la búsqueda.

## Edición

El modal existente carga nombre, tipo, ícono, color y descripción actuales. Se
validan con las mismas reglas de creación. Guardar actualiza SQLite local y la
tarjeta de detalle al instante; cancelar cierra el modal y descarta el borrador.
El saldo inicial y el saldo actual no se muestran como campos editables ni se
envían al repositorio. Si la descripción queda vacía, el servicio genera una
descripción con el nombre y tipo guardados.

## Eliminación e integridad histórica

La confirmación aplica la política documentada por DATABASE: eliminación
lógica mediante `depositos.activo = 0`. Así el depósito deja de aparecer en el
Dashboard y se preservan las filas de movimientos e historial que lo
referencian. Al confirmar, el detalle vuelve a la pantalla anterior; al
cancelar, la base permanece sin cambios. Las pantallas consultan de nuevo los
datos locales al tomar el foco.

