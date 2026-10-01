# Creación local de depósitos

## Alcance

El formulario existente de `src/screens/DepositScreen.js` crea depósitos en la
base SQLite local. La pantalla recoge y valida los campos, `src/deposits/`
aplica las reglas del dominio y `src/database/repositories/depositsRepository.js`
realiza la inserción. La pantalla no ejecuta SQL. El flujo no depende de una
conexión de red y funciona con el almacenamiento local disponible en modo
avión.

Al crear el depósito, el formulario se cierra y vuelve a la pantalla anterior.
La lista de depósitos del Dashboard sigue siendo de ejemplo y su actualización
desde SQLite queda fuera de este alcance.

## Validación y almacenamiento

- **Nombre:** obligatorio, se recortan los espacios al comienzo y al final y
  admite hasta 30 caracteres.
- **Saldo inicial:** obligatorio, admite cero o valores positivos con hasta dos
  decimales. La entrada usa el formato local: punto para agrupar miles y coma
  para separar centavos, por ejemplo `25.000,50`. Se convierte a un número en
  pesos antes de persistirlo; nunca se guarda la cadena de presentación con `$`.
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
campos y vuelve a ejecutarse en la lógica de depósitos antes de guardar. Se
validan también los valores permitidos para tipo, ícono y color; la interfaz no
puede introducir referencias arbitrarias.

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

