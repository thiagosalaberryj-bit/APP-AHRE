# TypeScript en AHRE

## Compatibilidad comprobada el 1 de noviembre de 2026

El líder solicitó y autorizó esta migración sin Issue, incluidos los cambios de
dependencias de desarrollo. La rama es `codex/migracion-typescript`.

| Herramienta | Versión | Criterio |
| --- | --- | --- |
| Expo | `57.0.31` | SDK existente, sin actualización. |
| React Native | `0.86.3` | Versión incluida en Expo SDK 57. |
| React | `19.2.3` | Versión incluida en Expo SDK 57. |
| TypeScript | `6.0.3` | La plantilla oficial SDK 57 declara `~6.0.3`; AHRE fija el parche. |
| Tipos de React | `19.2.4` | Expo CLI recomienda `~19.2.4`; cumple el rango `~19.2.2` de la plantilla y el peer `^19.1.1` de React Native. |
| Node de verificación | `24.18.0` | Ejecuta las pruebas TypeScript mediante borrado nativo de tipos. |
| Tipos de Node | `24.19.2` | Línea 24, separada de los tipos de la app móvil. |

Fuentes: [plantilla oficial Expo SDK 57](https://raw.githubusercontent.com/expo/expo/sdk-57/templates/expo-template-blank-typescript/package.json),
[guía TypeScript de Expo](https://docs.expo.dev/guides/typescript/) y
[notas del SDK 57](https://expo.dev/changelog/sdk-57).

Se revisaron las versiones instaladas y sus declaraciones de tipos. React Native,
los módulos Expo, React Navigation 7, date-fns, React Hook Form, los resolvers,
Zod, SVG y las librerías de gestos y animaciones ya incluyen tipos. No se agrega
`@types/react-native` ni paquetes de tipos duplicados para esas librerías.
React utiliza `@types/react`. `@types/node` se limita a herramientas y pruebas.

La versión usada para desarrollar una dependencia no equivale a un requisito
mínimo del consumidor. La selección parte de la plantilla del SDK existente y
se verifica sobre el proyecto. Zod documenta soporte desde TypeScript 5.5 y
requiere modo estricto para su inferencia; actualmente AHRE no importa Zod ni
sus resolvers. [Requisitos de Zod](https://zod.dev/#requirements).

## Fuentes y entradas

- `index.ts` registra `App.tsx` y es el `main` del paquete raíz.
- Los archivos con JSX usan `.tsx`; lógica, estilos, constantes y pruebas usan `.ts`.
- `modules/receipt-ocr/index.ts` define el contrato del módulo Android opcional.
  Su `package.json` apunta a esa entrada. El código nativo continúa en Kotlin.
- `plugins/withCompleteAdaptiveIcon.cts` conserva CommonJS para su ejecución
  por Expo en Node. El resolutor del SDK 57 admite esa extensión.
- `app.json` y los archivos de configuración JSON conservan sus formatos.
- Los imports de Metro siguen sin extensión; las pruebas de Node usan `.ts`
  explícitamente. No se añaden alias ni un transformador Babel personalizado.

## Configuración estricta

`tsconfig.json` hereda `expo/tsconfig.base`: usa JSX de React, resolución
`bundler`, módulos `preserve`, `noEmit` y `skipLibCheck`. Los tipos globales
se limitan a React y React Native. `allowJs: false` excluye fuentes JavaScript.
`tsconfig.tools.json` comprueba pruebas y plugins con los tipos de Node.

`strict: true` se aplica tanto a la app como a las herramientas y pruebas. Incluye
`noImplicitAny`, `strictNullChecks` y las demás comprobaciones estrictas. Los
contratos abarcan las quince tablas SQLite, repositorios genéricos, conexiones,
transacciones, servicios, rutas, formularios, propiedades, estados, referencias,
temas, avisos y OCR. Los adaptadores de pruebas tipan sus módulos y su árbol de
interfaz; los valores dinámicos se verifican antes de usarlos. No se usan
`any` explícitos, `@ts-nocheck` ni `@ts-ignore` para ocultar diagnósticos.

Los registros opcionales y errores externos se comprueban antes de acceder a
sus campos. El JSON de los borradores sociales entra como `unknown` y se valida
antes de convertirse en un plan de pagos. React Navigation recomienda
comprobación estricta de nulos para su inferencia.
[Configuración de tipos de React Navigation](https://reactnavigation.org/docs/typescript/).

Metro transpila TypeScript; `tsc` comprueba tipos por separado. Una exportación
correcta por sí sola no sustituye `npm run typecheck`.

## Cambios incluidos en la migración

La migración se revisa en el [PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65).
Además de las extensiones y la configuración estricta, incluye:

- contratos compartidos en `src/database/types.ts`, `src/navigation/types.ts`,
  `src/social/types.ts` y `src/types/` para evitar copiar estructuras entre
  servicios, pantallas y componentes;
- tipos de consultas SQLite que representan sus columnas reales, incluidos
  los alias del historial y los resultados agregados; la consulta del usuario
  activo incorpora `fecha_actualizacion` y la reversión de transferencias
  consulta el campo `anulado` que comprueba;
- validación de los borradores sociales persistidos antes de convertir el JSON
  en un plan de pagos, con rechazo de estructuras o campos inválidos;
- agrupación de pagos, partes, integrantes y gastos por sus identificadores
  para evitar búsquedas completas repetidas durante la carga de Social;
- ampliación de la cuenta temporal con tres contactos, una sala, cuatro gastos
  y una deuda personal. Los repartos, estados de pago y saldos esperados se
  describen en [datos de prueba de Inicio](../funcionalidades/inicio.md#datos-temporales-para-expo-go).

Se conservan Expo SDK 57 y las versiones de las dependencias de ejecución.
El 1 de noviembre de 2026 se preparó la versión `0.5.0`, con código Android `3`,
sincronizada en Expo, el paquete y el lockfile. El esquema SQLite conserva su
versión; la conversión a TypeScript no requiere una migración de datos.

## Verificación reproducible

```powershell
npm run typecheck
npm test
npx expo install --check
npx expo export --platform android --output-dir dist/typescript-check
```

Las 110 pruebas incluyen las 92 existentes y nuevos casos con los ejemplos sociales,
cierre, pagos parciales, reentrada, fallos transaccionales, un lote de cien
gastos, transferencias y borradores persistidos inválidos. La consulta social
agrupa pagos, partes y gastos una vez por carga, evitando repetir búsquedas
completas por cada registro. Sus adaptadores resuelven `.ts` y
`.tsx`; el compilador TypeScript elimina los tipos antes de ejecutar las fuentes
reales dentro de las VM y genera JSX para el simulador de interfaz. No se
requieren ts-node, tsx ni otro runner. Las pruebas necesitan Node 24 y conservan
`--experimental-vm-modules` para las VM existentes.

La verificación de tipos incluye todo el código propio, pero `skipLibCheck`
omite la revisión interna de declaraciones de terceros, como establece Expo.
Las pruebas de interfaz no verifican layout nativo. La exportación Android no
genera un APK ni comprueba cámara, OCR nativo o interacción en dispositivo.

## Build Android y validación en dispositivo

El 1 de noviembre de 2026 finalizó correctamente la
[build EAS de Android de la migración](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/02dec8dd-ef34-4968-9a5c-66cdec47537c):

| Dato | Valor |
| --- | --- |
| Commit de código probado | `8d106b3736f5dca4f691884b7cb6a03f1e614ed4` |
| Perfil EAS | `ocr-comparison` |
| Distribución y formato | Interna, APK |
| Versión del APK probado | `0.4.0`, código Android `2` |
| Prueba manual | El líder confirmó que probó el APK y funciona. |

Esta confirmación corresponde a una prueba funcional general en dispositivo.
Complementa las 110 pruebas automatizadas, el chequeo estricto y la exportación
con Hermes; no se informó un desglose de escenarios manuales por pantalla.

La versión `0.5.0` con código Android `3` se preparó después de esta build.
La numeración nueva corresponde a la próxima compilación; la build enlazada
conserva la versión y el commit con los que fue probada.

## Línea base de la etapa 1 (2026-11-02)

Esta revisión corresponde a `codex/sincronizacion-servidor`, commit
`b33df80723899408a4b3373e3e4e3d25e4bf228d`, junto con SERVER-AHRE en
`4522f224f8b01ac4a397ddae435abb5795b19e55`. El líder autorizó esta etapa sin
Issue. No modifica las verificaciones históricas de la migración anterior.

El entorno local dispone de Node `24.12.0` y npm `11.6.2`. Los manifiestos
coinciden con sus lockfiles de formato 3. La app mantiene TypeScript `6.0.3`;
el backend mantiene `7.0.2`. No se cambiaron versiones ni archivos de paquetes.

### Estado inicial comprobado

| Verificación oficial | Resultado |
| --- | --- |
| App: `npm run typecheck` | Bloqueada: no está instalado el ejecutable `tsc`. |
| App: `npm test` | Pasan 27 pruebas; nueve archivos de pruebas no pueden cargar el paquete `typescript`. La suite completa no llega a ejecutarse. |
| Backend: `npm run typecheck`, `npm run build` y `npm test` | Bloqueadas: no existe `backend/node_modules` y falta `tsc`. Las pruebas no llegan a iniciarse. |
| MySQL de integración | Pendiente: no se configuró una instancia aislada ni las variables de conexión de pruebas. |

Estos resultados iniciales identificaron un entorno incompleto; no demostraban
un fallo de tipos o de lógica en las fuentes. El líder autorizó expresamente
instalar las dependencias locales desde ambos lockfiles y preparar MySQL
temporal. Las comprobaciones siguientes se ejecutaron con los scripts
oficiales, sin el compilador auxiliar de la auditoría.

### Resultado después de preparar el entorno

| Verificación oficial | Resultado |
| --- | --- |
| App: `npm run typecheck` | Aprobada, incluida la configuración de herramientas y pruebas. |
| App: `npm test`, sin MySQL | 133 aprobadas y cinco omitidas; sin fallos. |
| App: `npm test`, con MySQL | 138 aprobadas, cero fallidas y cero omitidas. |
| Backend: `npm run typecheck` y `npm run build` | Aprobadas. |
| Backend: `npm test`, sin MySQL | 18 aprobadas y 18 omitidas; sin fallos. |
| Backend: `npm test`, con MySQL | 36 aprobadas, cero fallidas y cero omitidas. |

Se utilizó MySQL Community Server `8.4.13` para Windows, descargado del
[sitio oficial](https://dev.mysql.com/downloads/mysql/8.4.html?os=3) como ZIP.
El archivo coincidió con el checksum publicado y se extrajo fuera de los
repositorios. La instancia se limitó a `127.0.0.1:13307`, sin servicio de
Windows y con directorio de datos independiente. Las credenciales se generaron
para esa ejecución y no se escribieron en logs ni documentación. El usuario de
pruebas solo tenía permisos sobre bases `ahre_test_*`.

Las suites crearon y eliminaron sus bases sintéticas. Al terminar se comprobó
que no quedaban bases `ahre_test_*`, se apagó el proceso temporal y se eliminó
su directorio de datos sintéticos. No se contactó la base del servidor de AHRE
ni se utilizaron datos de la APK.
Los cuatro archivos de manifiesto y lockfile conservaron sus hashes SHA-256
anteriores a la preparación. La etapa 1 queda verificada; no se implementaron
las correcciones de las etapas siguientes ni se generó una build de APK.

### Preparación y recorrido reproducible

La instalación de dependencias corresponde al líder, salvo autorización
explícita para delegarla. En APP-AHRE y, por separado, en SERVER-AHRE/backend:

```powershell
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar el entorno desde el lockfile.' }
```

El comando recrea las dependencias instaladas con las versiones bloqueadas.
No usar `npm update` ni `npm audit fix` para reconstruir esta línea base.
Comprobar después que `package.json` y `package-lock.json` no tienen cambios.

Ejecutar primero tipos, compilación y pruebas del backend. Para la integración
real, el líder debe proporcionar MySQL 8.4 aislado de la instalación activa de
AHRE, con un usuario que pueda crear y eliminar bases `ahre_test_*`.
Configurar `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` mediante el entorno,
sin versionar ni mostrar la contraseña. `AHRE_MYSQL_TEST=1` habilita las pruebas
del backend. En la app también hace falta `AHRE_SERVER_SOURCE`, apuntando a
SERVER-AHRE con su backend ya compilado. Los comandos están en los README de
ambos repositorios.

Registrar por separado pruebas aprobadas, fallidas y omitidas, y el commit
usado. Una ejecución con casos MySQL omitidos no cierra la integración. La
compilación del backend tampoco equivale a una build o prueba del APK.

### Auditoría del lockfile

`npm audit --package-lock-only --json` devuelve 14 paquetes afectados en la
app: tres de severidad alta, nueve moderada y dos baja. Son cuatro avisos
originales y su propagación en el árbol de Expo. El lockfile del backend no
reporta vulnerabilidades en esta comprobación.

| Paquete transitivo bloqueado | Cadena identificada | Severidad del aviso | Corrección publicada |
| --- | --- | --- | --- |
| `deepmerge 4.3.1` | `@expo/config` | Baja | El aviso no identifica una versión corregida. |
| `glob 13.0.6` | Configuración, plugins, fingerprint, Metro y CLI de Expo | Moderada | `14.0.2`, fuera del rango `^13.0.0` declarado por sus consumidores. |
| `minimatch 10.2.6` | `glob` y `@expo/fingerprint` | Moderada | `11.0.1`, fuera de `^10.2.2`. |
| `zod 3.25.76` dentro de Expo | CLI de Expo | Alta | `4.6.6`, fuera de `^3.25.76`. El `zod 4.6.7` directo de AHRE es otra instalación. |

Fuentes de los avisos: [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4),
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) y
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

No hay imports directos de estos paquetes en las fuentes propias de AHRE.
Las cadenas observadas corresponden a herramientas de configuración,
compilación y CLI; no se comprobó la explotabilidad de sus entradas ni que
formen parte del código ejecutado por el APK. No interpretar este resultado
como 14 fallos explotables en la aplicación instalada.

La clasificación queda asignada al líder para la etapa de dependencias.
La sugerencia automática de npm implica Expo `58.0.22`, un cambio de SDK;
no se aplica durante esta etapa. Repetir la auditoría antes de decidir una
corrección, sin forzar versiones transitivas incompatibles.


### Retirada del grupo de formularios (etapa 7)

La revisión histórica anterior describía las dependencias disponibles al migrar.
El 3 de noviembre de 2026 el líder autorizó retirar `react-hook-form`,
`@hookform/resolvers` y el Zod directo, sin referencias en AHRE. La copia
`zod@3.25.76` de Expo CLI se conserva. El compilador y los tipos no cambian.
