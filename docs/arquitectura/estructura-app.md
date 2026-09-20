# Estructura base de la aplicación AHRE

## Alcance

Esta estructura prepara AHRE, una aplicación móvil desarrollada con Expo y
React Native utilizando JavaScript. El objetivo de este Issue es separar las
responsabilidades principales y dejar puntos de extensión para futuras
funcionalidades. Todavía no implementa los flujos completos de finanzas,
autenticación, OCR, sincronización ni colaboración.

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
│   ├── favicon.png
│   ├── splash-icon.png
│   └── android-icon-*.png
├── docs/
│   ├── CHANGELOG.md
│   ├── arquitectura/
│   │   └── estructura-app.md
│   ├── configuracion/
│   │   └── dependencias.md
│   └── proceso/
│       └── flujo-issues-prs-changelog.md
├── src/
│   ├── components/
│   │   └── StructureStatus.js
│   ├── constants/
│   │   └── routes.js
│   ├── database/
│   │   ├── index.js
│   │   └── storageAdapter.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── screens/
│   │   └── HomeScreen.js
│   ├── services/
│   │   └── index.js
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
como `AmountInput.js` o `MovementCard.js`. `StructureStatus.js` es el componente
inicial de verificación de la estructura.

### `src/navigation/`

Contiene la composición de rutas y navegadores. `AppNavigator.js` es el punto de
entrada actual y renderiza `HomeScreen`. Cuando existan flujos reales se podrá
incorporar una librería de navegación; este Issue todavía no necesita esa
dependencia.

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

### `assets/`

Contiene recursos visuales y archivos estáticos utilizados por Expo, como
íconos, imágenes de splash y favicon. Los recursos se mantienen fuera de `src/`
para separarlos del código.

### `docs/`

Contiene la documentación del proyecto. Las decisiones de arquitectura se
guardan en `docs/arquitectura/`, la configuración técnica en `docs/configuracion/`
y los procesos de trabajo en `docs/proceso/`.

## Convenciones

- Solo JavaScript: todos los archivos de código utilizan `.js`.
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
- Todavía no se incorpora una librería de navegación, una base de datos
  concreta ni un servicio remoto.
- No se crean carpetas vacías para funcionalidades futuras. Las nuevas áreas se
  incorporarán cuando tengan pantallas, componentes o lógica real.
- `structureSmokeTest.js` se importa desde `HomeScreen.js`. Cuando se incorpore
  un test runner, esta comprobación deberá trasladarse a pruebas automatizadas.
