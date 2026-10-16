# Estadísticas con movimientos locales

## Fuentes de datos y funcionamiento sin conexión

Las pantallas `StatisticsScreen` y `CategoryDetailScreen` consultan movimientos
guardados en la base SQLite local. El flujo es pantalla → `statisticsService`
→ `movimientosRepositorio` → SQLite. La pantalla no ejecuta SQL. Las
consultas unen `movimientos` con `depositos` y limitan cada resultado al usuario
de la sesión activa.

No se consulta backend ni servicios de Internet. Los filtros, agrupaciones,
sumatorias y detalles funcionan offline. Al volver a Estadísticas se vuelven a
consultar los datos para reflejar movimientos agregados o editados mientras la
pantalla no tenía el foco.

## Filtro por tipo

Cada consulta recibe un solo tipo: `ingreso` o `egreso`. SQLite filtra por
`m.tipo = ?` y excluye movimientos con `m.anulado = 1`. Las transferencias no
forman parte de las estadísticas de ingresos y egresos. Al cambiar el selector,
la pantalla vuelve a consultar y actualiza los dos gráficos y el resumen.

## Período mensual y anual

El gráfico circular conserva las opciones existentes Día, Semana, Mes y Año.
Las fechas seleccionadas se convierten en límites locales de inicio inclusivo y
fin exclusivo (`fecha_hora >= inicio AND fecha_hora < fin`). Mes consulta
únicamente el mes y año seleccionados; Año consulta únicamente el año elegido.
Día y Semana siguen el mismo criterio con su fecha o semana seleccionada.
Al abrir Estadísticas, el resumen inicia en Mes y el gráfico de columnas en
Año; ambos selectores siguen permitiendo cambiar el período.

El gráfico de columnas semanal agrupa por día local, desde el lunes hasta el
domingo. La vista anual agrupa por mes local. La interfaz construye siete días
o doce meses, respectivamente, y completa con cero los períodos que no
aparecieron en el resultado SQL. Así se conserva la continuidad temporal. Si
todo el rango carece de movimientos, se muestra el estado vacío y no se dibuja
un gráfico de ceros.

## Categorías, totales y porcentajes

SQLite agrupa por `categoria` y devuelve `ROUND(SUM(m.monto), 2)` y
`COUNT(m.id)`. El total general se calcula sumando los totales agrupados del
tipo y período actuales, antes de aplicar el filtro visual de categorías.
Para cada categoría visible:

```text
participación = total de categoría / total general × 100
```

Si el total general es cero no se calcula una división. El filtro de categorías
solo oculta o muestra series y filas; no cambia el denominador. Por eso el
gráfico circular puede mostrar un arco parcial cuando se ocultan categorías,
mientras que el centro mantiene el total de todos los movimientos incluidos.
El resumen muestra categoría, importe, participación y cantidad de movimientos.

## Detalle y evolución de categoría

Al abrir una categoría se envían su identificador, tipo, año y mes seleccionados.
Una consulta local obtiene los doce totales mensuales de esa categoría y tipo;
la interfaz crea también las posiciones sin resultados con total cero. Otra
consulta, limitada al mes, obtiene el total, la cantidad y las filas reales de
movimientos junto con el nombre del depósito. Las filas conservan descripción,
fecha, hora e importe y abren el detalle existente del movimiento.

El selector de año termina en el actual y no ofrece futuros. Su primer año es
el de creación de la cuenta, con la excepción del año previo cuando la cuenta
se creó durante el actual.
La tarjeta del detalle presenta el icono, el nombre de la categoría y su
descripción. Los selectores de mes y año aparecen juntos con el estilo de los
filtros de Estadísticas y abren listas de opciones. Una línea gris los separa
del resultado mensual, que muestra la cantidad de movimientos y el importe
total. La evolución anual conserva las doce barras y omite importes repetidos.
Cada barra sigue exponiendo su importe mediante su etiqueta de accesibilidad.

El detalle vuelve a consultar SQLite al recuperar el foco y al cambiar de mes.
Cuando el mes no tiene movimientos, el resumen mensual muestra un único estado
vacío y la lista no repite el mensaje. La evolución anual conserva los meses
vacíos si hay actividad en otros meses del año. Si no hubo actividad de la
categoría en todo el año, se omite el gráfico vacío.

## Estrategia monetaria

La columna local `monto` se conserva como `REAL`, de acuerdo con el esquema
actual. Los movimientos se normalizan a dos decimales al guardarse mediante
`convertirMontoMovimiento`. SQLite redondea a dos decimales las sumatorias y la
capa de servicio normaliza los resultados a dos decimales; no se convierten
montos a enteros ni se redondea cada fila antes de sumar. La presentación
formatea los importes con hasta dos decimales.

## Consultas locales

`movimientosRepositorio` ofrece consultas específicas para:

- agrupar el período del resumen por categoría, con total y cantidad;
- agrupar la semana por día/categoría o el año por mes/categoría;
- consultar la evolución anual de una categoría;
- consultar el total y las filas reales de una categoría en un mes.

Todas usan parámetros enlazados para usuario, tipo, fechas y categoría. Las
fechas se guardan en ISO 8601 UTC; los límites se generan con fechas locales de
inicio de día y fin exclusivo, y las expresiones SQLite `strftime(...,
'localtime')` asignan día o mes según la zona local del dispositivo. Los índices
existentes de fecha, tipo y categoría apoyan estas consultas; no se requiere
cambio del esquema.
