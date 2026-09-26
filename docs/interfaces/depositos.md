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
| Saldo inicial | Sí | Primer campo del formulario; monto en pesos con prefijo `$`, presentación destacada como el monto de ingreso y teclado decimal. |
| Nombre | Sí | Debajo del saldo inicial; texto de hasta 30 caracteres, con ejemplos y contador. |
| Tipo de depósito | Sí | Selector entre Efectivo, Banco y Billetera virtual. |
| Ícono | Sí, con una opción inicial | Grilla compacta con cuatro opciones visibles y «Más» para abrir las restantes. |
| Color | No | Muestra azul suave predeterminada (`#C3D1E3`) y cuatro alternativas de la paleta de depósitos, todas visibles. |
| Descripción | No | Texto de hasta 60 caracteres con contador. |

El catálogo de tipos corresponde a `efectivo`, `banco` y
`billetera_virtual`, según el modelo de datos de depósitos. La opción activa se
indica con borde y cambio de fondo además del color, sin una marca de tilde.

El ícono empieza con una opción de efectivo seleccionada. La grilla muestra
Efectivo, Banco, Virtual, Billetera y «Más», siguiendo el patrón compacto del
selector de categorías. «Más» abre un modal con Tarjeta y Ahorros. La selección
es local a la pantalla y no se guarda.

El color predeterminado es el azul suave `#C3D1E3`. El selector presenta en una
sola fila los cinco colores de `COLORES_DEPOSITOS`: azul predeterminado, verde
suave, violeta, rosa y amarillo suave. Esta paleta identifica depósitos y es
independiente de los colores de categorías de Estadísticas. La opción
seleccionada presenta un tick y un borde verde de foco; las demás conservan un
borde neutro. El texto también informa el color seleccionado. La selección no
se guarda.

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
