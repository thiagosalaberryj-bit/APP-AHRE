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

Se conserva Expo SDK 57, las versiones de las dependencias de ejecución y la
versión instalada `0.4.0` con código Android `2`. El esquema SQLite conserva su
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
| Versión instalada | `0.4.0`, código Android `2` |
| Prueba manual | El líder confirmó que probó el APK y funciona. |

Esta confirmación corresponde a una prueba funcional general en dispositivo.
Complementa las 110 pruebas automatizadas, el chequeo estricto y la exportación
con Hermes; no se informó un desglose de escenarios manuales por pantalla.
