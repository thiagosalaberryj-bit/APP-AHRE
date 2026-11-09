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

Para medir en Android, falta preparar un dataset sintético equivalente dentro
de una cuenta local de desarrollo. El acceso actual a datos de prueba no carga
10.000 movimientos. Una vez disponible ese dataset, comparar la versión base y
esta rama en el mismo teléfono, con el mismo conjunto y configuración:

1. Probar con 1.000 y 10.000 movimientos, tanto en un mes como repartidos entre meses.
2. Medir apertura de Movimientos y Detalle de depósito, búsqueda tras la pausa de
   250 ms, limpieza, desplazamiento y apertura/cierre de meses y filtros.
3. Repetir cinco veces cada recorrido, anotar mediana y peor tiempo observado,
   bloqueos del teclado y pausas visibles. Distinguir carga inicial de reapertura.
4. Revisar Estadísticas, saldo y cantidad de resultados con el mismo dataset,
   también en oscuro y sin conexión. Medir FPS/RAM con herramientas del teléfono
   si están disponibles y registrar herramienta, dispositivo y build utilizados.

Una prueba rápida con pocos registros confirma el recorrido, pero no demuestra
fluidez con grandes volúmenes. El tamaño del APK debe medirse por separado.
