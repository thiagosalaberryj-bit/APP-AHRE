# Lógica de inicio de AHRE

## Alcance

Al abrir AHRE, la aplicación prepara SQLite y deja visible la pantalla
existente de Inicio. No consulta la sesión durante el arranque ni decide por sí
sola si debe abrir Login o el Dashboard. La decisión se toma cuando la persona
completa el deslizador.

```text
abrir AHRE
→ inicializar SQLite
→ permanecer en Inicio
→ deslizar para iniciar
→ consultar la sesión local
```

La funcionalidad es local y funciona sin conexión. La carga posterior a la
huella es una pantalla completa dentro de la ruta existente de Inicio; no agrega
una ruta nueva. La pantalla de carga muestra el logo completo y no agrega un
texto fijo en el centro.

## Comprobación al deslizar

`src/screens/HomeScreen.js` llama a `obtenerSesionActual()` al terminar el
deslizamiento. El servicio recupera el identificador desde la memoria o
`expo-secure-store` y confirma en SQLite que corresponda a un usuario activo.

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

`App.js` mantiene la pantalla nativa de carga mientras inicializa SQLite. Al
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

## Verificación manual en Expo Go

1. Abrir AHRE con y sin sesión y confirmar que ambas veces permanece en Inicio
   hasta completar el deslizador.
2. Sin sesión, deslizar y confirmar que abre Login sin mostrar el diálogo de
   biometría.
3. Con una sesión válida y huella configurada, deslizar, confirmar la huella y
   observar la carga animada durante 1,5 segundos antes del Dashboard.
4. Cancelar o fallar la huella y confirmar que no se abre el Dashboard y el
   deslizador queda disponible para reintentar.
5. Con una sesión válida pero sin biometría configurada, confirmar que se ofrece
   Login con contraseña.
6. Probar una referencia local obsoleta y confirmar que se limpia y se abre
   Login, sin alterar depósitos ni movimientos.
7. Repetir en modo avión y comprobar el reintento ante errores locales.
