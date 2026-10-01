# Estructura base de la aplicación AHRE

## Alcance

Esta estructura organiza AHRE, una aplicación móvil desarrollada con Expo y
React Native utilizando JavaScript. Login y Registro implementan autenticación
local y persistencia de sesión. Los flujos completos de finanzas, OCR,
sincronización y colaboración todavía no están implementados.

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
│   │   ├── base-datos-local.md
│   │   └── implementacion.md
│   ├── configuracion/
│   │   └── dependencias.md
│   ├── interfaces/
│   │   ├── autenticacion.md
│   │   └── sistema-visual.md
│   ├── funcionalidades/
│   │   ├── autenticacion-local.md
│   │   ├── depositos.md
│   │   └── notificaciones-toast.md
│   └── proceso/
│       └── flujo-issues-prs-changelog.md
├── src/
│   ├── authentication/
│   │   ├── authenticationService.js
│   │   ├── errors.js
│   │   ├── passwordSecurity.js
│   │   └── sessionService.js
│   ├── components/
│   │   ├── AuthContainer.js
│   │   ├── AuthInput.js
│   │   ├── ErrorMessage.js
│   │   ├── MainHeader.js
│   │   ├── PasswordInput.js
│   │   ├── PrimaryButton.js
│   │   ├── SectionHeader.js
│   │   └── ToastNotification.js
│   ├── constants/
│   │   ├── deposits.js
│   │   └── routes.js
│   ├── contexts/
│   │   ├── AppearanceContext.js
│   │   └── ToastContext.js
│   ├── deposits/
│   │   └── depositService.js
│   ├── database/
│   │   ├── index.js
│   │   ├── connectionQueue.js
│   │   ├── errors.js
│   │   ├── identifiers.js
│   │   ├── initialization.js
│   │   ├── storageAdapter.js
│   │   ├── transactions.js
│   │   ├── migrations/
│   │   │   └── 001_initialSchema.js
│   │   └── repositories/
│   │       ├── authenticationRepository.js
│   │       ├── categoriesRepository.js
│   │       ├── depositsRepository.js
│   │       ├── debtPaymentsRepository.js
│   │       ├── debtsRepository.js
│   │       ├── movementsRepository.js
│   │       ├── peopleRepository.js
│   │       ├── preferencesRepository.js
│   │       ├── recurrencesRepository.js
│   │       ├── repositoryFactory.js
│   │       ├── sharedExpenseParticipantsRepository.js
│   │       ├── sharedExpensesRepository.js
│   │       ├── transfersRepository.js
│   │       ├── usersRepository.js
│   │       └── index.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   └── BottomTabBar.js
│   ├── screens/
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
│   │   ├── HomeScreenStyles.js
│   │   ├── authStyles.js
│   │   ├── colors.js
│   │   ├── globalStyles.js
│   │   └── toastNotificationStyles.js
│   └── utils/
│       ├── depositValidation.js
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
`MainHeader.js` define el encabezado de las secciones principales, con el logo
de AHRE, título, descripción y accesos a notificaciones y perfil.
`SectionHeader.js` define el encabezado reutilizable de las pantallas
secundarias, con el título junto a la flecha de regreso y una descripción
alineada a la izquierda y centrada verticalmente debajo.
`ToastNotification.js` dibuja avisos superiores con una barra de tiempo, cierre
manual y gesto horizontal. El estado compartido entre pantallas vive en
`src/contexts/ToastContext.js`. Las pantallas usan `mostrarAviso` para errores
generales, confirmaciones y avisos breves; las validaciones específicas siguen
junto al campo. El uso y los tipos disponibles están documentados en
[`docs/funcionalidades/notificaciones-toast.md`](../funcionalidades/notificaciones-toast.md).

### `src/navigation/`

Contiene la composición de rutas y navegadores. `AppNavigator.js` combina un
`Native Stack` para el flujo de acceso y las pantallas secundarias con un
`Bottom Tab Navigator` para Inicio, Movimientos, Nuevo, Estadísticas y Social.
También determina si la ruta raíz muestra las pestañas y dibuja el fondo
correspondiente detrás de los controles inferiores del sistema. Esa decisión
solo modifica la presentación.

### `src/database/`

Contiene la inicialización de SQLite, las migraciones, la serialización de
operaciones, el manejo de errores y los repositorios de cada entidad.
`expo-sqlite` es el almacenamiento principal de datos relacionados. Las
pantallas no ejecutan SQL directamente. `storageAdapter.js` conserva un
contrato auxiliar de clave-valor y no reemplaza la base relacional.

### `src/authentication/`

Contiene el servicio de registro y login locales, la protección y verificación
de contraseñas y el ciclo de vida de la sesión. Se comunica con el repositorio
de autenticación para SQLite y con SecureStore únicamente para recordar el
identificador de sesión.

### `src/services/`

Contiene integraciones que requieran conexión o infraestructura externa, como
sincronización, autenticación remota, OCR en línea o importaciones. Las
funciones esenciales deben poder utilizarse sin esta capa.

### `src/deposits/`

Contiene la lógica de dominio de depósitos, como comprobar la sesión local,
aplicar sus reglas de validación, construir la descripción automática y llamar
al repositorio de SQLite. Las pantallas no realizan operaciones SQL.

### `src/utils/`

Contiene funciones auxiliares puras que no dependen de una pantalla, como
formateo de montos, fechas, validaciones y cálculos.
`structureSmokeTest.js` es una prueba de humo mínima que confirma que las rutas
base pueden importarse juntas.

### `src/constants/`

Contiene valores estáticos compartidos, como nombres de rutas, tipos de
movimientos y categorías predeterminadas. Las constantes compartidas utilizan
nombres en mayúsculas.
`deposits.js` centraliza los tipos e íconos permitidos para crear depósitos.

### `src/contexts/`

Contiene el estado compartido entre pantallas que debe vivir durante la sesión.
`AppearanceContext.js` coordina la preferencia de apariencia, usa el tema del
dispositivo en modo del sistema y ofrece los temas claro u oscuro elegidos en el
Perfil. La preferencia no se guarda y vuelve al modo del sistema al reiniciar AHRE.
`ToastContext.js` conserva el aviso actual mientras cambian las rutas y lo
presenta por encima del contenido de la aplicación. El proveedor también envuelve
la navegación desde `App.js`, así las pantallas usan el mismo `ContextoAvisos`
sin duplicar componentes de aviso.

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
- Antes de mostrar la navegación, `App.js` inicializa la base local y deja Inicio
  como ruta de entrada. El splash se mantiene visible durante la preparación;
  recuperar la sesión automáticamente queda para otro Issue.
- Una pantalla mínima verifica la cadena `App → navegación → pantalla →
  componente`.
- La navegación base está implementada con las dependencias de React
  Navigation ya instaladas. La creación de depósitos ya utiliza la lógica de
  dominio y el repositorio local; otras pantallas financieras siguen el alcance
  de sus respectivos Issues.
- No se crean carpetas vacías para funcionalidades futuras. Las nuevas áreas se
  incorporarán cuando tengan pantallas, componentes o lógica real.
- `structureSmokeTest.js` contiene una función auxiliar que comprueba que las
  rutas base estén definidas. Actualmente no está conectada a una pantalla; cuando
  se incorpore un test runner, esta comprobación deberá trasladarse a pruebas
  automatizadas.
