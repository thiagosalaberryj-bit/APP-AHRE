# Navegación de AHRE

## Objetivo

Este documento define las rutas y los navegadores base de AHRE. Login y Registro
tienen maquetación visual y navegación entre ambas. Todavía no contienen
autenticación real, consultas a SQLite ni lógica financiera.

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
debajo. Como las pantallas secundarias se apilan fuera del navegador de
pestañas, tampoco muestran la barra inferior.

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
└── Social
```

## Flujo visual de autenticación

La autenticación todavía no es real. Login y Registro preparan el recorrido
visual y sus estados. «Iniciar sesión» abre Dashboard para probar la navegación;
«Registrarse» vuelve a Login. Estos botones no procesan datos ni crean una
sesión.

```text
Inicio → Login → Dashboard
Login → Registro → Login
```

La validación de sesión y el cierre de sesión se implementarán posteriormente.

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

`App.js` establece el fondo nativo inicial con el color de fondo del tema y
ajusta en Android el color de los controles del sistema según el modo claro u
oscuro: pide controles claros para el tema oscuro y controles oscuros para el
tema claro. `app.json` activa el estilo de interfaz automático y configura
`expo-navigation-bar` con `enforceContrast: false` para que el sistema no cubra
con un velo propio el contenido dibujado por AHRE.

`AppNavigator.js` observa los cambios de ruta del `NavigationContainer`. Cuando
la ruta superior es `PRINCIPAL`, dibuja una capa visual no interactiva en el
inset inferior de Android con `tema.superficie`, a juego con la barra de
pestañas. En Inicio, Login, Registro y las rutas secundarias usa `tema.fondo`.
`BottomTabBar.js` prolonga su superficie por el inset y deja visible el fondo
de pantalla en las esquinas superiores redondeadas.

Esta capa solo resuelve presentación y áreas seguras; no modifica el flujo de
navegación ni implementa lógica de autenticación. `enforceContrast` forma parte
de la configuración nativa de Expo: si cambia, hace falta regenerar o
reconstruir la app Android para aplicarlo a una instalación existente.

## Límites actuales

En este Issue no se implementan:

- diseño final de las pantallas;
- autenticación o registro reales;
- consultas a la base de datos;
- creación de movimientos o depósitos;
- gráficos, filtros o estadísticas;
- cámara o reconocimiento OCR;
- notificaciones reales;
- lógica del módulo Social.
