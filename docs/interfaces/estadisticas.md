# Estadísticas

## Etapa 1: resumen mensual

La pantalla presenta el encabezado principal compartido con las otras pestañas,
con el título «Estadísticas» y accesos a notificaciones y perfil. Incluye una
torta mensual y una lista de categorías simuladas. La torta usa cinco segmentos de colores con
sus porcentajes visibles. Al tocar cualquier segmento se muestra junto al
gráfico un indicador con su importe; por ejemplo, el segmento naranja del 15 %
muestra `$ 250.000`. La lista presenta cada categoría en general y permite
abrir su detalle.

Esta etapa cubre la pantalla base y la selección de un segmento. Las demás
representaciones y el detalle de categorías se describen en las etapas
siguientes.

## Etapa 2: resumen anual

El resumen anual aparece en la misma posición que la torta mensual. Se cambia
entre ambos gráficos con un deslizamiento horizontal manual o tocando los
indicadores inferiores. El gráfico anual presenta doce columnas apiladas, una
por mes. Cada columna está segmentada por categorías y muestra la abreviación
del mes debajo. El selector de año aparece a la derecha del encabezado cuando
se ve el gráfico anual. Los movimientos de la lista usan el color de fondo de
su categoría.

Los estilos propios de la pantalla están en
`src/styles/StatisticsScreenStyles.js`. La pantalla respeta los temas claro y
oscuro y reutiliza `react-native-svg`, dependencia ya instalada.

## Etapa 3: detalle de categoría y movimientos

Al tocar el importe de una categoría seleccionada se abre su detalle. El
encabezado muestra el icono y nombre de la categoría, el año, un selector
horizontal de meses y el importe del período. La lista inferior presenta los
movimientos simulados de esa categoría y mes. Al cambiar el mes, se actualizan
el importe y los movimientos asociados. Al tocar un movimiento se abre su
información de destinatario, método de pago y descripción.

El detalle de categoría y el detalle del movimiento reutilizan la ruta
`DetalleCategoria` en modos distintos. Se encuentran dentro de la pila interna
de Estadísticas para conservar visible la barra de navegación inferior. Los
meses, importes y movimientos son datos de muestra: no se consultan ni calculan
datos reales. La pantalla y sus estilos se encuentran en
`src/screens/CategoryDetailScreen.js` y
`src/styles/CategoryDetailScreenStyles.js`.

Al tocar una zona vacía fuera de la torta se oculta el importe seleccionado.
El importe también funciona como acceso al detalle de esa categoría.
