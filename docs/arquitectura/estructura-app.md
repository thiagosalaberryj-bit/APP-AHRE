# Estructura base de la aplicación AHRE

## Alcance

Esta estructura organiza AHRE, una aplicación móvil desarrollada con Expo y
React Native utilizando TypeScript. Login y Registro implementan autenticación
remota para la primera autorización y persistencia de sesión. Los movimientos
y depósitos usan SQLite local;
el OCR Android reconoce comprobantes y permite confirmar egresos mediante el
servicio existente. La sincronización envía lotes ordenados al backend MySQL,
que recalcula saldos y valida las operaciones financieras y de Social antes de
confirmarlas. La instalación autorizada conserva su funcionamiento offline;
Social continúa trabajando con personas y salas de la cuenta, sin colaboración
web entre cuentas en esta etapa.

El informe del proyecto define AHRE como una aplicación orientada inicialmente
a Android y con un enfoque offline-first. Por eso la información local es el
núcleo de la aplicación y los servicios conectados son extensiones opcionales.

## Mapa de carpetas principales

Selección representativa; el árbol incluye las piezas de referencia y no enumera
cada pantalla, prueba ni componente. Los módulos especializados se describen debajo.

```text
APP-AHRE/
├── App.tsx
├── index.ts
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
│   │   ├── dashboard.md
│   │   ├── inicio.md
│   │   ├── perfil.md
│   │   └── notificaciones-toast.md
│   └── proceso/
│       └── flujo-issues-prs-changelog.md
├── src/
│   ├── authentication/
│   │   ├── authenticationService.ts
│   │   ├── errors.ts
│   │   ├── passwordSecurity.ts
│   │   └── sessionService.ts
│   ├── components/
│   │   ├── AuthContainer.tsx
│   │   ├── AuthInput.tsx
│   │   ├── MainHeader.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── SectionHeader.tsx
│   │   └── ToastNotification.tsx
│   ├── constants/
│   │   ├── deposits.ts
│   │   └── routes.ts
│   ├── contexts/
│   │   ├── AppearanceContext.tsx
│   │   └── ToastContext.tsx
│   ├── deposits/
│   │   └── depositService.ts
│   ├── profile/
│   │   └── profileService.ts
│   ├── database/
│   │   ├── index.ts
│   │   ├── connectionQueue.ts
│   │   ├── errors.ts
│   │   ├── identifiers.ts
│   │   ├── initialization.ts
│   │   ├── storageAdapter.ts
│   │   ├── transactions.ts
│   │   ├── migrations/
│   │   │   └── 001_initialSchema.ts
│   │   └── repositories/
│   │       ├── authenticationRepository.ts
│   │       ├── categoriesRepository.ts
│   │       ├── depositsRepository.ts
│   │       ├── roomsRepository.ts
│   │       ├── roomPeopleRepository.ts
│   │       ├── socialPaymentsRepository.ts
│   │       ├── debtsRepository.ts
│   │       ├── movementsRepository.ts
│   │       ├── peopleRepository.ts
│   │       ├── preferencesRepository.ts
│   │       ├── recurrencesRepository.ts
│   │       ├── repositoryFactory.ts
│   │       ├── sharedExpenseParticipantsRepository.ts
│   │       ├── sharedExpensesRepository.ts
│   │       ├── transfersRepository.ts
│   │       ├── usersRepository.ts
│   │       └── index.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── BottomTabBar.tsx
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── DepositScreen.tsx
│   │   ├── DepositDetailScreen.tsx
│   │   ├── ExpenseScreen.tsx
│   │   ├── StatisticsScreen.tsx
│   │   ├── IncomeScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── MovementsScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── CreateScreen.tsx
│   │   ├── OcrScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── RegistrationScreen.tsx
│   │   └── SocialScreen.tsx
│   ├── styles/
│   │   ├── HomeScreenStyles.ts
│   │   ├── authStyles.ts
│   │   ├── colors.ts
│   │   ├── globalStyles.ts
│   │   └── toastNotificationStyles.ts
│   └── utils/
│       └── depositValidation.ts
├── package.json
└── package-lock.json
```

Los archivos de entrada y configuración de Expo (`App.tsx`, `index.ts`,
`app.json` y `assets/`) se mantienen en sus ubicaciones originales. La
configuración de Expo no se duplica dentro de `src/`; `app.json` continúa siendo
su única fuente de configuración.

## Responsabilidades

### `src/screens/`

Contiene las pantallas completas. Los archivos de pantalla utilizan PascalCase
y el sufijo `Screen`, por ejemplo `DashboardScreen.tsx` o
`MovementsScreen.tsx`. Las pantallas coordinan la vista, pero delegan la lógica
reutilizable a componentes, módulos de base de datos, servicios y utilidades.

Las áreas actuales de AHRE se implementan aquí: Inicio, Login y registro,
Dashboard, Notificaciones, Movimientos, Perfil, Estadísticas, Depósitos,
Ingresos, Egresos, OCR y Social.

Social tiene pantallas independientes para panel, salas, personas, deudas,
ítems y registros. Componen módulos de `src/components/social/`, con estilos
propios en `src/styles/social/` y reglas compartidas en `SharedStyles.ts`.
Los formularios comparten `SocialFormActions.tsx` para validación, guardado y
confirmación, `SocialMovementModal.tsx` para elegir depósito o vincular un
movimiento, y `SocialRecordUnavailable.tsx` para registros no disponibles.
`src/social/` contiene servicios por responsabilidad, consultas, validaciones,
constantes y contexto. `useSocialScreen.ts` recarga por foco; el marco
`SocialScreenFrame.tsx` comparte encabezado, teclado, desplazamiento y proveedor
de datos. Las vistas normales consultan SQLite; `src/development/` prepara ejemplos
sintéticos únicamente mediante el acceso de desarrollo.
El reconocimiento se comparte con el OCR general mediante OcrScreen y su parser.
`RoomExpenseCard.tsx` dibuja las tarjetas compactas de Gastos con los estilos
comunes de Balances. `SocialAmountSummary.tsx` comparte los contenedores de
importe entre panel, resumen de sala, Balances y confirmación de cierre;
su estilo común vive en `SharedStyles.ts`.
`DebtActions.tsx` comparte los botones de pago y eliminación entre tarjetas y
detalle. `SocialRelatedLink.tsx` dibuja los accesos externos a persona y sala,
reutilizando los estilos secundarios existentes.
Ver [organización de Social](../interfaces/social.md#organización-del-código).

### `src/components/`

Contiene componentes visuales reutilizables entre dos o más pantallas. Los
componentes utilizan PascalCase y un nombre relacionado con su responsabilidad,
como `MoneyInput.tsx` o `MovementCard.tsx`. Login y Registro reutilizan
`ContenedorAutenticacion` (`AuthContainer.tsx`), `CampoAutenticacion`
(`AuthInput.tsx`), `CampoContrasena` (`PasswordInput.tsx`), `BotonPrincipal`
(`PrimaryButton.tsx`); sus estilos de
distribución están en `src/styles/authStyles.ts`.
`MainHeader.tsx` define el encabezado de las secciones principales, con el logo
de AHRE, título, descripción y accesos a notificaciones y perfil.
`SectionHeader.tsx` define el encabezado reutilizable de las pantallas
secundarias, con el título junto a la flecha de regreso y una descripción
alineada a la izquierda y centrada verticalmente debajo.
`ToastNotification.tsx` dibuja avisos superiores con una barra de tiempo, cierre
manual y gesto horizontal. El estado compartido entre pantallas vive en
`src/contexts/ToastContext.tsx`. Las pantallas usan `mostrarAviso` para errores
generales, confirmaciones y avisos breves; las validaciones específicas siguen
junto al campo. El uso y los tipos disponibles están documentados en
[`docs/funcionalidades/notificaciones-toast.md`](../funcionalidades/notificaciones-toast.md).

### `src/navigation/`

Contiene la composición de rutas y navegadores. `AppNavigator.tsx` combina un
`Native Stack` para el flujo de acceso y las pantallas secundarias con un
`Bottom Tab Navigator` para Inicio, Movimientos, Nuevo, Estadísticas y Social.
También determina si la ruta raíz muestra las pestañas y dibuja el fondo
correspondiente detrás de los controles inferiores del sistema. Esa decisión
solo modifica la presentación.

### `src/database/`

El esquema inicial reúne las entidades financieras y sociales en
`migrations/001_initialSchema.ts`, sin agregar una migración de transición.
Sus restricciones y repositorios están en [Social en SQLite](../base-de-datos/social.md).
`socialMovementReversal.ts` coordina la reversión de movimientos vinculados con
el pago y la deuda social en la misma transacción financiera.

Contiene la inicialización de SQLite, las migraciones, la serialización de
operaciones, el manejo de errores y los repositorios de cada entidad.
`expo-sqlite` es el almacenamiento principal de datos relacionados. Las
pantallas no ejecutan SQL directamente. `storageAdapter.ts` conserva un
contrato auxiliar de clave-valor y no reemplaza la base relacional.

### `src/authentication/`

Contiene el servicio de registro y login locales, la protección y verificación
de contraseñas y el ciclo de vida de la sesión. Se comunica con el repositorio
de autenticación para SQLite y con SecureStore para recordar el identificador
de sesión y guardar por usuario la preferencia de visibilidad de saldos.

### `src/ocr/` y `modules/receipt-ocr/`

`src/ocr/` coordina el reconocimiento local con ML Kit, interpreta texto y
posiciones, prepara un borrador editable y presenta la revisión del egreso
dentro de la pantalla OCR existente. La confirmación reutiliza el servicio
normal de movimientos; no mantiene repositorios financieros propios.
`modules/receipt-ocr/` es el adaptador Expo local Android, escrito en Kotlin para
invocar el SDK nativo. El modelo latino está incluido para operar sin descargarlo
al primer uso; esta funcionalidad utiliza el módulo nativo local.

### `src/deposits/`

Contiene la lógica de dominio de depósitos, como comprobar la sesión local,
aplicar sus reglas de validación, construir la descripción automática y llamar
al repositorio de SQLite. Las pantallas no realizan operaciones SQL.

### `src/profile/`

Contiene la lógica de dominio del perfil y sus preferencias locales. El servicio
consulta y actualiza el usuario, valida el correo único, guarda idioma,
notificaciones y apariencia, y verifica la contraseña antes de editar el
perfil. Las pantallas no ejecutan SQL.

### `src/utils/`

Contiene funciones auxiliares puras que no dependen de una pantalla, como
formateo de montos, fechas, validaciones y cálculos.
Las verificaciones automatizadas se ejecutan desde `tests/` con `npm test`.

### `src/constants/`

Contiene valores estáticos compartidos, como nombres de rutas, tipos de
movimientos y categorías predeterminadas. Las constantes compartidas utilizan
nombres en mayúsculas.
`deposits.ts` centraliza los tipos e íconos permitidos para crear depósitos.

### `src/contexts/`

Contiene el estado compartido entre pantallas que debe vivir durante la sesión.
`AppearanceContext.tsx` coordina la preferencia de apariencia, usa el tema del
dispositivo en modo del sistema y ofrece los temas claro u oscuro elegidos en el
Perfil. La preferencia se guarda en SQLite y, si SecureStore conserva el
identificador recordado, se carga antes de mostrar Inicio sin validar la sesión.
El deslizador sigue siendo quien valida la sesión; al cerrar sesión se vuelve
temporalmente al modo del sistema.
`ToastContext.tsx` conserva el aviso actual mientras cambian las rutas y lo
presenta por encima del contenido de la aplicación. El proveedor también envuelve
la navegación desde `App.tsx`, así las pantallas usan el mismo `ContextoAvisos`
sin duplicar componentes de aviso.

### `src/styles/`

Contiene los estilos globales y tokens visuales reutilizables de React Native.
`colors.ts` define la paleta y los temas claro/oscuro, mientras que
`globalStyles.ts` concentra el `StyleSheet`, el espaciado, la tipografía y los
bordes. `authStyles.ts` define layouts y detalles de autenticación basados en
el tema global; `HomeScreenStyles.ts` contiene estilos propios de la pantalla
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

## TypeScript

La configuración hereda `expo/tsconfig.base`, no admite fuentes JavaScript
y comprueba la app separada de las herramientas Node. Ambas usan `strict: true`;
incluyen contratos de SQLite, servicios, navegación, formularios, componentes,
apariencia, avisos, OCR y adaptadores de pruebas.
Ver [configuración y verificación](../configuracion/typescript.md).

## Convenciones

- TypeScript: usa `.ts` para lógica, `.tsx` cuando haya JSX y `.cts` para plugins CommonJS de Expo. El módulo Android conserva Kotlin.
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

- `App.tsx` continúa siendo el archivo raíz de composición y `index.ts` continúa
  siendo el punto de registro de Expo.
- `App.tsx` muestra Inicio mientras prepara SQLite y la mantiene como ruta
  inicial. El deslizador consulta la sesión: sin sesión reemplaza Inicio por
  Login; con sesión válida solicita biometría y luego abre el Dashboard. Inicio
  no queda en el historial después de ese destino.
- Una pantalla mínima verifica la cadena `App → navegación → pantalla →
  componente`.
- La navegación usa React Navigation. Depósitos, movimientos, perfil y Social
  utilizan servicios y repositorios locales; la autenticación y la
  sincronización se comunican con el backend según su autorización.
- No se crean carpetas vacías para funcionalidades futuras. Las nuevas áreas se
  incorporarán cuando tengan pantallas, componentes o lógica real.


### Sincronización y desarrollo

`src/sync/` separa transporte (`remote.ts`), autorización (`deviceAuthorization.ts`),
diario (`journal.ts`), consultas de pendientes (`pendingService.ts`), programación
(`syncScheduler.ts`) y consumo de lotes (`syncService.ts`). El esquema auxiliar
se prepara en `001_initialSchema.ts`; no se duplica en las pantallas.
`src/development/` contiene la preparación explícita de datos sintéticos.

El [índice general](../README.md) enlaza las guías de entorno,
publicación y validación actual.
