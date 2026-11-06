# Entorno y pruebas de APP-AHRE

## Preparar e iniciar

Usar Node 24 y npm; la última verificación local utilizó Node 24.12.0 y npm 11.6.2.
La instalación o modificación de dependencias corresponde al líder según
[AGENTS.md](../../AGENTS.md). Desde la raíz de este repositorio:

```powershell
npm ci --no-audit --no-fund
```

El comando reproduce `package-lock.json`; no es una actualización de versiones.
`EXPO_PUBLIC_API_URL` se lee al empaquetar el JavaScript. El valor de referencia
está en [.env.example](../../.env.example) y el código tiene ese mismo valor de
respaldo en [remote.ts](../../src/sync/remote.ts). Si se necesita un `.env` local,
crearlo sin reemplazar uno existente y usar una URL de API accesible desde el teléfono:

```dotenv
EXPO_PUBLIC_API_URL=https://ahre-server.tailc5dfc5.ts.net/api/v1
```

Reiniciar Metro después de cambiarlo; un APK requiere nueva compilación. Las
variables `EXPO_PUBLIC_*` se incluyen en el cliente: no colocar claves ni contraseñas.

```powershell
npm start -- --go --clear
```

Escanear el QR de Expo Go, con PC y teléfono en la misma red. `npm run android`
inicia Expo con apertura Android; los scripts `ios` y `web` existen, pero la
verificación de este proyecto se centra en Android. Expo Go debe ser compatible
con SDK 57. Si la CLI propone otra versión de Expo Go o usar una build propia,
no actualizar el SDK por ese motivo sin revisar compatibilidad.

El registro y primer ingreso de una instalación requieren servidor. Los ingresos
offline posteriores necesitan cuenta, verificador y autorización locales previos.
«Entrar con datos de prueba» es un acceso de desarrollo independiente del servidor.
Para cortar la red en una prueba, cargar primero el proyecto y mantenerlo abierto:
sin acceso a Metro, una recarga puede impedir volver a cargar el JavaScript.

## Pruebas

### Expo desde otra red

Para probar desde Expo Go sin compartir la red de la PC, iniciar un solo Metro:

```powershell
npm start -- --go --tunnel --port 8081
```

El túnel requiere `@expo/ngrok` disponible globalmente en el entorno de Node que
ejecuta Expo. Su instalación corresponde al líder, salvo autorización expresa;
no requiere agregarlo al `package.json` de AHRE. Expo informa cuando el túnel
está listo y proporciona un QR o enlace `exp://…exp.direct`. Ese enlace puede
cambiar entre sesiones: usar el de la ejecución actual.

La PC debe permanecer encendida, conectada y con Metro activo para recibir
cambios. Si Metro no reconoce un archivo que existe después de cambiar de rama,
detenerlo y reiniciarlo agregando `--clear`. El túnel permite acceder al servidor
de desarrollo; no publica un APK ni reemplaza una build interna.

### Comandos de verificación

```powershell
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Falló la comprobación de tipos.' }
npm test
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de la app.' }
```

Los adaptadores ejecutan servicios reales sobre SQLite en memoria de Node; las
pruebas de interfaz sustituyen React Native. No equivalen a probar layout,
biometría, SecureStore ni SQLite nativo en un teléfono.

Para incluir los escenarios de `tests/syncIntegration.test.ts`:

1. Preparar un MySQL 8.4 aislado con un usuario autorizado a crear y eliminar
   exclusivamente bases sintéticas `ahre_test_*`; nunca usar la base productiva.
2. Configurar `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` en la terminal de
   pruebas; el backend de prueba crea bases aleatorias y las elimina al terminar.
3. Compilar el backend de la carpeta hermana SERVER-AHRE y activar la integración:

```powershell
npm --prefix ..\SERVER-AHRE\backend run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del backend.' }
$env:AHRE_SERVER_SOURCE = (Resolve-Path '..\SERVER-AHRE').Path
$env:AHRE_MYSQL_TEST = '1'
npm test
if ($LASTEXITCODE -ne 0) { throw 'Falló la integración con MySQL.' }
```

Si el servidor está en otra carpeta, ajustar `AHRE_SERVER_SOURCE`. Las pruebas
levantan una API temporal en loopback; no usan el backend público de la app.
No guardar credenciales en Git ni publicarlas en logs. Sin esas variables los
casos MySQL se omiten explícitamente: informar aprobadas, fallidas y omitidas.

## Datos locales y diagnóstico

En desarrollo se permiten bases Expo de prueba descartables cuando el esquema
inicial cambia. No limpiar datos de personas ni del servidor para aplicar una
modificación. La preparación de índices y tablas auxiliares de las etapas 3 y 4
es aditiva y no requiere borrar datos. Ver [SQLite](../base-de-datos/implementacion.md).

Ante un fallo, registrar pantalla, cuenta sintética, conexión, pendientes y
pasos para reproducir; no compartir contraseñas o tokens. La pantalla de
Sincronización distingue falta de red, sesión, revocación y conflicto. Un
movimiento anterior a la creación del depósito es histórico; el formulario
normaliza el mismo minuto de creación según la [regla de movimientos](../funcionalidades/movimientos.md).

Para exportar o distribuir, seguir [Publicación](publicacion.md). El estado de
las comprobaciones se mantiene en [Estado y validación](../estado-y-validacion.md).
