# Estadísticas

## Controles y navegación entre gráficos

El primer control es Egresos/Ingresos, con radio exterior de 10 puntos y el
rectángulo de selección que se desplaza en 200 ms mediante
`SegmentedSelector.tsx`, sin alterar dimensiones ni animar la carga inicial.
La preferencia del sistema para reducir movimiento desactiva la transición.
El período es un control compacto, del mismo tamaño que fecha, mes y año:
Día/Semana/Mes/Año en el circular y Semana/Año en columnas, sin selector
segmentado animado. Todos aparecen encima de los filtros rápidos.
Período, mes y año abren listas flotantes ancladas al control (ancho de 132 a
224 puntos, altura limitada a 184 puntos y scroll). Las opciones son filas
planas de 32 puntos, sin tarjetas ni bordes individuales, con texto de 14 puntos
y una marca discreta en la selección. No hay un segundo contenedor dentro de
la superficie flotante. Los meses y sus encabezados se mantienen en una línea.
La superficie tiene un borde fino del tema y recorta su contenido al radio de
las esquinas, para que el resaltado de la selección no sobresalga.
Día y semana abren un calendario flotante
compacto con scroll interno. Se dibujan sobre el contenido, sin desplazarlo ni
usar modales. El ancho y la posición se ajustan al espacio visible y, si no
caben debajo, se abren arriba. Solo puede quedar uno abierto; se cierra al
seleccionar, tocar fuera o pulsar Atrás.

La cabecera presenta una fila desplazable con «Filtros», preajustes de categorías
y rangos monetarios, sin tarjeta ni marco exterior. Estadísticas no tiene
buscador. Se comparte `MovementSearchFilters.tsx` con Movimientos usando su
variante sin búsqueda. En egresos ofrece Todas, Día a día (Hogar,
Alimentación y Compras), Servicios y obligaciones, Bienestar y formación, Movilidad y salidas y Finanzas y trabajo; en ingresos,
Todas, Trabajo y ventas, Finanzas y Ayudas y reintegros. Los grupos se acumulan:
el primero limita la selección a ese grupo y los siguientes suman sus categorías.
Tocar un grupo activo quita solo sus categorías; «Todas» restablece el catálogo. Una línea
inferior muestra cada grupo activo por su nombre, además de las categorías
elegidas por separado, con una acción para quitar cada criterio y
«Limpiar» fijo a la derecha. Mantiene su altura incluso vacía, mostrando «Sin
filtros seleccionados», para no desplazar el contenido al elegir un filtro.
«Filtros» abre `MovementFiltersPanel.tsx`, el mismo
panel inferior de Movimientos, con las mismas secciones plegables, selectores
de categorías y depósitos, y entradas de monto mínimo/máximo con formato local.
Los períodos de Estadísticas conservan sus selectores propios según el gráfico.
El botón indica cuántos filtros están activos; «Limpiar» permite restablecerlos.

Los depósitos se combinan con categorías, monto y período, y se
conservan en el detalle de categoría, incluyendo su evolución anual.

El importe ofrece Cualquier monto, Hasta $1.000, $1.000–$5.000 y $5.000 o más.
Los límites son inclusivos y se aplican a cada movimiento antes de sumar,
también en ambos gráficos y al abrir el detalle. Se combinan con las categorías
y el período. «Limpiar» quita depósitos, categorías e importe y
conserva el tipo y el período elegidos. Al cambiar de tipo se restablecen los
filtros rápidos. Los botones activos se identifican por fondo, borde y estado
accesible. Los controles de período y fecha permanecen por encima de los filtros.

La pantalla usa el encabezado principal compartido y la descripción «Analiza
tus ingresos y gastos». Ingresos y Egresos se muestran por separado. El filtro
de categorías permite mostrar u ocultar categorías del tipo elegido; sus
colores suaves se resuelven por identificador en `src/styles/categoryColors.ts`, sin
depender del orden ni del filtro. Cada familia tiene un color base y cada
categoría un tono propio; ambos temas conservan la misma asociación visual.
La paleta clara mantiene sus tonos pastel. La oscura amplía la diferencia de
luminosidad entre los tres tonos de cada familia para distinguir los sectores
del gráfico. Esto no modifica los colores claros.
El desglose del gráfico circular se ordena y separa por familia; dentro de cada
familia los tonos van del más intenso al más claro. Las categorías del panel
mantienen ese orden y usan los colores compartidos. Grillas y modales consumen
`ordenarCategoriasPorColor`, con asociación estable por identificador y tipo de movimiento.

Las filas de accesos rápidos y períodos usan `HorizontalFilterRow.tsx`: muestran
un desvanecido en el borde cuando hay opciones fuera de vista y lo retiran al
llegar al extremo. El efecto no captura toques. Los filtros tienen radio de
5 puntos, altura mínima de 38 puntos (sin cambiar ancho ni tipografía) y el
buscador conserva borde neutro en reposo, con verde solo al enfocar.

| Tipo | Familia | Color base | Categorías |
| --- | --- | --- | --- |
| Egreso | Día a día | Ámbar | Alimentación, Compras, Hogar |
| Egreso | Servicios y obligaciones | Azul | Servicios, Suscripciones, Impuestos |
| Egreso | Bienestar y formación | Verde | Salud, Educación, Mascotas |
| Egreso | Movilidad y salidas | Turquesa | Transporte, Viajes, Entretenimiento |
| Egreso | Finanzas y trabajo | Violeta | Deudas, Transferencias, Trabajo |
| Egreso | Regalos | Rosa | Regalos |
| Egreso | Otros | Gris | Otros gastos |
| Ingreso | Trabajo y ventas | Dorado | Sueldo, Trabajo independiente, Ventas |
| Ingreso | Finanzas | Violeta | Inversiones, Préstamos recibidos, Transferencias recibidas |
| Ingreso | Ayudas y reintegros | Rosa | Becas / ayudas, Regalos, Devoluciones |
| Ingreso | Otros | Gris | Otros ingresos |

Son familias visuales: las categorías y los movimientos guardados siguen
separados. Ingreso/egreso se identifican por texto, signo y su color de estado;
las cards de movimientos conservan iconos verdes para ingresos y rojos para
egresos. En selectores y detalles de categorías se usa una tinta más oscura del
matiz pastel para mantener legible el icono sobre el tema claro. No se
aplican degradados dentro de sectores: cada sector mantiene un relleno uniforme
para que se pueda comparar con su leyenda. Los tonos relacionados forman una
escala dentro de la familia, con nombre e icono para distinguir cada categoría.

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

El detalle de categoría usa una tarjeta de resumen con ícono y nombre, familia
de color y descripción. El total mensual queda alineado a la derecha, en una
sola línea adaptable para importes largos; debajo aparecen la cantidad de
movimientos y el promedio por movimiento. El ícono mantiene contraste sobre
el relleno de la categoría también en modo oscuro. El selector de año ocupa
el lugar del número junto a «Evolución anual» y abre una lista flotante con
scroll, borde del tema y contenido recortado en las esquinas. Se cierra al
elegir, tocar fuera, desplazar la pantalla o pulsar Atrás, sin abrir un modal.

La evolución anual se presenta en doce columnas compactas con el color de la
categoría. Tocar un mes cambia el período del resumen y los movimientos, sin
un selector de mes adicional ni información repetida debajo del gráfico. El
resaltado mensual tiene extremos redondeados y no altera las dimensiones; al consultar otro mes del
mismo año se conserva el gráfico mientras llegan los nuevos datos. La lista
inferior reutiliza las cards de movimientos, con su fecha dentro y sin
encabezados repetidos por día. El estado vacío permite seguir cambiando el
período. Todos estos estilos son locales al detalle y admiten ambos temas.

El detalle de categoría suma los movimientos de la categoría, el tipo y el mes
seleccionados. Sus filas usan la descripción, fecha y hora, y monto. Al abrir
una fila se muestra el detalle de movimiento con tipo, categoría, monto,
descripción, fecha y hora, estado de anulación y depósito asociado. Los gráficos
y detalles consultan movimientos locales no anulados por usuario, tipo,
categoría y `fecha_hora`. El resumen por categoría incluye total, participación
y cantidad de movimientos. El total y los porcentajes corresponden a las
categorías e importes seleccionados. La evolución de categoría muestra los doce meses;
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
con importe visible por mes; tocar una fila selecciona ese mes y consulta sus
movimientos. El encabezado también identifica la familia de la categoría. El
total usa signo compacto y color según sea ingreso o egreso.
Si el período está vacío, se informa «No hay movimientos en este período» y la
lista no muestra filas ficticias.

Los detalles y gráficos se vuelven a consultar al recuperar el foco de la
pantalla, conservando los datos visibles si no cambió la consulta. La carga
inicial no muestra textos intermedios de «Buscando movimientos locales»; los
gráficos aparecen al completar la lectura. Al cambiar el período o el tipo se
retiran los resultados anteriores para no mostrarlos bajo un filtro distinto.
Toda la información procede de la base local y funciona sin conexión;
no se usan datos de muestra ni servicios externos.

Las listas dejan espacio al final del desplazamiento para que la última fila
no quede detrás del borde seguro o del botón flotante de creación en
Estadísticas.

El detalle de categoría y el de movimiento son rutas secundarias del Stack
principal, fuera de las pestañas. Al abrirlos se oculta la barra inferior y la
flecha vuelve a la pantalla anterior. Los archivos de la pantalla de
estadísticas son `src/screens/StatisticsScreen.tsx` y
`src/styles/StatisticsScreenStyles.ts`. Las pantallas de detalle y sus estilos
son `src/screens/CategoryDetailScreen.tsx`,
`src/styles/CategoryDetailScreenStyles.ts`,
`src/screens/MovementDetailScreen.tsx` y
`src/styles/MovementDetailScreenStyles.ts`.
