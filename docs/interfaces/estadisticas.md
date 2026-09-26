# Estadísticas

## Controles y navegación entre gráficos

La pantalla usa el encabezado principal compartido y la descripción «Analiza
tus ingresos y gastos». Ingresos y Egresos se muestran por separado. El filtro
de categorías permite mostrar u ocultar categorías del tipo elegido; sus
colores siguen el orden del catálogo. En modo claro usan la paleta pastel y en
modo oscuro una variante neón para aumentar el contraste sobre las superficies
oscuras.

Los gráficos forman un carrusel horizontal. Se cambia entre ellos deslizando
la pantalla y los puntos debajo indican la vista activa. Cada vista tiene su
propio título y rango. No hay botones para cambiar de gráfico.

## Distribución por categoría

Admite Día, Semana, Mes y Año. Día y Semana abren un calendario para elegir
cualquier fecha. La semana se calcula de lunes a domingo y el título muestra
su rango, por ejemplo «21–27 de septiembre». Mes permite elegir mes y año; Año
permite elegir el año. El gráfico circular resume todo el período sin separar
sus días o meses. Al tocar un segmento se ve el importe y porcentaje de esa
categoría. La lista abre el detalle de categoría.

## Gráfico de columnas

Admite Semana y Año. Semana abre el calendario, calcula el lunes-domingo de la
fecha elegida y presenta sus siete días. Año presenta los doce meses del año
seleccionado. Las columnas separan las categorías con sus colores. Al tocar
una columna o deslizar el dedo sobre ellas se ve el total y el importe de cada
categoría de ese período.

El detalle de categorías queda debajo del gráfico dentro del desplazamiento
vertical de la pantalla, para poder recorrer la lista completa sin un área de
scroll interna pequeña.

## Detalles y datos

El detalle de categoría suma los movimientos de la categoría, el tipo y el mes
seleccionados. Sus filas usan la descripción, fecha y hora, y monto. Al abrir
una fila se muestra el detalle de movimiento con tipo, categoría, monto,
descripción, fecha y hora, estado de anulación y depósito asociado. Los gráficos
y detalles agregan los mismos registros de muestra por tipo, categoría y
`fecha_hora`, y excluyen los que tienen `anulado` activo. Los campos
corresponden al modelo `movimientos` de
`docs/base-de-datos/base-datos-local.md`; el depósito se resuelve mediante
`deposito_id`.

Los montos y movimientos de estas pantallas siguen siendo datos de muestra:
no se consultan ni guardan en SQLite. Los registros de muestra usan la forma
del esquema, incluidos `id`, `deposito_id`, `categoria`, `tipo`, `monto`,
`descripcion`, `fecha_hora` y `anulado`.

El detalle de categoría y el de movimiento son rutas secundarias del Stack
principal, fuera de las pestañas. Al abrirlos se oculta la barra inferior y la
flecha vuelve a la pantalla anterior. Los archivos de la pantalla de
estadísticas son `src/screens/StatisticsScreen.js` y
`src/styles/StatisticsScreenStyles.js`. Las pantallas de detalle y sus estilos
son `src/screens/CategoryDetailScreen.js`,
`src/styles/CategoryDetailScreenStyles.js`,
`src/screens/MovementDetailScreen.js` y
`src/styles/MovementDetailScreenStyles.js`.
