# Formulario de creación de depósitos

## Finalidad y alcance

`src/screens/DepositScreen.js` presenta el formulario para preparar un nuevo
depósito, es decir, una fuente donde el usuario organiza su dinero. Se abre
desde «Nuevo depósito» en el Dashboard y usa la ruta de depósito ya registrada
en `AppNavigator.js`.

Esta pantalla es una maqueta: conserva los valores y las selecciones mientras
está abierta, pero no crea depósitos, no escribe en SQLite y no modifica saldos.
El botón «Crear depósito» muestra los estados de error o de procesamiento de
manera simulada; al completar los campos, informa que la creación todavía no
está disponible. La flecha del encabezado vuelve a la pantalla anterior.

## Campos

| Campo | Requerido | Presentación |
| --- | --- | --- |
| Nombre | Sí | Texto de hasta 30 caracteres, con ejemplos y contador. |
| Saldo inicial | Sí | Monto en pesos con prefijo `$` y teclado decimal. |
| Tipo de depósito | Sí | Selector entre Efectivo, Banco y Billetera virtual. |
| Ícono | Sí, con una opción inicial | Grilla compacta con cuatro opciones visibles y «Más» para abrir las restantes. |
| Color | No | Muestra azul suave predeterminada (`#C3D1E3`), tres tonos de categoría y «Más» para ver los ocho colores con sus nombres. |
| Descripción | No | Texto de hasta 60 caracteres con contador. |

El catálogo de tipos corresponde a `efectivo`, `banco` y
`billetera_virtual`, según el modelo de datos de depósitos. La opción activa se
indica con borde y cambio de fondo además del color, sin una marca de tilde.

El ícono empieza con una opción de efectivo seleccionada. La grilla muestra
Efectivo, Banco, Virtual, Billetera y «Más», siguiendo el patrón compacto del
selector de categorías. «Más» abre un modal con Tarjeta y Ahorros. La selección
es local a la pantalla y no se guarda.

El color predeterminado es el azul suave `#C3D1E3`. El selector mantiene una
sola fila con tres tonos de la paleta pastel compartida y «Más» abre el resto
de la paleta con sus nombres: rojo, naranja, amarillo, verde claro, verde,
azul, violeta y rosa. Los tonos coinciden con los de Estadísticas en ambos
temas. La muestra seleccionada presenta un tick y un borde verde de foco; las
demás conservan un borde neutro. Esto incluye el azul predeterminado y las
opciones del modal. Si se elige un color adicional, «Más» muestra ese tono con
el tick y el borde verde al cerrar el modal. El texto también informa el color
seleccionado. La selección no se guarda.

La descripción es opcional. Si queda vacía, la lógica futura podrá generar una
con información del nombre y el tipo del depósito; la pantalla actual no la
genera.

## Estados visuales

- **Normal:** campos y superficies usan los tokens del tema activo.
- **Enfocado:** los campos de texto usan el borde de foco global.
- **Error:** al intentar continuar con nombre, saldo o tipo faltante o inválido,
  el campo correspondiente muestra borde y texto de error. También se muestra
  un mensaje general.
- **Guardando:** el botón principal presenta «Procesando…» durante una pausa
  simulada.
- **Error general:** al terminar la pausa no se crea información; se indica que
  el guardado aún no está disponible.

No se implementan reglas financieras, cálculos del saldo ni persistencia.

## Teclado, adaptación y temas

La pantalla combina `KeyboardAvoidingView`, `ScrollView`,
`keyboardShouldPersistTaps="handled"` y el espacio inferior del área segura para
mantener accesibles los campos y las acciones con el teclado abierto. El saldo
usa `decimal-pad`. El formulario limita el ancho a 480 puntos y se adapta a
pantallas angostas mediante tarjetas que pueden ocupar más de una fila.

El encabezado reutiliza `SectionHeader`; los campos y las acciones utilizan los
estilos globales. Los estilos propios de distribución están en
`src/styles/DepositScreenStyles.js` y consumen `TEMAS`,
`COLOR_DEPOSITO_PREDETERMINADO`, `COLORES_GRAFICOS` y los tokens de
`globalStyles.js`. La paleta se mantiene legible en modo claro y
oscuro, y el formulario respeta el área segura superior e inferior.
