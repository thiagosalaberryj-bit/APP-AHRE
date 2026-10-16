# Estadísticas

## Controles y navegación entre gráficos

La pantalla usa el encabezado principal compartido y la descripción «Analiza
tus ingresos y gastos». Ingresos y Egresos se muestran por separado. El filtro
de categorías permite mostrar u ocultar categorías del tipo elegido; sus
colores siguen el orden del catálogo. En modo claro usan la paleta pastel; en
modo oscuro conservan esos tonos con una saturación ligeramente mayor para
mantener el contraste sobre las superficies oscuras.

Los gráficos forman un carrusel horizontal. Se cambia entre ellos deslizando
la pantalla y los puntos debajo indican la vista activa. Cada vista tiene su
propio título y rango. No hay botones para cambiar de gráfico.
Al abrir Estadísticas, la distribución por categoría aparece en Mes y el
gráfico de columnas en Año.

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
y detalles consultan movimientos locales no anulados por usuario, tipo,
categoría y `fecha_hora`. El resumen por categoría incluye total, participación
y cantidad de movimientos. El filtro visual no cambia el total usado como
denominador de porcentajes. La evolución de categoría muestra los doce meses;
los días y meses vacíos conservan su posición con valor cero cuando hay datos
en el rango. Un rango completamente vacío muestra el estado sin información.
Los depósitos se resuelven en SQLite mediante `deposito_id`.

En el detalle de categoría, una tarjeta contiene el icono, el nombre destacado y
su descripción en un tono secundario. Los selectores de mes y año quedan juntos
bajo ese encabezado y comparten el estilo de los filtros de Estadísticas; ambos
abren una lista de opciones. La lista de años termina en el actual y nunca
ofrece años futuros. Si la cuenta se creó este año, incluye también el año
anterior. Una línea gris separa los selectores del resultado mensual, que indica
la cantidad de movimientos y el total del período. La evolución anual usa barras
sin etiquetas de importe visibles y las filas reales conservan su monto. El
total usa signo compacto y color según sea ingreso o egreso.
Si el período está vacío, se informa «No hay movimientos en este período» y la
lista no muestra filas ficticias.

Los detalles y gráficos se vuelven a consultar al recuperar el foco de la
pantalla. Toda la información procede de la base local y funciona sin conexión;
no se usan datos de muestra ni servicios externos.

Las listas dejan espacio al final del desplazamiento para que la última fila
no quede detrás del borde seguro o del botón flotante de creación en
Estadísticas.

El detalle de categoría y el de movimiento son rutas secundarias del Stack
principal, fuera de las pestañas. Al abrirlos se oculta la barra inferior y la
flecha vuelve a la pantalla anterior. Los archivos de la pantalla de
estadísticas son `src/screens/StatisticsScreen.js` y
`src/styles/StatisticsScreenStyles.js`. Las pantallas de detalle y sus estilos
son `src/screens/CategoryDetailScreen.js`,
`src/styles/CategoryDetailScreenStyles.js`,
`src/screens/MovementDetailScreen.js` y
`src/styles/MovementDetailScreenStyles.js`.
