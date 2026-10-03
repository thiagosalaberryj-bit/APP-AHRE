# Carga local del Dashboard

## Fuente de datos

El Dashboard usa `obtenerSesionActual()` para consultar al usuario asociado a la
sesión local. Si no se encuentra un usuario activo, la pantalla conserva su
estado visual, muestra un aviso y permite reintentar; el flujo general de
sesiones inconsistentes pertenece a Inicio y Autenticación.

Con el usuario disponible, `depositosRepositorio` consulta sus depósitos en
SQLite. Cada depósito entrega el identificador, nombre, tipo, icono, color,
descripción y `saldo_actual` que utiliza la interfaz. No se generan registros de
ejemplo automáticamente.

## Balance general

El balance se calcula sumando el campo `saldo_actual` de los depósitos
consultados. No se guarda un saldo separado en el Dashboard. Cuando no hay
depósitos, el resultado es cero. El saldo mostrado por cada fila también procede
de `saldo_actual`.

## Movimientos recientes

Se consultan los movimientos asociados a los identificadores de los depósitos
del usuario. La consulta excluye los registros con `anulado = 1`, ordena por
`fecha_hora` descendente y limita el resultado a **cinco movimientos**. La
pantalla completa de Movimientos conserva la responsabilidad de mostrar el
historial.

La pantalla convierte las categorías conocidas en sus nombres e iconos de
presentación y muestra el nombre del depósito asociado. Los tipos
`transferencia_entrada` y `transferencia_salida` se representan como
transferencias recibidas y enviadas, respectivamente.

Si no hay movimientos, se muestra el estado vacío maquetado. Una consulta vacía
no se considera un error; el estado incluye un icono y explica dónde aparecerán
los ingresos y egresos.

## Actualización y estados

Al tomar el foco, el Dashboard vuelve a consultar la sesión y los datos locales.
Así puede reflejar depósitos o movimientos que otro módulo haya guardado antes
de volver a la pantalla. Después de la primera carga, conserva los datos visibles
mientras consulta la información actualizada; no reemplaza el contenido por
esqueletos durante cada regreso al Dashboard. Los esqueletos se muestran en la
carga inicial o al reintentar cuando todavía no hay datos.

Si no se encuentra el usuario o falla una consulta, la pantalla no se cierra de
forma inesperada: presenta un mensaje, emite un aviso toast y ofrece «Reintentar».
Los datos financieros vacíos se presentan con los estados vacíos existentes.
El estado sin depósitos incluye el botón «Crear depósito», que conserva la ruta
de navegación ya definida.

## Desarrollo y pruebas manuales

Para observar el Dashboard con información, insertar registros de prueba a
través de la capa local de datos y asociarlos al usuario autenticado. No se
incluye una carga automática de ejemplo en AHRE. La información sin depósitos
debe mostrar balance cero y estados vacíos; con registros, el resumen debe
actualizarse al volver a enfocar el Dashboard.

## Funcionamiento sin conexión

La sesión, los depósitos y los movimientos se consultan en la base SQLite local.
Esta pantalla no realiza solicitudes HTTP ni depende de Wi-Fi o datos móviles.
