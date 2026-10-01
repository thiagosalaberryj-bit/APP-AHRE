# Dashboard principal

## Alcance

El Dashboard presenta un resumen de la información financiera local y accesos a
las operaciones principales. Obtiene el usuario, los depósitos y los
movimientos desde SQLite; no utiliza datos de ejemplo como fuente normal ni
requiere conexión a Internet. La pantalla acompaña los temas claro y oscuro y
permite desplazarse verticalmente cuando el contenido supera la altura
disponible.

## Estructura

La pantalla se compone de:

1. encabezado con marca, bienvenida, nombre y accesos a Notificaciones y Perfil;
2. tarjeta de balance con una franja superior integrada titulada «Balance»,
   control para ocultar el monto y acciones rápidas;
3. lista local de depósitos y acceso para crear uno;
4. hasta cinco movimientos recientes, agrupados por día, y acceso a Movimientos.

No se muestra una sección de deudas en el Dashboard.

## Encabezado y balance

El encabezado reutiliza `MainHeader.js` y muestra el nombre devuelto por la
sesión local junto con los accesos a Notificaciones y Perfil. La tarjeta de
balance se superpone al borde inferior del encabezado verde y mantiene sus
cuatro esquinas redondeadas. Su franja superior centra «Balance» y la separa
del monto con un borde fino.

El saldo general se calcula sumando `saldo_actual` de los depósitos consultados.
No se guarda un balance separado. Si no hay depósitos, el monto es cero. El
control de ojo solo oculta o muestra el saldo en pantalla y no guarda una
preferencia.

## Acciones rápidas

La tarjeta presenta tres accesos con ícono y etiqueta:

- **Ingreso:** abre la pantalla existente de ingreso.
- **Egreso:** abre la pantalla existente de egreso.
- **OCR:** abre la pantalla existente de OCR.

Estos accesos mantienen la navegación definida por la aplicación; sus
formularios y operaciones no forman parte de la carga del Dashboard. OCR también
está disponible en el menú inferior «Nuevo» bajo la etiqueta «Escanear OCR».

## Depósitos

La lista se consulta para el usuario de la sesión local y representa cada fila
con su identificador, nombre, tipo, descripción, icono, color y saldo actual. El
icono y el color guardados se utilizan cuando están disponibles; se usan valores
predeterminados visuales si faltan.

Si no hay depósitos, el estado vacío muestra un icono de billetera, una
explicación y el botón «Crear depósito», que abre la ruta existente. Cuando hay
depósitos, «Agregar depósito» aparece en el encabezado de la sección. Al
seleccionar una fila, se abre Detalle de depósito y se envía el objeto
consultado, que contiene el identificador del depósito. La lógica interna de
esa pantalla corresponde a su propio issue.

## Movimientos recientes

Se consultan y muestran hasta cinco movimientos asociados a los depósitos del
usuario, ordenados por `fecha_hora` descendente y agrupados por día. Se
representan su categoría, descripción, hora, depósito, tipo, monto e icono de
categoría. Las transferencias entrantes se muestran como ingresos y las
salientes como egresos. Los movimientos anulados no se incluyen.

Si la consulta no devuelve movimientos, se muestra un icono y un mensaje de
estado vacío. «Ver todos» y la flecha del balance abren la pestaña Movimientos.

## Carga, errores y actualización

Al abrir el Dashboard o cuando vuelve a tomar el foco, la pantalla vuelve a
consultar la sesión y la información financiera. Mientras espera muestra los
esqueletos ya maquetados y no presenta datos de ejemplo. Si falla una consulta,
se muestra un aviso y un estado con la acción «Reintentar»; la ausencia de
depósitos o movimientos no se trata como error.

Las lecturas se hacen exclusivamente mediante la base local. El Dashboard no
consulta conectividad ni realiza solicitudes HTTP, por lo que sus datos
disponibles se pueden consultar sin Wi-Fi ni datos móviles.

## Navegación inferior

La barra mantiene las cinco pestañas existentes: Inicio, Movimientos, Nuevo,
Estadísticas y Social. Al tocar «Nuevo», se oscurece el fondo y aparecen en
abanico Escanear OCR, Ingreso y Egreso. Cada acción cierra el menú y abre su
ruta; tocar el fondo también lo cierra. Mantener presionado «Nuevo» no abre el
menú.

## Estilos y componentes

`DashboardScreen.js` reutiliza `MainHeader.js`, las paletas de `colors.js` y los
estilos globales. Las reglas propias de layout se encuentran en
`src/styles/DashboardScreenStyles.js`. Las filas y acciones que solo se usan en
esta pantalla se mantienen locales para no ampliar componentes compartidos.

La lógica de consultas, límites, datos vacíos, actualización y pruebas manuales
está descrita en [Dashboard local](../funcionalidades/dashboard.md).
