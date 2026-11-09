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

Carga 10.000 movimientos sintéticos en la pantalla mediante el adaptador de
interfaz. Comprueba orden descendente, conservación del origen, búsqueda con
debounce, limpieza y reutilización del filtrado/orden tras quince renders y un
cambio de tema. Cuenta operaciones; no impone un umbral de milisegundos que
dependa de la PC. No es una medición de SQLite, RAM, FPS ni del teléfono.

Para cargar datos reales de SQLite en el teléfono, actualizar la app de desarrollo
desde esta rama y seguir estos pasos:

1. Recargar Expo Go con **Reload** para volver a Inicio, sin borrar datos de la app.
2. Tocar **Entrar con 10.000 movimientos** y esperar a que termine la carga inicial.
3. Abrir el depósito **Volumen · 10.000 movimientos**. Contiene 5.000 ingresos y
   5.000 egresos, con todas las categorías y distintos importes. Hay 7.000 registros
   del mes de la carga y 3.000 repartidos en los 23 meses anteriores.
4. Buscar `Volumen 00001`, probar filtros, limpiar, desplazarse y desplegar meses.
   Luego revisar Movimientos y Estadísticas con este depósito seleccionado.
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
- App: 401 pruebas aprobadas, cero fallos y cero omisiones, incluidos el escenario
  de pantalla con 10.000 movimientos y los seis casos nuevos del generador SQLite.
  Se ejecutaron las 39 integraciones antes omitidas. Los casos nuevos comprueban
  aislamiento de la cuenta habitual, carga sin HTTP, distribución, saldo,
  reentrada y rollback tras un fallo parcial, además de las restricciones de acceso.
- Limpieza: cero bases sintéticas restantes; proceso detenido, puerto cerrado
  y carpeta de datos temporal eliminada. Los logs locales se conservan bajo
  `.expo/validation/`, fuera de Git. No hubo cambios en los archivos del servidor.

Esta ejecución valida integración MySQL/HTTP/WebSocket y los escenarios de las
suites. La medición de fluidez con datos masivos en Android sigue pendiente.
