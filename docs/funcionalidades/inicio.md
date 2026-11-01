# Lógica de inicio de AHRE

## Alcance

Al abrir AHRE, la aplicación prepara SQLite y deja visible la pantalla
existente de Inicio. Si SecureStore conserva un identificador recordado, carga
su preferencia de apariencia para aplicarla antes de mostrar Inicio; esta
lectura no valida la sesión. La aplicación no decide durante el arranque si
debe abrir Login o el Dashboard. La sesión se valida cuando la persona completa
el deslizador.

```text
abrir AHRE
→ inicializar SQLite
→ cargar apariencia recordada, si existe
→ permanecer en Inicio
→ deslizar para iniciar
→ consultar la sesión local
```

La funcionalidad es local y funciona sin conexión. La carga posterior a la
huella es una pantalla completa dentro de la ruta existente de Inicio; no agrega
una ruta nueva. La pantalla de carga muestra el logo completo y no agrega un
texto fijo en el centro.

## Comprobación al deslizar

`src/screens/HomeScreen.tsx` llama a `obtenerSesionActual()` al terminar el
deslizamiento. El servicio recupera el identificador desde la memoria o
`expo-secure-store` y confirma en SQLite que corresponda a un usuario activo.
Si la sesión es válida, Inicio conserva la apariencia ya cargada durante el
arranque y continúa con la comprobación biométrica; no vuelve a consultar ni a
cambiar el tema en ese momento.

- Sin sesión válida, Inicio se reemplaza por Login. No se solicita biometría.
- Si la referencia guardada apunta a un usuario que ya no existe o está
  inactivo, el servicio intenta limpiar esa referencia y se continúa a Login.
- Si la sesión es válida, se consulta si el dispositivo tiene hardware
  biométrico y una huella configurada; después se muestra el diálogo nativo de
  autenticación local.
- Si el dispositivo no permite autenticar con biometría, se ofrece Login con
  contraseña como alternativa.
- Si la persona cancela o no se valida la huella, no se abre el Dashboard. El
  deslizador vuelve al inicio para permitir otro intento.
- Si falla SecureStore o una consulta local, se muestra un aviso y se puede
  volver a deslizar. Un error de lectura no se interpreta como falta de sesión.

```text
Inicio → deslizar → sin sesión → Login
Inicio → deslizar → sesión válida → huella correcta
       → pantalla de carga con barra animada durante 1,5 segundos → Dashboard
Inicio → deslizar → huella cancelada o incorrecta → Inicio
```

La pantalla de carga aparece solo después de validar la huella. El logo completo
queda fijo mientras la barra inferior verde brillante avanza. La fila sobre la
barra muestra el porcentaje y cambia entre «Acceso confirmado», «Preparando tu
inicio…» y «Abriendo AHRE…». La pista y el porcentaje respetan los temas claro
y oscuro. Al completar los 1,5 segundos de progreso, se abre el Dashboard.

La autenticación usa `expo-local-authentication`, ya presente entre las
dependencias del proyecto. No cambia ni crea la sesión: verifica a la persona
antes de abrir la ruta principal. La sesión local sigue conteniendo solo el
identificador del usuario.

## Arranque y errores de base de datos

`App.tsx` mantiene la pantalla nativa de carga mientras inicializa SQLite. Al
terminar, monta Inicio con el deslizador habilitado; no muestra un texto de
preparación antes de «Desliza para iniciar». Si falla la inicialización, oculta
la pantalla nativa para presentar un error persistente con la acción
«Reintentar». Durante un reintento se muestra un indicador de actividad.

Un fallo de sesión o de autenticación biométrica ocurre después del gesto y se
comunica con el componente toast compartido. El usuario puede volver a
deslizar. Los avisos no incluyen SQL, credenciales ni detalles internos.

## Navegación y regreso

La ruta inicial del Stack es Inicio en cada arranque. Al no existir una sesión,
el gesto reemplaza Inicio por Login; una sesión válida requiere biometría antes
de reemplazar Inicio por `Principal` (Dashboard). Inicio no queda en el
historial de navegación tras completar cualquiera de esos destinos.

El registro sigue regresando a Login y el Login exitoso sigue abriendo el
Dashboard según el flujo de autenticación local existente. La conexión del
botón Cerrar sesión de Perfil pertenece a otro issue.

## Datos temporales para Expo Go

Por indicación del usuario se agregó un acceso temporal en Inicio, solo para
desarrollo con Expo Go. `DevelopmentDataButton.tsx` llama a
`src/development/seedDevelopmentData.ts`, protegido por `__DEV__`, y abre el
Dashboard cuando termina. No se modificaron perfiles EAS, configuración nativa
ni preparación de APK. El acceso no solicita huella porque inicia sesión con
las credenciales ficticias de una cuenta de pruebas separada.

La cuenta local usa correo `pruebas@ahre.test` y contraseña pública de pruebas
`AhrePruebas2026!`. Se crea mediante el registro normal y se autentica mediante
el Login local, sin guardar una contraseña en texto plano en SQLite. Si el correo
ya existe con otra contraseña o está desactivado, no se modifica esa cuenta.

| Depósito ficticio | Saldo inicial | Saldo tras los movimientos de ejemplo |
| --- | ---: | ---: |
| Efectivo de prueba | $120.000 | $106.800 |
| Banco de prueba | $350.000 | $650.000 |
| Billetera de prueba | $80.000 | $116.000 |

Los seis movimientos representan sueldo, trabajo independiente, comida,
transporte, farmacia y suscripción. Se fechan dentro de los últimos seis días;
los depósitos se crean con una fecha anterior para que sus movimientos afecten
el saldo según las reglas financieras existentes. Se reutilizan los repositorios
de depósitos y movimientos dentro de una misma transacción.

La misma transacción prepara tres contactos (Ana García, Bruno Pérez y Carla
López) y la sala abierta **Encuentro de prueba**, con cuatro personas contando
a «Vos». Incluye cena ($12.000), taxi ($6.000), compras con reparto manual
($10.000) y café ($1.500). Hay pagos propios y de terceros, partes ya pagadas
y pendientes. Las asociaciones a depósitos se guardan como borradores: los
seis movimientos de ejemplo y el saldo total de $872.800 no cambian hasta
confirmar el cierre o registrar pagos.

También se prepara una deuda manual de $1.800 por una entrada adelantada por
Ana, que permite probar pagos parciales y completos sin cerrar la sala. El cierre
de la sala confirma seis movimientos nuevos y deja $9.500 por cobrar y $3.800
por pagar, incluida esa deuda manual, si no se modificaron los ejemplos.

Cada ejemplo tiene un identificador estable asociado a la cuenta de pruebas.
Volver a pulsar no duplica registros, no restaura nombres o saldos cambiados,
no reactiva depósitos ni vuelve a insertar movimientos anulados. Tampoco
restablece personas, gastos, deudas ni una sala ya cerrada. Las pulsaciones
simultáneas comparten una sola preparación. Si falla cualquier parte de la carga, se
revierte completa y se puede reintentar; la cuenta creada previamente puede
permanecer vacía hasta completar el reintento.

No se agregan ejemplos a la cuenta habitual ni se borran datos. El botón cambia
a la cuenta de pruebas y la sesión no queda recordada en SecureStore; para volver
a otra cuenta se usa el cierre de sesión y el Login normal. Este acceso no carga
personas, salas ni deudas: Social comienza vacío y conserva los registros reales
que se creen durante las pruebas.

Para retirar el acceso temporal se eliminan el botón de HomeScreen.tsx, su estado
de bloqueo del deslizador, el componente, su archivo de estilos, src/development/
y tests/developmentData.test.ts. No requiere cambios de esquema. Las pruebas
automatizadas verifican la carga con autenticación y repositorios reales,
reentrada, aislamiento, rollback y bloqueo fuera de desarrollo.

## Verificación manual en Expo Go

1. Abrir AHRE con y sin sesión y confirmar que ambas veces permanece en Inicio
   hasta completar el deslizador. Con una sesión recordada y una apariencia
   distinta a la del dispositivo, confirmar que Inicio ya aparece con la
   apariencia guardada antes de deslizar.
2. Sin sesión, deslizar y confirmar que abre Login sin mostrar el diálogo de
   biometría.
3. Con una sesión válida y huella configurada, deslizar, confirmar la huella y
   observar la carga animada durante 1,5 segundos antes del Dashboard, sin un
   cambio de apariencia después de validar la sesión.
4. Cancelar o fallar la huella y confirmar que no se abre el Dashboard y el
   deslizador queda disponible para reintentar.
5. Con una sesión válida pero sin biometría configurada, confirmar que se ofrece
   Login con contraseña.
6. Probar una referencia local obsoleta y confirmar que se limpia y se abre
   Login, sin alterar depósitos ni movimientos.
7. Repetir en modo avión y comprobar el reintento ante errores locales.
