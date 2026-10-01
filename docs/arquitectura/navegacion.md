# Navegación de AHRE

## Objetivo

Este documento define las rutas y los navegadores de AHRE. Login y Registro
implementan la autenticación local y el acceso sin conexión. Al abrir AHRE,
`App.js` prepara SQLite y monta la navegación con Inicio como ruta inicial. La
sesión se consulta cuando la persona completa el deslizador.
## Navegadores utilizados

- `Native Stack`: controla el inicio, login, registro y las pantallas
  secundarias.
- `Bottom Tabs`: permite cambiar entre las áreas principales de AHRE.

La barra inferior se implementa en `src/navigation/BottomTabBar.js`. Utiliza la
paleta global, muestra íconos, identifica la pestaña activa y reserva el área
segura inferior del dispositivo. El botón central «Nuevo» usa una sombra
neutra y discreta. Solo aparece dentro de las cinco secciones principales
posteriores al dashboard.

Las pantallas de inicio, login y registro no muestran el encabezado verde ni la
barra inferior. El Dashboard, Movimientos, Nuevo, Estadísticas y Social
utilizan `src/components/MainHeader.js`, con el logo de AHRE, título,
descripción y accesos a notificaciones y perfil. Las pantallas secundarias
utilizan `src/components/SectionHeader.js`, con el título junto a la flecha de
regreso y una descripción alineada a la izquierda y centrada verticalmente
debajo. Ambos encabezados tienen una altura compacta de `120` puntos. Como las
pantallas secundarias se apilan fuera del navegador de pestañas, tampoco
muestran la barra inferior.

La barra inferior contiene:

```text
Inicio | Movimientos | Nuevo | Estadísticas | Social
```

## Pantallas y archivos

| Pantalla | Archivo | Acceso inicial |
| --- | --- | --- |
| Inicio | `src/screens/HomeScreen.js` | Pantalla inicial |
| Login | `src/screens/LoginScreen.js` | Inicio |
| Registro | `src/screens/RegistrationScreen.js` | Login |
| Dashboard | `src/screens/DashboardScreen.js` | Pestaña Inicio |
| Movimientos | `src/screens/MovementsScreen.js` | Pestaña Movimientos |
| Nuevo | `src/screens/CreateScreen.js` | Pestaña Nuevo |
| Estadísticas | `src/screens/StatisticsScreen.js` | Pestaña Estadísticas |
| Detalle de categoría | `src/screens/CategoryDetailScreen.js` | Estadísticas |
| Detalle de movimiento | `src/screens/MovementDetailScreen.js` | Detalle de categoría |
| Social | `src/screens/SocialScreen.js` | Pestaña Social |
| Perfil | `src/screens/ProfileScreen.js` | Dashboard |
| Notificaciones | `src/screens/NotificationsScreen.js` | Dashboard |
| Ingreso | `src/screens/IncomeScreen.js` | Dashboard o Nuevo |
| Egreso | `src/screens/ExpenseScreen.js` | Dashboard o Nuevo |
| Nuevo depósito | `src/screens/DepositScreen.js` | Dashboard o Nuevo |
| Detalle de depósito | `src/screens/DepositDetailScreen.js` | Dashboard |
| OCR | `src/screens/OcrScreen.js` | Dashboard |

## Flujo general

```text
Inicio
└── Login
    ├── Registro
    │   └── volver a Login
    │
    └── Dashboard (después de autenticarse)
        ├── Perfil
        ├── Notificaciones
        ├── Ingreso
        ├── Egreso
        ├── Nuevo depósito
        ├── Detalle de depósito
        └── OCR
```

Desde Dashboard también se puede acceder a las áreas principales mediante la
barra inferior:

```text
Dashboard / Inicio
├── Movimientos
├── Nuevo
│   ├── Ingreso
│   ├── Egreso
│   └── Nuevo depósito
├── Estadísticas
│   └── Detalle de categoría
│       └── Detalle de movimiento
└── Social
```

El detalle de categoría y el detalle de movimiento se registran en el Stack
principal, fuera del navegador de pestañas. Al abrirlos se oculta la barra
inferior; volver regresa al detalle o a la pestaña de Estadísticas anterior.

## Flujo de inicio y autenticación local

Mientras se prepara SQLite, `App.js` mantiene la pantalla nativa de carga.
Cuando la base está lista, Inicio aparece con el deslizador habilitado y queda
como ruta inicial hasta que la persona completa el gesto. Si no hay sesión,
Inicio se reemplaza por Login. Si la sesión es válida, se solicita la huella y,
tras autenticar, Inicio muestra una pantalla de carga con barra de progreso
durante 1,5 segundos antes de reemplazarse por Dashboard. Inicio no queda en la
pila después de cualquiera de esos destinos.

```text
Arranque → Inicio (preparando SQLite)
        → Inicio (espera el deslizador)
        ├── deslizar → sin sesión → Login
        └── deslizar → sesión válida → huella → carga animada → Dashboard

Login → Registro → Login → Dashboard
```

Registro valida los datos y guarda la cuenta local antes de volver a Login.
Login valida la contraseña y, si es correcta, restablece la pila en Dashboard
para que el botón de regreso no muestre Login. Registro y Login no usan
servicios remotos ni requieren conexión.

Al consultar una sesión guardada después del gesto, el servicio confirma que el
usuario local exista y esté activo. Si la referencia apunta a un usuario
inexistente, se limpia y se abre Login. Si falla el almacenamiento o la
consulta local, se muestra un aviso y el deslizador queda disponible para
reintentar. La huella cancelada o incorrecta no abre el Dashboard. La función
`cerrarSesion()` ya está disponible en el servicio; conectar el botón actual de
Perfil queda para una tarea posterior.
## Depósitos

El detalle de depósito utiliza una única pantalla reutilizable. Actualmente se
puede abrir desde Dashboard como ruta de prueba. Más adelante recibirá el
identificador del depósito seleccionado y cargará la información de forma
dinámica.

La pantalla de creación de depósito se accede desde Dashboard o desde la
sección Nuevo.

## Regreso entre pantallas

Las pantallas secundarias utilizan el comportamiento normal del Stack Navigator.
La flecha del encabezado ejecuta `navigation.goBack()` para volver a la pantalla
anterior. Las pestañas principales no necesitan un botón de regreso porque se
cambian directamente desde la barra inferior.

## Controles de navegación del sistema

`App.js` establece el fondo nativo con el color de fondo del tema y actualiza el
contraste de los botones del sistema en Android según la apariencia activa.
`app.json` activa `userInterfaceStyle: "automatic"` y configura
`expo-navigation-bar` con `enforceContrast: false`.

`AppNavigator.js` observa los cambios de ruta del `NavigationContainer`. Cuando
la ruta superior es `PRINCIPAL`, dibuja una capa visual no interactiva en el
inset inferior de Android con `tema.superficie`, a juego con la barra de
pestañas. En Inicio, Login, Registro y las rutas secundarias usa `tema.fondo`.
`BottomTabBar.js` prolonga su superficie por el inset y deja visible el fondo
de pantalla en las esquinas superiores redondeadas.

Esta capa solo resuelve presentación y áreas seguras; no modifica el flujo de
navegación ni implementa lógica de autenticación.

### Contraste de la barra del sistema

La preferencia local de apariencia puede diferir del tema del dispositivo.
`App.js` ajusta el color de los botones de navegación de Android junto con el
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
- reconocimiento OCR de comprobantes;
- notificaciones reales;
- lógica funcional del módulo Social.

El flujo de Inicio sí consulta la sesión local después del deslizador, como se
describe arriba y en [`docs/funcionalidades/inicio.md`](../funcionalidades/inicio.md).
