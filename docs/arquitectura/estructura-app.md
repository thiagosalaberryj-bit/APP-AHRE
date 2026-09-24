# Estructura base de la aplicación AHRE

## Alcance

Esta estructura prepara AHRE, una aplicación móvil desarrollada con Expo y
React Native utilizando JavaScript. El objetivo de este Issue es separar las
responsabilidades principales y dejar puntos de extensión para futuras
funcionalidades. Login y Registro ya tienen una maquetación navegable, pero
todavía no implementan autenticación, validación ni persistencia de sesión.
Tampoco están implementados los flujos completos de finanzas, OCR,
sincronización ni colaboración.

El informe del proyecto define AHRE como una aplicación orientada inicialmente
a Android y con un enfoque offline-first. Por eso la información local es el
núcleo de la aplicación y los servicios conectados son extensiones opcionales.

## Árbol actual

```text
APP-AHRE/
├── App.js
├── index.js
├── app.json
├── README.md
├── assets/
│   ├── icon.png
│   ├── ahre-mark.png
│   ├── ahre-logo.png
│   ├── favicon.png
│   ├── splash-icon.png
│   └── android-icon-*.png
├── docs/
│   ├── CHANGELOG.md
│   ├── arquitectura/
│   │   ├── estructura-app.md
│   │   └── navegacion.md
│   ├── base-de-datos/
│   │   └── base-datos-local.md
│   ├── configuracion/
│   │   └── dependencias.md
│   ├── interfaces/
│   │   ├── autenticacion.md
│   │   └── sistema-visual.md
│   └── proceso/
│       └── flujo-issues-prs-changelog.md
├── src/
│   ├── components/
│   │   ├── AuthContainer.js
│   │   ├── AuthInput.js
│   │   ├── CompactHeader.js
│   │   ├── ErrorMessage.js
│   │   ├── MainHeader.js
│   │   ├── PasswordInput.js
│   │   ├── PrimaryButton.js
│   │   └── SectionHeader.js
│   ├── constants/
│   │   └── routes.js
│   ├── database/
│   │   ├── index.js
│   │   └── storageAdapter.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── BottomTabBar.js
│   │   └── StatisticsNavigator.js
│   ├── screens/
│   │   ├── CategoryDetailScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── DepositScreen.js
│   │   ├── DepositDetailScreen.js
│   │   ├── ExpenseScreen.js
│   │   ├── StatisticsScreen.js
│   │   ├── IncomeScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── MovementsScreen.js
│   │   ├── NotificationsScreen.js
│   │   ├── CreateScreen.js
│   │   ├── OcrScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── RegistrationScreen.js
│   │   └── SocialScreen.js
│   ├── services/
│   │   └── index.js
│   ├── styles/
│   │   ├── CompactHeaderStyles.js
│   │   ├── CategoryDetailScreenStyles.js
│   │   ├── HomeScreenStyles.js
│   │   ├── authStyles.js
│   │   ├── StatisticsScreenStyles.js
│   │   ├── colors.js
│   │   └── globalStyles.js
│   └── utils/
│       └── structureSmokeTest.js
├── package.json
└── package-lock.json
```

Los archivos de entrada y configuración de Expo (`App.js`, `index.js`,
`app.json` y `assets/`) se mantienen en sus ubicaciones originales. La
configuración de Expo no se duplica dentro de `src/`; `app.json` continúa siendo
su única fuente de configuración.

## Responsabilidades

### `src/screens/`

Contiene las pantallas completas. Los archivos de pantalla utilizan PascalCase
y el sufijo `Screen`, por ejemplo `DashboardScreen.js` o
`MovementsScreen.js`. Las pantallas coordinan la vista, pero delegan la lógica
reutilizable a componentes, módulos de base de datos, servicios y utilidades.

Las áreas previstas de AHRE podrán incorporarse aquí: Inicio, Login y registro,
Dashboard, Notificaciones, Movimientos, Perfil, Estadísticas, Depósitos,
Ingresos, Egresos, OCR y Social.

### `src/components/`

Contiene componentes visuales reutilizables entre dos o más pantallas. Los
componentes utilizan PascalCase y un nombre relacionado con su responsabilidad,
como `AmountInput.js` o `MovementCard.js`. Muchas pantallas financieras todavía
esperan sus componentes funcionales. Login y Registro reutilizan
`ContenedorAutenticacion` (`AuthContainer.js`), `CampoAutenticacion`
(`AuthInput.js`), `CampoContrasena` (`PasswordInput.js`), `BotonPrincipal`
(`PrimaryButton.js`) y `MensajeError` (`ErrorMessage.js`); sus estilos de
distribución están en `src/styles/authStyles.js`.
`MainHeader.js` define el encabezado del Dashboard y las pestañas principales,
con el logo de AHRE, el título de la sección y accesos a notificaciones y
perfil. `CompactHeader.js` define el encabezado de las pantallas secundarias:
regreso arriba, título abajo y fondo verde con bordes inferiores redondeados.
Inicio, Login y Registro no muestran encabezado de navegación. Perfil conserva
`SectionHeader.js`.

### `src/navigation/`

Contiene la composición de rutas y navegadores. `AppNavigator.js` combina un
`Native Stack` para el flujo de acceso y las pantallas secundarias con un
`Bottom Tab Navigator` para Inicio, Movimientos, Nuevo, Estadísticas y Social.
Estadísticas utiliza además `StatisticsNavigator.js` para apilar el resumen y
el detalle de categoría dentro de la misma pestaña. `AppNavigator.js` determina
si la ruta raíz muestra las pestañas y dibuja el fondo correspondiente detrás
de los controles inferiores del sistema. Esa decisión solo modifica la
presentación.

### `src/database/`

Contiene el acceso al almacenamiento local y sus adaptadores.
`storageAdapter.js` define un contrato independiente de las pantallas que
posteriormente podrá conectarse con AsyncStorage, SQLite u otra alternativa
compatible con Expo. Los repositorios de depósitos, movimientos, categorías,
deudas y pagos deben permanecer en esta capa o en sus subcarpetas.

### `src/services/`

Contiene integraciones que requieran conexión o infraestructura externa, como
sincronización, autenticación remota, OCR en línea o importaciones. Las
funciones esenciales deben poder utilizarse sin esta capa.

### `src/utils/`

Contiene funciones auxiliares puras que no dependen de una pantalla, como
formateo de montos, fechas, validaciones y cálculos.
`structureSmokeTest.js` es una prueba de humo mínima que confirma que las rutas
base pueden importarse juntas.

### `src/constants/`

Contiene valores estáticos compartidos, como nombres de rutas, tipos de
movimientos y categorías predeterminadas. Las constantes compartidas utilizan
nombres en mayúsculas.

### `src/styles/`

Contiene los estilos globales y tokens visuales reutilizables de React Native.
`colors.js` define la paleta y los temas claro/oscuro, mientras que
`globalStyles.js` concentra el `StyleSheet`, el espaciado, la tipografía y los
bordes. `authStyles.js` define layouts y detalles de autenticación basados en
el tema global; `HomeScreenStyles.js` contiene estilos propios de la pantalla
de inicio. No contiene CSS web ni componentes completos.

### `assets/`

Contiene recursos visuales y archivos estáticos utilizados por Expo, como
íconos, imágenes de splash y favicon. Los recursos se mantienen fuera de `src/`
para separarlos del código.

### `docs/`

Contiene la documentación del proyecto. Las decisiones de arquitectura se
guardan en `docs/arquitectura/`, el sistema visual en `docs/interfaces/`, la
configuración técnica en `docs/configuracion/` y los procesos de trabajo en
`docs/proceso/`.

## Convenciones

- Solo JavaScript: todos los archivos de código utilizan `.js`.
- Los archivos fuente y sus rutas usan nombres en inglés.
- Los identificadores propios de AHRE (variables, funciones, componentes y
  propiedades internas) usan nombres en español directamente. Las APIs de
  JavaScript, React Native, Expo y otras librerías conservan sus nombres.
- Las carpetas utilizan nombres en minúscula.
- Las pantallas y los componentes utilizan PascalCase.
- Los hooks, servicios y utilidades utilizan nombres descriptivos en camelCase
  cuando se incorporen.
- Las constantes compartidas utilizan `UPPER_SNAKE_CASE`.
- Las pantallas no deben acceder directamente a implementaciones concretas de
  almacenamiento o red.

## Decisiones y límites del Issue

- `App.js` continúa siendo el archivo raíz de composición y `index.js` continúa
  siendo el punto de registro de Expo.
- Una pantalla mínima verifica la cadena `App → navegación → pantalla →
  componente`.
- La navegación base está implementada con las dependencias de React
  Navigation ya instaladas. La base de datos y los servicios todavía no se
  conectan a las pantallas.
- No se crean carpetas vacías para funcionalidades futuras. Las nuevas áreas se
  incorporarán cuando tengan pantallas, componentes o lógica real.
- `structureSmokeTest.js` contiene una función auxiliar que comprueba que las
  rutas base estén definidas. Actualmente no está conectada a una pantalla; cuando
  se incorpore un test runner, esta comprobación deberá trasladarse a pruebas
  automatizadas.
