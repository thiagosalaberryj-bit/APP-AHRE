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
Incluye ejemplos locales de Social: una sala abierta como administrador, otra
cerrada con un pago parcial y una vista como participante. Las salas cuyo nombre
empieza por «Demo» permiten recorrer gastos, personas, solicitudes, admisiones y
selecciones de depósito. También hay deudas con invitación y pagos pendientes de
confirmar, y vínculos en distintos estados. Las salas demo son interactivas:
permiten agregar y editar gastos, marcar partes pagadas, resolver solicitudes e
ingresos, cambiar permisos, configurar el enlace y cerrar la sala. Desde las
deudas demo se pueden aceptar o rechazar propuestas e informar o confirmar pagos.
Elegir un depósito crea movimientos reales dentro de esa cuenta ficticia local;
no envía cambios al servidor. Los enlaces y QR usan `demo.ahre.test` y sirven para
revisar el modal de compartir; no abren una sala real en otro dispositivo.
La vista como participante conserva sus permisos limitados y permite avisar el
pago de su propia parte; no permite administrar ni cerrar.
Los ejemplos se preparan una sola vez; volver a entrar no los duplica ni cambia
los saldos iniciales. Los cambios hechos al probar se conservan al volver a entrar.
Para verlos en Expo Go, cerrar sesión y usar ese acceso de desarrollo; si ya se
ingresó a esa cuenta, basta recargar JavaScript para habilitar las acciones.
La deuda «Demo · Pagos y perdón» permite probar un pago nuevo desde el botón de
registro, confirmar/rechazar el aviso de $150, asociar los $200 ya confirmados o
perdonar los $800 pendientes. Para cargar ejemplos nuevos en una cuenta de prueba
ya abierta, volver a entrar mediante «Entrar con datos de prueba».
También se incluyen cuatro deudas vistas desde quien debe: «Demo · Me perdonaron
la deuda», «Demo · Rechazaron mi pago», «Demo · Mi pago espera confirmación» y
«Demo · Confirmaron mi pago». Se consultan en Deudas, origen Online; usar Todas
o Saldadas para ver también las ya cerradas. La sala cerrada «Demo · Del lado de
quien debe» reúne esos ejemplos como participante, con Bruno como administrador.
Un rechazo mantiene el pendiente y los movimientos privados; un perdón cierra
el pendiente sin registrar dinero. Preparar estos ejemplos no cambia saldos ni
duplica registros al volver a entrar.
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

## Base de desarrollo Social

Expo Go y las builds de desarrollo usan ahre-desarrollo-social-v3.db para no abrir bases de pruebas anteriores incompatibles con el esquema actual. El archivo anterior ahre.db se conserva sin migrarlo ni borrarlo. Las builds release siguen usando ahre.db. Al cambiar al archivo de desarrollo actual es necesario ingresar otra vez para descargar los datos sincronizados del servidor. Los pendientes que solo existían en el archivo viejo no se transfieren automáticamente.

### Respuestas de la otra persona en las demos

En Deudas > Online > Todas, abrir «Demo · Compra compartida con Bruno».
Registrar un pago propio y volver al detalle. «Simular respuesta de Bruno» permite
aceptar o rechazar ese pago. Se pueden registrar varios importes sobre la misma
deuda, resolverlos por separado y luego elegir «Perdonarme» para cerrar el resto.
El rechazo conserva el pendiente y el egreso que ya se registró; la aceptación
reduce el pendiente; el perdón no crea movimientos. Los cambios persisten al
volver a entrar y se reflejan también en la sala «Demo · Del lado de quien debe».

## Salas online simuladas sin servidor

La cuenta «Entrar con datos de prueba» permite crear una sala y activar Compartir
online con contraseña sin conectarse al backend. Publicarla conserva su ID y sus
gastos; no aparece una segunda sala. El enlace y QR demo se reutilizan y pueden
renovarse o deshabilitarse. Estos enlaces son exclusivamente locales; no publican
una web ni una sala accesible desde otro teléfono.

- Creador: crear una sala con Compartir online, abrir Personas y usar «Simular
  ingreso de un invitado». En Ingresos, tocar la tarjeta y asignarla a una ficha
  o crear una persona. Admitir, rechazar, agregar desde agenda y administrar
  permisos usan los mismos controles que una sala compartida real.
- Participante: Salas → Unirme a sala → «Usar sala demo como participante».
  El formulario completa el enlace y la contraseña de la sala precargada;
  confirmar Solicitar ingreso abre la participación ya autorizada. También se
  puede abrir «Demo · Como participante» desde el listado de salas.
- Dentro de un gasto ajeno, «Ya pagué mi parte» permite preparar el depósito sin
  alterar el saldo. En Personas → Vos se puede simular la aceptación o rechazo
  del administrador. La misma ficha permite enviar observaciones.
- En Personas de la sala participante, simular permiso o retiro de permiso para
  gastos permite revisar ambos casos. Ser editor no permite administrar personas,
  acceso ni cierre. Las simulaciones están limitadas a la cuenta demo autorizada.

El informe de revisión y sus límites está en
[Auditoría de Social](../social-audit.md).
