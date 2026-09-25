# Dashboard principal

## Alcance

El Dashboard presenta un resumen visual de la situación financiera y accesos a
las operaciones principales. Los datos actuales son simulados: la pantalla no
consulta SQLite ni persiste cambios. El diseño acompaña los temas claro y
oscuro, y permite desplazarse verticalmente cuando el contenido supera la
altura disponible.

## Estructura

La pantalla se compone de:

1. encabezado con marca, bienvenida, nombre y accesos a Notificaciones y Perfil;
2. tarjeta de balance con una franja superior integrada titulada «Balance»,
   control para ocultar el monto y acciones rápidas;
3. tarjeta agrupada con la lista de depósitos y el acceso para crear uno;
4. lista plana de hasta cinco movimientos recientes y acceso a Movimientos.

No se muestra una sección de deudas en el Dashboard.

## Encabezado y balance

El encabezado reutiliza `MainHeader.js` y muestra «Bienvenido», el nombre de
ejemplo «Thiago» y accesos a Notificaciones y Perfil. Los accesos abren las
rutas existentes.

La tarjeta de balance se superpone al borde inferior del encabezado verde y
mantiene sus cuatro esquinas redondeadas. En su parte superior, una franja de
ancho completo centra «Balance» y la separa del saldo con un borde fino. Debajo
se muestran un monto de ejemplo de `$ 2.000.000`, un control de ojo para
ocultarlo visualmente, una flecha que abre Movimientos y las tres acciones
rápidas. El control no guarda una preferencia.

## Acciones rápidas

La tarjeta presenta tres accesos con ícono y etiqueta:

- **Ingreso:** abre la pantalla existente de ingreso.
- **Egreso:** abre la pantalla existente de egreso.
- **OCR:** abre la pantalla existente de OCR.

Estos accesos solo permiten probar la navegación. La carga de formularios y el
registro real se implementarán posteriormente. OCR también está disponible en
el menú inferior «Nuevo» bajo la etiqueta «Escanear OCR».

## Depósitos

Efectivo, Mercado Pago y Banco aparecen como tarjetas compactas estáticas. Cada
tarjeta muestra un icono sobre el color asignado desde `COLORES_DEPOSITOS`, el
nombre, tipo y descripción en una sola línea pequeña, y el saldo. Los datos
continúan siendo simulados. El botón «Nuevo depósito» abre la ruta existente.
Las tarjetas también abren la pantalla de detalle disponible.

La estructura incluye una presentación de carga y un estado vacío para cuando
no haya depósitos.

## Movimientos recientes

La lista se presenta directamente sobre el fondo de pantalla y muestra como
máximo cinco elementos simulados. Cada fila contiene descripción, categoría,
fecha, signo e icono. El fondo del icono usa `COLORES_ESTADO.ingreso` o
`COLORES_ESTADO.egreso` según el tipo; el signo y el icono mantienen la
distinción sin depender solamente del color. «Ver todos» navega a la pestaña
Movimientos.

La estructura incluye una presentación de carga y un estado vacío para cuando
no haya movimientos.

## Navegación inferior

La barra mantiene las cinco pestañas existentes: Inicio, Movimientos, Nuevo,
Estadísticas y Social. Se refuerza el borde del botón central y el peso de la
etiqueta seleccionada para hacer más clara la navegación. Al tocar «Nuevo», se
oscurece el fondo y aparecen en abanico las acciones rápidas
Escanear OCR, Ingreso y Egreso. Cada acción cierra el menú y abre su ruta; tocar
el fondo también lo cierra. Mantener presionado «Nuevo» no abre el menú.

## Estilos y componentes

`DashboardScreen.js` reutiliza `MainHeader.js`, las paletas de `colors.js` y
los estilos globales. Las reglas propias de layout se encuentran en
`src/styles/DashboardScreenStyles.js`. Las filas y acciones que solo se usan en
esta pantalla se mantienen locales para no ampliar componentes compartidos.

Los ejemplos se mantienen en la pantalla y no requieren conexión a Internet.
