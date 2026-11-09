# Navegación de AHRE

## Objetivo

Este documento define las rutas y los navegadores de AHRE. Login y Registro
implementan la autorización inicial con conexión y el acceso offline posterior
en una instalación previamente autorizada. Al abrir AHRE,
`App.tsx` prepara SQLite y monta la navegación con Inicio como ruta inicial. La
sesión se consulta cuando la persona completa el deslizador.

Cuando la sincronización detecta que otra instalación reemplazó a la actual,
el controlador sin interfaz de `SyncStatus` notifica a `App.tsx`, que vuelve a
montar el navegador en Login.
La autorización revocada persiste en SQLite y bloquea las escrituras de esa
cuenta. Los pendientes no se borran. Login muestra la confirmación de cambio
de instalación; Perfil ofrece sincronizar y desvincular antes de trasladarla.

`MainHeader` y `SectionHeader` incorporan el icono de conexión, su estado y el
contador compacto de registros pendientes. El icono abre la ruta secundaria
`Sincronizacion` (`SyncScreen.tsx`), que reutiliza `SectionHeader` y
`NotificationCard` para consultar pendientes locales paginados. Su propio
encabezado no repite el acceso a la misma ruta. El controlador global no ocupa
espacio en el diseño y las consultas en reposo no activan el indicador de carga.
## Navegadores utilizados

- `Native Stack`: controla el inicio, login, registro y las pantallas
  secundarias.
- `Bottom Tabs`: permite cambiar entre las áreas principales de AHRE.

La barra inferior se implementa en `src/navigation/BottomTabBar.tsx`. Utiliza la
paleta global, muestra íconos, identifica la pestaña activa y reserva el área
segura inferior del dispositivo. El botón central «Nuevo» usa una sombra
neutra y discreta. Solo aparece dentro de las cinco secciones principales
posteriores al dashboard.

Las pantallas de inicio, login y registro no muestran el encabezado verde ni la
barra inferior. El Dashboard, Movimientos, Nuevo, Estadísticas y Social
utilizan `src/components/MainHeader.tsx`, con el logo de AHRE, título,
descripción y accesos a notificaciones y perfil. Las pantallas secundarias
utilizan `src/components/SectionHeader.tsx`, con el título junto a la flecha de
regreso y una descripción alineada a la izquierda y centrada verticalmente
debajo. Ambos encabezados tienen una altura compacta de `120` puntos. Como las
pantallas secundarias se apilan fuera del navegador de pestañas, tampoco
muestran la barra inferior.

`ScreenHeaderFrame.tsx` mantiene los encabezados fuera del contenido vertical
en todas las pantallas que los utilizan, incluido el marco de Social. Al bajar
se pliegan y se muestran dos flechas compactas: alternar el encabezado y volver
al inicio. La barra comparte el color del encabezado y, cuando está plegado,
incluye accesos sin fondos individuales a sincronización, notificaciones y perfil,
con las mismas acciones. Arriba vuelve a mostrarse el encabezado completo y se ocultan los
controles. Se conectan únicamente el scroll principal o la SectionList de
Sincronización mediante `HeaderScrollView.tsx`; modales y carruseles mantienen
sus controles. Este comportamiento no cambia las rutas ni las acciones de los
encabezados. Ver [reglas visuales](../interfaces/sistema-visual.md#encabezados-de-pantalla).

La barra inferior contiene:

```text
Inicio | Movimientos | Nuevo | Estadísticas | Social
```

## Pantallas y archivos

| Pantalla | Archivo | Acceso inicial |
| --- | --- | --- |
| Inicio | `src/screens/HomeScreen.tsx` | Pantalla inicial |
| Login | `src/screens/LoginScreen.tsx` | Inicio |
| Registro | `src/screens/RegistrationScreen.tsx` | Login |
| Dashboard | `src/screens/DashboardScreen.tsx` | Pestaña Inicio |
| Movimientos | `src/screens/MovementsScreen.tsx` | Pestaña Movimientos |
| Nuevo | `src/screens/CreateScreen.tsx` | Pestaña Nuevo |
| Estadísticas | `src/screens/StatisticsScreen.tsx` | Pestaña Estadísticas |
| Detalle de categoría | `src/screens/CategoryDetailScreen.tsx` | Estadísticas |
| Detalle de movimiento | `src/screens/MovementDetailScreen.tsx` | Detalle de categoría |
| Social | `src/screens/SocialScreen.tsx` | Pestaña Social |
| Perfil | `src/screens/ProfileScreen.tsx` | Dashboard |
| Sincronización | `src/screens/SyncScreen.tsx` | Icono de conexión de los encabezados |
| Notificaciones | `src/screens/NotificationsScreen.tsx` | Dashboard |
| Ingreso | `src/screens/IncomeScreen.tsx` | Dashboard o Nuevo |
| Egreso | `src/screens/ExpenseScreen.tsx` | Dashboard o Nuevo |
| Nuevo depósito | `src/screens/DepositScreen.tsx` | Dashboard o Nuevo |
| Detalle de depósito | `src/screens/DepositDetailScreen.tsx` | Dashboard |
| OCR | `src/screens/OcrScreen.tsx` | Dashboard |

## Flujo general

Desde Inicio se accede a Login. Login permite abrir Registro y volver para autenticarse. Tras el acceso, Dashboard permite abrir Perfil, Notificaciones, Ingreso, Egreso, Nuevo depósito, Detalle de depósito y OCR.

Desde Dashboard también se puede acceder a las áreas principales mediante la
barra inferior:

Dashboard reúne Movimientos, Nuevo, Estadísticas y Social. Nuevo ofrece Ingreso, Egreso y Nuevo depósito. Estadísticas permite abrir el detalle de categoría y luego el detalle de movimiento.

Social muestra el resumen y sus acciones arriba, hasta cinco deudas recientes
y después las salas activas. SocialScreen.tsx contiene el panel; las vistas
secundarias tienen archivos de pantalla propios y se registran en el Stack
principal, sin barra inferior. Los adaptadores de socialRoutes.tsx conservan
los nombres de ruta y eligen el destino según sus parámetros:

- `SalaSocial`: sin `salaId` muestra el listado con búsqueda y filtros;
  con identificador muestra Balances, Gastos y Personas de la sala.
- `PersonasSocial`: `todas: true` abre la agenda; sin esa opción abre
  el historial de deudas, disponible aunque haya menos de cinco pendientes.
- `PersonaSocial`: datos, resumen y deudas de la persona seleccionada.
- `RegistroSocial`: formularios y confirmaciones según `tipo`, incluido
  `detalleDeuda` para consultar la deuda elegida desde una tarjeta y `personaSala`
  para abrir `SocialRoomPersonScreen.tsx` con `salaId` y `personaId`. Este destino
  muestra el historial de solicitudes, sus estados y las acciones permitidas para
  esa persona; no expande la lista general ni agrega una ruta de Stack.
- `GastoSocial`: detalle de un ítem y sus pagos, con acceso al formulario
  precargado de edición solo mientras la sala esté abierta.

Al saldar una deuda, RegistroSocial confirma el resultado y navega a Principal
con la pestaña Social seleccionada. Los pagos parciales regresan a la vista
anterior. El detalle de una deuda saldada no ofrece eliminarla.
Eliminar una persona desde su perfil regresa a PersonasSocial con todas: true;
la edición de datos y la reactivación conservan su pantalla actual.

La agenda abre alta y edición de personas en modal. Agregar personas a una
sala, confirmar que se quita una, elegir icono y usar los selectores también
se resuelven en modales. Crear una persona desde un selector abre la ruta de
registro con la agenda y su modal de alta. Atrás vuelve a la vista anterior
sin perder su borrador. Las rutas reciben identificadores y opciones
serializables; el formulario de gasto obtiene los participantes de la sala
desde los datos locales.

Social recarga datos locales al recuperar el foco y navega por identificadores
persistidos. Escanear ticket abre OCR con destino social y salaId; el resultado
regresa a RegistroSocial con modo lista y ticketSocial serializable. Este destino
no guarda un egreso; el OCR iniciado desde el panel mantiene su formulario normal.
Ver [Interfaz de Social](../interfaces/social.md).

El detalle de categoría y el detalle de movimiento se registran en el Stack
principal, fuera del navegador de pestañas. Al abrirlos se oculta la barra
inferior; volver regresa al detalle o a la pestaña de Estadísticas anterior.

## Flujo de inicio y autenticación local

Mientras se prepara SQLite, `App.tsx` mantiene la pantalla nativa de carga.
Cuando la base está lista, Inicio aparece con el deslizador habilitado y queda
como ruta inicial hasta que la persona completa el gesto. Si no hay sesión,
Inicio se reemplaza por Login. Si la sesión es válida, se solicita la huella y,
tras autenticar, Inicio muestra una pantalla de carga con barra de progreso
durante 1,5 segundos antes de reemplazarse por Dashboard. Inicio no queda en la
pila después de cualquiera de esos destinos.

Al arrancar se prepara SQLite y se espera el deslizador de Inicio. Sin sesión se abre Login; con sesión válida se solicita huella y se muestra la carga animada antes de Dashboard. El registro vuelve a Login antes de acceder a Dashboard.

Registro valida, registra y autoriza la cuenta en SERVER-AHRE y crea su copia
local antes de volver a Login. El primer ingreso de una instalación requiere
conexión; los posteriores pueden usar el verificador y la autorización locales
si no hay transporte. Un rechazo remoto de credenciales no habilita ese acceso
alternativo. El ingreso correcto restablece la pila en Dashboard.

Al consultar una sesión guardada después del gesto, el servicio confirma que el
usuario local exista y esté activo. Si la referencia apunta a un usuario
inexistente, se limpia y se abre Login. Si falla el almacenamiento o la
consulta local, se muestra un aviso y el deslizador queda disponible para
reintentar. La huella cancelada o incorrecta no abre el Dashboard. La función
`cerrarSesion()` está conectado al botón de Perfil y limpia la sesión local.
La acción distinta de sincronizar y desvincular confirma pendientes antes de
liberar la instalación remota.

## Depósitos

El detalle de depósito utiliza una única pantalla reutilizable. Dashboard le
envía el identificador del depósito seleccionado; el servicio consulta y
verifica el registro local antes de mostrarlo. No se pasa el registro completo
como estado de navegación.

La pantalla de creación de depósito se accede desde Dashboard o desde la
sección Nuevo.

## Regreso entre pantallas

Las pantallas secundarias utilizan el comportamiento normal del Stack Navigator.
La flecha del encabezado ejecuta `navigation.goBack()` para volver a la pantalla
anterior. Las pestañas principales no necesitan un botón de regreso porque se
cambian directamente desde la barra inferior.

## Controles de navegación del sistema

`App.tsx` establece el fondo nativo con el color de fondo del tema y actualiza el
contraste de los botones del sistema en Android según la apariencia activa.
`app.json` activa `userInterfaceStyle: "automatic"` y configura
`expo-navigation-bar` con `enforceContrast: false`.

`AppNavigator.tsx` observa los cambios de ruta del `NavigationContainer`. Cuando
la ruta superior es `PRINCIPAL`, dibuja una capa visual no interactiva en el
inset inferior de Android con `tema.superficie`, a juego con la barra de
pestañas. En Inicio, Login, Registro y las rutas secundarias usa `tema.fondo`.
`BottomTabBar.tsx` prolonga su superficie por el inset y deja visible el fondo
de pantalla en las esquinas superiores redondeadas.

Esta capa solo resuelve presentación y áreas seguras; no modifica el flujo de
navegación ni implementa lógica de autenticación.

### Contraste de la barra del sistema

La preferencia local de apariencia puede diferir del tema del dispositivo.
`App.tsx` ajusta el color de los botones de navegación de Android junto con el
tema de AHRE; `enforceContrast: false` permite que la aplicación pinte el fondo
de esa zona.

Al revisar esta zona, comprobar Inicio, Login, Registro y pantallas secundarias
con fondo `tema.fondo`, y las cinco pestañas principales con
`tema.superficie`. Revisar también los dos temas y volver de una pantalla
secundaria a una pestaña. En Expo Go, cerrar y volver a abrir la experiencia
después de cambiar `app.json`. Las opciones nativas del plugin requieren una
nueva compilación para aplicarse a una app AHRE ya instalada.

## Límites actuales

La navegación de esta aplicación no implementa por sí sola:

- creación y persistencia de movimientos o depósitos;
- consultas reales para gráficos, filtros o estadísticas;
- notificaciones reales;
- lógica funcional del módulo Social.

El flujo de Inicio sí consulta la sesión local después del deslizador, como se
describe arriba y en [`docs/funcionalidades/inicio.md`](../funcionalidades/inicio.md).
La ruta OCR conserva la pantalla existente y delega el reconocimiento en ML Kit
local y la confirmación del egreso en el servicio de movimientos, sin agregar
otra ruta ni otro mecanismo de persistencia.
