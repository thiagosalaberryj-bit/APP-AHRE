# Pruebas de optimización y mantenimiento

## Validación local

Desde APP-AHRE, con las dependencias existentes preparadas:

```powershell
npm run typecheck
npm test
```

Los casos MySQL se omiten si no están habilitados. Una ejecución sin fallos con
omisiones no acredita la integración con servidor. El adaptador de interfaz
ejecuta los callbacks reales, pero no el layout ni el rendimiento nativo.

## MySQL aislado

Se necesita MySQL 8.4 exclusivamente para pruebas y el backend de SERVER-AHRE
con sus dependencias ya preparadas. La instalación de herramientas corresponde
al líder. No usar credenciales ni instancias de producción.

También se puede usar el binario MySQL 8.4 de Laragon sin iniciar su instancia
habitual. Se inicializa una carpeta nueva con `--no-defaults --initialize-insecure`
y un `--datadir` exclusivo. El proceso de pruebas usa `--no-defaults`, ese mismo
`--datadir`, `--bind-address=127.0.0.1`, `--port=13307` y `--mysqlx=OFF`.
Debe verificarse `@@datadir` antes de crear el usuario de pruebas o escribir
datos. No se usan `my.ini`, servicios ni carpetas de datos existentes de Laragon.
Las variables y comandos de las suites indicados debajo son los mismos.

Si Docker ya está disponible, esta opción crea una instancia descartable,
publicada solo en loopback y sin montar datos del proyecto:

```powershell
$contenedorPruebas = 'ahre-mysql-pruebas-' + ([guid]::NewGuid().ToString('N').Substring(0, 8))
$env:MYSQL_ROOT_PASSWORD = [guid]::NewGuid().ToString('N')
docker run --name $contenedorPruebas --detach --publish 127.0.0.1:13307:3306 --env MYSQL_ROOT_PASSWORD --env MYSQL_ROOT_HOST=% mysql:8.4
if ($LASTEXITCODE -ne 0) { throw 'No se creó el contenedor de pruebas.' }
docker exec $contenedorPruebas sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h 127.0.0.1 -u root --silent'
```

Repetir el último comando hasta que MySQL responda correctamente. La contraseña
aleatoria se transmite por entorno; no imprimirla ni guardarla en Git. En esta
misma terminal, configurar y ejecutar:

```powershell
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '13307'
$env:DB_USER = 'root'
$env:DB_PASSWORD = $env:MYSQL_ROOT_PASSWORD
$env:AHRE_SERVER_SOURCE = (Resolve-Path '..\SERVER-AHRE').Path
$env:AHRE_MYSQL_TEST = '1'

npm --prefix ..\SERVER-AHRE\backend run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del backend.' }
npm --prefix ..\SERVER-AHRE\backend test
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas del backend.' }
npm test
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de la app.' }
```

Las suites crean bases aleatorias `ahre_test_*`, levantan HTTP/WebSocket de
prueba en loopback y eliminan sus bases al terminar. No necesitan publicar el
backend. Revisar el resumen final: registrar aprobadas, fallidas y omitidas;
no declarar comprobadas las integraciones que no se ejecutaron.

Al terminar, retirar únicamente el contenedor creado en esta sesión:

```powershell
docker rm --force $contenedorPruebas
Remove-Item Env:DB_HOST,Env:DB_PORT,Env:DB_USER,Env:DB_PASSWORD,Env:MYSQL_ROOT_PASSWORD,Env:AHRE_SERVER_SOURCE,Env:AHRE_MYSQL_TEST -ErrorAction SilentlyContinue
```

Si se utiliza otra instancia de pruebas, definir sus `DB_*` en lugar de crear
el contenedor; el usuario debe poder crear y eliminar solo bases de pruebas.

## Muchos movimientos

El escenario automatizado se ejecuta sin servidor ni datos reales:

```powershell
node --experimental-vm-modules --test --test-name-pattern="10.000 movimientos" tests/depositDetailPerformance.test.ts
```

Entrega 10.000 movimientos sintéticos al servicio simulado de la pantalla y
comprueba que monta solo 50 tarjetas y agrega otras 50 al pedir más, sin duplicar
un doble toque. Se ejecuta en ambas pantallas: valida meses plegados sin consultas
de filas, apertura con carga y reapertura limitada a las primeras 50 filas,
incluso después de mostrar 300. Verifica feedback previo a la consulta, descarte
de páginas al cerrar, posición del encabezado y ausencia de vacíos transitorios
durante las etapas de carga de Movimientos. Comprueba también el
indicador animado y la carga automática solo con botón visible y desplazamiento
descendente. `tests/visibleLoadMore.test.ts` cubre mediciones pendientes, dirección,
inercia y ausencia de cargas al detenerse. Otros casos cubren debounce, filtros, reintentos y respuestas
vencidas. `tests/depositPagination.test.ts` ejecuta además el generador y las
consultas reales de SQLite: verifica resumen sin historial completo, recorrido
de los 7.000 registros del mes mediante cursor y búsquedas fuera de la página.
No se impone un umbral de milisegundos dependiente de la PC. Estas pruebas no
miden RAM, FPS ni la latencia del teléfono.

Para cargar datos reales de SQLite en el teléfono, actualizar la app de desarrollo
desde esta rama y seguir estos pasos:

1. Recargar Expo Go con **Reload** para volver a Inicio, sin borrar datos de la app.
2. Tocar **Entrar con 10.000 movimientos** y esperar a que termine la carga inicial.
3. Abrir el depósito **Volumen · 10.000 movimientos**. Contiene 5.000 ingresos y
   5.000 egresos, con todas las categorías y distintos importes. Hay 7.000 registros
   del mes de la carga y 3.000 repartidos en los 23 meses anteriores.
4. Buscar `Volumen 00001`, probar filtros, limpiar, desplazarse y desplegar meses.
   Luego revisar Movimientos y Estadísticas con este depósito seleccionado.
   En ambas pantallas, comprobar que no hay filtros iniciales, que el mes actual
   abre con 50 filas y que los anteriores están plegados. Desplegar uno debe
   cargar solo su primera página. Llegar al botón mientras se baja debe agregar
   otras 50 con indicador animado; quedarse quieto, subir o no ver el botón no
   debe cargar. Verificar también el toque manual y el reintento tras un error.
   Acumular 300 filas, plegar y reabrir el mes: debe mostrar feedback debajo del
   título y volver a 50 filas. Repetir mientras hay una página pendiente para
   confirmar que no reaparece al terminar. Comprobar que el encabezado no salta
   al final al cambiar la altura. Al entrar a Movimientos o volver a la pestaña,
   no debe aparecer «Sin resultados» entre las distintas etapas de carga.
   Cambiar búsqueda o filtros debe reiniciar los meses e incluir coincidencias
   que no estaban en la primera página, sin descargar meses plegados.
5. Cerrar la sesión de pruebas y volver a ingresar a la cuenta habitual al terminar.

El acceso aparece solo en desarrollo. Usa la cuenta local independiente
`pruebas@ahre.test`; no requiere MySQL, conexión ni otra contraseña. El depósito
masivo se agrega a los ejemplos existentes y sus pares de ingresos/egresos tienen
saldo neto cero. La preparación es atómica, se ejecuta por lotes y no duplica ni
restablece registros al reentrar. Las ediciones o anulaciones de prueba se conservan.
Si el depósito fue eliminado, se informa el problema sin reactivarlo. Se rechaza
la carga en cuentas de pruebas vinculadas al servidor y con sincronización habilitada.
No se borran bases, datos ni depósitos de la cuenta habitual.

Comparar la versión base y esta rama en el mismo teléfono, con el mismo conjunto
y configuración. Para comparar con la base, se necesita llevar este generador
también a esa versión; el adaptador automatizado por sí solo no mide el teléfono:

1. Probar el mes de mayor volumen y el historial completo de 10.000 movimientos.
2. Medir apertura de Movimientos y Detalle de depósito, búsqueda tras la pausa de
   250 ms, limpieza, desplazamiento y apertura/cierre de meses y filtros.
3. Repetir cinco veces cada recorrido, anotar mediana y peor tiempo observado,
   bloqueos del teclado y pausas visibles. Distinguir carga inicial de reapertura.
4. Revisar Estadísticas, saldo y cantidad de resultados con el mismo dataset,
   también en oscuro y sin conexión. Medir FPS/RAM con herramientas del teléfono
   si están disponibles y registrar herramienta, dispositivo y build utilizados.

Una prueba rápida con pocos registros confirma el recorrido, pero no demuestra
fluidez con grandes volúmenes. El tamaño del APK debe medirse por separado.

## Resultado de la ejecución del 9 de noviembre de 2026

Se utilizó MySQL Community 8.4.3 incluido en Laragon, sin Docker ni instalaciones.
La instancia recibió una carpeta nueva bajo `.expo/validation/` y escuchó solo
en `127.0.0.1:13307`. Se comprobó su ruta de datos y se creó un usuario temporal
con permisos para las bases sintéticas `ahre_test_*`, con contraseña aleatoria
conservada solo en el entorno del proceso de pruebas.

- Backend: tipos correctos y 60 pruebas aprobadas, cero fallos y cero omisiones.
- App: 429 pruebas aprobadas, cero fallos y cero omisiones, incluidos el escenario
  de pantalla con 10.000 movimientos y los seis casos nuevos del generador SQLite.
  Se ejecutaron las 39 integraciones antes omitidas. Los casos nuevos comprueban
  aislamiento de la cuenta habitual, carga sin HTTP, distribución, saldo,
  reentrada y rollback tras un fallo parcial, además de las restricciones de acceso.
  Tras el bloqueo detectado en el teléfono se verificaron también la paginación
  real de SQLite y la pantalla limitada a 50 tarjetas, así como el nuevo desglose
  de barras en ambos temas. La nueva presentación y la fluidez nativa del detalle
  deben comprobarse nuevamente en el dispositivo.
  La última ejecución cubre además ambas listas sin filtros iniciales, meses
  históricos plegados sin descargar filas, caché al reabrir y carga automática
  condicionada por botón visible y desplazamiento descendente, con indicador animado.
  Se cubrieron feedback antes de preparar filas, reapertura de 300 a 50
  movimientos, descarte de páginas al cerrar y restauración de posición.
- Limpieza: cero bases sintéticas restantes; proceso detenido, puerto cerrado
  y carpeta de datos temporal eliminada. Los logs locales se conservan bajo
  `.expo/validation/`, fuera de Git. No hubo cambios en los archivos del servidor.

Esta ejecución valida integración MySQL/HTTP/WebSocket y los escenarios de las
suites. La medición de fluidez con datos masivos en Android sigue pendiente.

## Ajuste posterior de la interfaz de Movimientos

Se retiraron la flecha y su franja. La corrección de vacíos transitorios se
verificó con 27 casos de interfaz y la suite local completa: 390 aprobadas,
cero fallos y 39 integraciones MySQL omitidas; no se levantó MySQL en esta
repetición. `npm run typecheck` y el chequeo de variables sin uso de la app pasan.
La prueba nueva observó todos los renders y detectó el parpadeo antes del cambio.
Después comprueba entrada, reenfoque y limpieza de criterios sin vacíos prematuros,
además de casos legítimos sin coincidencias y cuenta vacía una vez respondidos.

## Encabezados plegables

El marco compartido mantiene fuera del scroll todos los encabezados existentes.
La suite local pasó con 399 pruebas aprobadas, cero fallos y 39 integraciones
MySQL omitidas. Los nueve casos nuevos comprueban plegado por gesto descendente,
inercia y elección manual, regreso al inicio, rebotes en contenido corto, ambos
temas, referencias y callbacks nativos, cancelación de paginación y reducción
de movimiento. También comprueban el color de la barra compacta, las acciones
de perfil y notificaciones y la ausencia de fondos individuales. Se conserva
la paginación y la suite de formularios de Social.

En el teléfono, revisar Inicio, Movimientos, Estadísticas, Social, un formulario,
un detalle y Sincronización. Arriba no deben aparecer flechas; al bajar debe
plegarse el encabezado y quedar una barra del mismo verde, con dos flechas y los
íconos de sincronización, notificaciones y perfil, sin tapar contenido ni
mostrar fondos individuales. Comprobar sus acciones y estados de sincronización;
al desplegar el encabezado no deben duplicarse los accesos.
Alternar manualmente, seguir subiendo y bajando, y usar la segunda flecha para
volver al inicio. Repetir con teclado abierto y reducir movimiento. En
Movimientos, comprobar que el regreso no dispara más páginas ni una restauración
antigua de posición. Inicio debe describir «Tu balance, depósitos y movimientos.».
Esta verificación no mide FPS ni reemplaza la comprobación visual en el dispositivo.
