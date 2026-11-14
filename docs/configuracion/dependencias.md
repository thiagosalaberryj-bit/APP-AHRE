# Dependencias de AHRE

Este documento registra las dependencias directas utilizadas por AHRE, su finalidad y el motivo de su incorporación.

El proyecto utiliza Expo SDK 57, React Native y TypeScript. Las dependencias administradas por Expo se instalan con `npx expo install` para conservar la compatibilidad con la versión de SDK utilizada.

## Actualización de mantenimiento 0.9.1

El líder autorizó esta actualización y su changelog el 13 de noviembre de 2026,
sin Issue. La rama `codex/actualizar-dependencias-0.9.1` parte de `main`
`2a5389e`. La app declara 0.9.1 y código Android 15; SERVER-AHRE prepara 0.3.1.

Se conserva SDK 57 con React 19.2.3, React Native 0.86.3, TypeScript 6.0.3 y
las versiones nativas administradas por Expo. Los siguientes paquetes suben
dentro de sus rangos previos; se elevan también sus mínimos en el manifiesto:

| Paquete | Lockfile anterior | Lockfile 0.9.1 |
| --- | --- | --- |
| `expo` | 57.0.31 | 57.0.33 |
| `expo-constants` | 57.0.23 | 57.0.24 |
| `expo-image-manipulator` | 57.0.21 | 57.0.22 |
| `expo-image-picker` | 57.0.20 | 57.0.21 |
| `expo-splash-screen` | 57.0.10 | 57.0.11 |
| `expo-sqlite` | 57.0.4 | 57.0.5 |
| `expo-task-manager` | 57.0.22 | 57.0.23 |
| `@react-navigation/bottom-tabs` | 7.19.2 | 7.21.0 |
| `@react-navigation/native` | 7.4.1 | 7.5.1 |
| `@react-navigation/native-stack` | 7.19.2 | 7.21.0 |

El módulo `recurrence-worker` actualiza `work-runtime-ktx` de 2.10.1 a 2.10.5,
el último parche de su línea. Se difiere 2.12.0, que cambia el mínimo Android
y el comportamiento de planificación, hasta una validación nativa específica.
[Notas oficiales de WorkManager](https://developer.android.com/jetpack/androidx/releases/work).
ML Kit 16.0.1 ya está actualizado y conserva el modelo latino incluido.

npm regeneró las transitivas requeridas por los paquetes seleccionados, sin
`overrides`, `--force` ni saltos impuestos sobre los rangos de sus consumidores.
Entre ellas: `@expo/cli` 57.0.34, `@expo/config` 57.0.11,
`@expo/config-plugins` 57.0.13, `glob` 14.0.6 y `node-forge` 1.4.3.

### Auditoría de seguridad

`npm audit --package-lock-only --json` pasa de 15 paquetes afectados
(2 altos, 10 moderados y 3 bajos) a **3 moderados**, sin altos, críticos ni bajos.
Queda `minimatch` 10.2.6 requerido por `@expo/fingerprint` 0.20.16 y la
propagación a ese paquete y a Expo: es un aviso y sus dependientes, no tres
fallos independientes. El aviso afecta versiones anteriores a 11.0.1.
[Aviso de minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).

La copia 11.0.8 que usa `glob` ya está corregida; no reemplaza la 10.2.6 de
fingerprint. npm propone retroceder a Expo 52.0.49; se rechaza esa sugerencia
por incompatibilidad con SDK 57. No se fuerza minimatch 11 sobre `^10.2.6`.
La ruta restante pertenece al cálculo de huellas de compilación; no se ha
demostrado explotación desde el APK. No se declara la app libre de riesgos.

Expo 58, React 19.3, React Native 0.88, Gesture Handler 3, TypeScript 7 y
otros módulos fuera de la matriz de SDK 57 se difieren para una migración
coordinada. Los tipos de Node permanecen en la línea 24 del runtime.

### Reproducción y comprobación

Las instalaciones se realizaron con `--ignore-scripts --no-audit --no-fund`.
El lockfile forma parte de la entrega. Para reproducirlo, usar `npm ci`
en un checkout de esta rama, sin ejecutar `npm update` ni `audit fix --force`.
Expo Doctor aprueba sus 21 comprobaciones, `expo install --check` no pide
cambios y `npm ls --all` no informa problemas. Resultados completos y límites:
[Estado y validación](../estado-y-validacion.md#dependencias-091).
La consulta final de `npm outdated` no encuentra actualizaciones directas dentro
de los rangos elegidos; las versiones fuera de ellos se difieren por compatibilidad.

## Dependencias de ejecución

### Notificaciones · 9 de noviembre de 2026

El líder autorizó explícitamente instalar dependencias para esta tarea.
Se agregó `expo-notifications` `~57.0.25`, mediante `expo install` para SDK 57.
Permite canales, permisos, programación local y tokens en APK Android.
Expo Go omite la funcionalidad de push remoto y conserva los recordatorios
locales compatibles. No se incorpora Firebase JS ni un SDK Mercado Pago al cliente.
Las credenciales FCM v1 se administran en Expo y `google-services.json` registra
la app Android; la clave privada de servicio no forma parte del paquete.

### Dependencias existentes

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `expo` | `~57.0.33` | Base del entorno Expo (SDK 57). | Ejecución y configuración general de la aplicación. |
| `expo-status-bar` | `~57.0.1` | Control de la barra de estado. | Ajustes visuales básicos de la aplicación. |
| `react` | `19.2.3` | Biblioteca para construir la interfaz. | Pantallas y componentes de AHRE. |
| `react-native` | `0.86.3` | Framework móvil utilizado por Expo. | Desarrollo de la aplicación para Android y otras plataformas compatibles. |

### Dependencias incorporadas

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `@expo/vector-icons` | `^15.0.2` | Proporciona un conjunto de íconos compatibles con Expo y React Native. | Navegación, acciones y estados visuales de la interfaz. |
| `expo-camera` | `~57.0.6` | Muestra una vista previa de cámara dentro de la aplicación y captura fotografías. | Vista en vivo y captura de comprobantes en OCR; el obturador está debajo del visor. |
| `expo-image-picker` | `~57.0.21` | Permite seleccionar imágenes desde la galería o tomar una fotografía mediante la interfaz del sistema. | Perfil, comprobantes elegidos desde la galería en OCR y documentos. |
| `expo-image-manipulator` | `~57.0.22` | Recorta y transforma imágenes locales en el dispositivo. | Genera en la caché el recorte confirmado para adjuntarlo al borrador OCR. |
| `expo-crypto` | `~57.0.4` | Genera bytes aleatorios y calcula resúmenes criptográficos con Expo. | `passwordSecurity.ts` crea una sal de 16 bytes con `getRandomBytesAsync()` y deriva el verificador con una pasada SHA-256 mediante `digestStringAsync()`. |
| `expo-constants` | `~57.0.24` | Expone información constante de la aplicación y del entorno de ejecución. | Perfil lee `expoConfig.version` para Acerca de AHRE; Expo y expo-asset también la utilizan. |
| `expo-font` | `~57.0.4` | Permite cargar fuentes personalizadas o incluidas por paquetes. | Plugin en app.json y dependencia de @expo/vector-icons y Expo. Conservar. |
| `expo-local-authentication` | `~57.0.3` | Permite consultar y utilizar la autenticación biométrica disponible en el dispositivo. | Inicio la usa después de comprobar que existe una sesión local válida; la huella autoriza el acceso al Dashboard. |
| `expo-secure-store` | `~57.0.4` | Guarda valores pequeños de forma segura utilizando mecanismos nativos del dispositivo. | `sessionService.ts` guarda el identificador del usuario si «Recordarme» está activo. `balanceVisibilityService.ts` conserva por usuario la preferencia para ocultar saldos. No guarda contraseñas ni sus verificadores. |
| `expo-splash-screen` | `~57.0.11` | Controla la pantalla de inicio nativa mientras se prepara la aplicación. | Logo de AHRE y fondo claro/oscuro configurados explícitamente en el plugin; coordinación del inicio. |
| `expo-sqlite` | `~57.0.5` | Permite utilizar una base de datos SQLite local. | Persistencia offline-first; también guarda las cuentas, sus verificadores y preferencias locales. |
| `expo-system-ui` | `~57.0.4` | Permite configurar aspectos de la interfaz nativa del sistema. | Fondo de la ventana según el tema activo y transiciones sin un fondo blanco inesperado. |
| `expo-navigation-bar` | `~57.0.3` | Permite definir el estilo de los controles de navegación del sistema Android. | Cambiar el contraste de los controles según el tema; una capa de React Native pinta el fondo que corresponde a cada pantalla. |
| `@react-navigation/native` | `^7.5.1` | Base común para administrar la navegación en React Native. | Organización de los flujos y pantallas de AHRE. |
| `@react-navigation/native-stack` | `^7.21.0` | Implementa navegación tipo pila entre pantallas. | Flujos como inicio de sesión, registro y detalle de movimientos. |
| `@react-navigation/bottom-tabs` | `^7.21.0` | Implementa navegación mediante pestañas inferiores. | Acceso a Inicio, Movimientos, Nuevo, Estadísticas y Social. |
| `react-native-screens` | `~4.26.0` | Optimiza la administración nativa de pantallas utilizadas por la navegación. | Soporte de los navegadores de React Navigation. |
| `react-native-safe-area-context` | `~5.7.0` | Detecta áreas seguras del dispositivo, como barras del sistema y cámaras frontales. | Mantener formularios y navegación accesibles y calcular el inset que colorea la zona inferior de Android. |
| `react-native-gesture-handler` | `~2.32.0` | Proporciona gestos nativos para interacciones táctiles. | Está declarada, pero el código actual no la importa directamente; el gesto del toast usa `PanResponder` de React Native. |
| `react-native-reanimated` | `4.5.1` | Permite crear animaciones ejecutadas de forma eficiente. | Está declarada, pero las animaciones actuales usan `Animated` de React Native y no importan Reanimated directamente. |
| `react-native-worklets` | `0.10.1` | Proporciona la ejecución de funciones de Reanimated en contextos de trabajo. | Soporte requerido por la versión instalada de Reanimated. |
| `react-native-svg` | `15.15.4` | Permite renderizar y manipular gráficos SVG. | Íconos, gráficos y recursos vectoriales de la interfaz. |
| `date-fns` | `^4.4.0` | Proporciona funciones para analizar, comparar, ordenar y formatear fechas. | Movimientos, depósitos, estadísticas, filtros y reportes. |
| `expo-clipboard` | `~57.0.2` | Acceso al portapapeles del sistema. | Copia de enlaces e invitaciones de Social. |
| `expo-notifications` | `~57.0.25` | Permisos, canales, tokens y programación de avisos. | Recordatorios locales y notificaciones push Android. |
| `expo-task-manager` | `~57.0.23` | Registro de tareas nativas. | Integración de tareas del módulo de recurrencias. |
| `qrcode` | `^1.5.4` | Generación de códigos QR. | Invitaciones de Social. |

## Formularios y validación

Los formularios de AHRE utilizan estado de React y validaciones locales.
`react-hook-form`, `@hookform/resolvers` y el `zod` directo se retiraron en
la etapa 7 con autorización del líder, después de verificar que no tenían uso.
La CLI actualizada en 0.9.1 ya no incluye la copia vulnerable de Zod 3.
Las auditorías históricas de este documento conservan el estado de sus entregas.

## Comandos utilizados

Dependencias administradas por Expo:

```bash
npx expo install expo-image-picker expo-constants
npx expo install expo-navigation-bar
npx expo install expo-camera
npx expo install expo-image-manipulator
npx expo install expo-crypto
```

Dependencias JavaScript:

```bash
npm install date-fns
```

## Consideraciones de configuración

### `expo-image-picker`

La dependencia utiliza la interfaz del sistema para seleccionar una imagen o tomar una fotografía. En OCR se usa para elegir un comprobante de la galería; la captura integrada se realiza con `expo-camera`.

### `expo-camera`

La dependencia muestra la vista en vivo y captura la foto desde el visor de OCR.
Su plugin configura el permiso de cámara sin acceso al micrófono y habilita
`barcodeScannerEnabled` para el escáner QR de Social. OCR sigue tomando fotos;
Social reutiliza la cámara para códigos. Cambiar esa configuración nativa requiere
reconstruir la aplicación; recargar JavaScript no actualiza una APK instalada.

### `expo-image-manipulator`

Al confirmar el encuadre en OCR, recorta el archivo local a la zona visible y
guarda el resultado en la caché del dispositivo para adjuntarlo al borrador.
Como contiene código nativo, una compilación de desarrollo existente debe
reconstruirse para incluir esta dependencia.

### `expo-constants`

No reemplaza la configuración de `app.json`. Su función es permitir que el código consulte determinados valores de la aplicación y del entorno en tiempo de ejecución. La configuración general del proyecto continúa en `app.json`.

### `expo-navigation-bar` y `expo-system-ui`

`expo-system-ui` establece el fondo de ventana usando el tema activo.
`expo-navigation-bar` ajusta el contraste de los controles del sistema en
Android. En `app.json`, `enforceContrast: false` permite que React Native dibuje
el contenido hasta esa zona sin que Android agregue su propio velo de contraste.
`AppNavigator.tsx` pinta el inset inferior con la superficie de las pestañas
dentro de `PRINCIPAL` y con el fondo general en las otras pantallas;
`BottomTabBar.tsx` extiende su propia superficie hasta el mismo inset.

`enforceContrast` es configuración nativa del plugin. Si cambia, hay que
regenerar o reconstruir la app Android para que se aplique; recargar JavaScript
no modifica la configuración nativa de una app ya instalada.

### Recursos de identidad visual

`assets/ahre-mark.png` se utiliza como ícono principal de la aplicación y como
foreground del ícono adaptativo de Android. `assets/ahre-logo.png` conserva el
nombre AHRE y se utiliza en la pantalla de carga y en el header del Dashboard.

### Formularios y fechas

Estas dependencias no requieren cambios adicionales en `app.json`. La validación concreta y el formato de fechas deben definirse cerca de cada funcionalidad, evitando concentrar reglas de módulos diferentes en un único archivo.

## Dependencias de desarrollo

| Dependencia | Versión exacta | Finalidad |
| --- | --- | --- |
| `typescript` | `6.0.3` | Compilador y comprobación de tipos, según la plantilla de Expo SDK 57. |
| `@types/react` | `19.2.4` | Tipos para React 19.2 y JSX, parche recomendado por Expo CLI. |
| `@types/node` | `24.19.2` | Tipos para las pruebas y el plugin ejecutados con Node 24. |
| `@types/qrcode` | `1.5.6` (rango `^1.5.6`) | Tipos del generador de QR. |

El líder autorizó estos cambios e instalación en la conversación de migración
TypeScript sin Issue. En aquella migración no se actualizaron las dependencias de ejecución.
Ver [compatibilidad y configuración de TypeScript](typescript.md).

## Dependencias previstas para módulos futuros

Estas capacidades todavía no están implementadas. Algunas dependencias de la tabla ya están declaradas, pero no se usan hasta que se desarrolle el flujo correspondiente:

- ubicación y mapas;
- procesamiento avanzado de imágenes adicional al OCR local implementado;
- Bluetooth.

Las notificaciones, tareas, gráficos SVG y sincronización ya tienen usos
implementados; no se consideran futuras incorporaciones de dependencias.

## Cantidad actual

El proyecto tiene actualmente **35 dependencias directas**:

- 31 dependencias de ejecución;
- 4 dependencias de desarrollo, incluidos los tipos de QR.

No se agregan dependencias adicionales para módulos futuros hasta que exista
una necesidad concreta y una decisión técnica documentada. Algunas
dependencias ya declaradas permanecen sin uso directo y están identificadas en
la tabla.

## Cambios de versiones registrados

En la actualización previa al Issue 31 se cambiaron estas dependencias directas:

| Paquete | Versión anterior | Versión actual |
| --- | --- | --- |
| `expo` | `~57.0.25` | `~57.0.26` |
| `expo-camera` | `~57.0.5` | `~57.0.6` |
| `expo-constants` | `~57.0.19` | `~57.0.20` |
| `expo-navigation-bar` | `~57.0.2` | `~57.0.3` |

El lockfile también resolvió `expo-modules-core` de `57.0.19` a `57.0.20`
como dependencia transitiva de Expo; no se agrega directamente a
`package.json`.

Durante las pruebas del Issue 31, el líder autorizó expresamente resolver en
esta misma rama los avisos de versiones, el ícono y el splash. Se aplicaron solo
las versiones correctivas recomendadas por Expo, sin cambiar SDK 57:

| Paquete | Versión anterior | Versión actual |
| --- | --- | --- |
| `expo` | `~57.0.26` | `~57.0.30` |
| `expo-constants` | `~57.0.20` | `~57.0.22` |
| `expo-crypto` | `~57.0.3` | `~57.0.4` |
| `expo-image-manipulator` | `~57.0.20` | `~57.0.21` |
| `expo-splash-screen` | `~57.0.9` | `~57.0.10` |
| `expo-sqlite` | `~57.0.3` | `~57.0.4` |

El plugin `expo-splash-screen` ahora recibe imagen, ancho de 160 y colores
claro/oscuro de AHRE. `plugins/withCompleteAdaptiveIcon.cts` agrega un inset nativo
de 22% al primer plano de los íconos adaptativos normal y redondo, conservando
la imagen original para evitar recortes por la máscara del launcher. Ambos
cambios requieren un APK nuevo. `eas.json` declara `cli.appVersionSource: local`
para explicitar el versionado actual sin activar incrementos remotos.

## Antecedente: versión 0.5.0 y APK interno

La versión `0.5.0` se preparó el 1 de noviembre de 2026. La configuración de esa entrega
usa `expo.version: 0.5.0` y `android.versionCode: 3` en
`app.json`. `package.json` y las dos versiones de la raíz de `package-lock.json`
también indican `0.5.0`; las versiones de dependencias no cambian.
EAS conserva `cli.appVersionSource: local` y el perfil `ocr-comparison` genera
un APK de distribución interna. Hace falta reconstruir e instalar el APK para
ver la nueva versión en Android:

```powershell
eas build --platform android --profile ocr-comparison --no-wait
```

El APK del commit `8d106b3`, que el líder ya probó, conserva la versión `0.4.0`
y el código Android `2`. La nueva numeración requiere otra compilación; su
registro de validación está en [TypeScript](typescript.md#build-android-y-validación-en-dispositivo).

La versión preparada en esta rama es independiente de la prerelease histórica
`v0.4.0` de GitHub, que conserva su commit y sus metadatos anteriores a Social.

## Autenticación local y dependencias

`expo-crypto` se usa en `src/authentication/passwordSecurity.ts`: el servicio
genera una sal aleatoria de 16 bytes y calcula un SHA-256 con esa sal en una
sola pasada. No usa PBKDF2 ni una función deliberadamente lenta para derivar
contraseñas. El hash rápido reduce la espera en Expo Go, pero permite probar
contraseñas con rapidez si alguien obtiene una copia de SQLite.

`expo-sqlite` conserva el usuario, el verificador y las preferencias. Cuando
«Recordarme» está activo, `expo-secure-store` conserva solamente el
identificador local del usuario; al desactivarlo, la sesión queda en memoria.
Ninguna de estas dependencias envía datos a un servidor.

La implementación detallada está en
[`docs/funcionalidades/autenticacion-local.md`](../funcionalidades/autenticacion-local.md).

## Criterio de incorporación

### Auditoría de seguridad npm del 28 de octubre de 2026

El líder autorizó en la conversación las correcciones de dependencias sin
Issue. Esta revisión mantiene Expo SDK 57 y React Native 0.86.3. El estado
inicial de esta instalación tenía 13 paquetes afectados: 5 bajos, 3 moderados,
4 altos y 1 crítico.

Se actualizaron los siguientes paquetes dentro de los rangos de sus padres,
además del parche Expo recomendado por su comprobación oficial:

| Paquete | Antes | Después |
| --- | --- | --- |
| `shell-quote` | `1.10.0` | `1.12.0` |
| `@expo/config-plugins` | `57.0.10` | `57.0.11` |
| `xcode` | `3.0.1` | `4.0.0` |
| `node-forge` | `1.4.0` | `1.4.2` |
| `zod` directo de AHRE | `4.6.5` | `4.6.7` |
| `expo` | `57.0.30` | `57.0.31` |

`xcode@4.0.0` elimina la dependencia de `uuid@7.0.3` y su aviso de
obsolescencia. Expo también actualiza sus dependencias transitivas asociadas.
`package.json` exige ahora `zod@^4.6.7`; la copia interna de Expo CLI sigue
siendo `3.25.76`, porque su rango es `^3.25.76`.

Comandos aplicados, sin ejecutar scripts de instalación:

```powershell
npm update shell-quote @expo/config-plugins node-forge zod --ignore-scripts
npm install expo@~57.0.31 --ignore-scripts
npm install zod@^4.6.7 --ignore-scripts
```

Resultado: **8 paquetes afectados: 5 bajos y 3 altos**, sin críticos ni
moderados. Las alertas restantes provienen de:

- `zod@3.25.76`, instalado por `@expo/cli`, más las alertas propagadas a
  `@expo/cli` y `expo`. El aviso marca versiones menores que `4.6.6`; no se
  fuerza una versión mayor sobre el rango que declara la CLI.
  [Aviso de Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- `deepmerge@4.3.1`, instalado por `@expo/config`, y sus cuatro alertas
  bajas propagadas a paquetes de configuración de Expo. En la fecha de esta
  revisión, `4.3.1` sigue siendo la última versión publicada y el aviso no
  identifica una versión corregida.
  [Aviso de deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

No se evaluó la explotabilidad de esos fallos en cada uso de las herramientas.
No ejecutar `npm audit fix --force` como arreglo automático: el informe
propone retroceder a Expo `51.0.39`, fuera de la base actual de SDK 57.
No se ocultaron alertas ni se agregaron overrides.

Se conserva `package-lock.json` con las resoluciones corregidas; debe revisarse
y versionarse junto con `package.json` para reproducirlas. Pasaron las 24
pruebas existentes de OCR y persistencia y la exportación Android con Hermes.
Esta exportación no sustituye probar un APK nuevo en dispositivo.

### OCR offline con ML Kit (#31)

El líder autorizó las dependencias de evaluación y seleccionó ML Kit después
de comparar lecturas en su dispositivo. Por su indicación se retiraron
Tesseract, sus dos configuraciones y el modelo español. No se agregaron
dependencias npm. El módulo local Expo `modules/receipt-ocr/` incorpora:

| Dependencia | Versión | Uso |
| --- | --- | --- |
| `com.google.mlkit:text-recognition` | `16.0.1` | Modelo latino incluido; OCR sin descarga inicial. |

Hace falta un APK nuevo; Expo Go no incluye este módulo. Expo Autolinking lo
detecta en `modules/` y el perfil EAS `ocr-comparison` genera un APK interno.
La parte nativa está en Kotlin porque invoca el SDK Android; el intérprete y
la interfaz de AHRE permanecen en TypeScript. El tamaño final y el rendimiento
deben medirse en dispositivo. La referencia a los términos del SDK está en
`modules/receipt-ocr/NOTICE.md`; pruebas y límites en
[`../funcionalidades/ocr.md`](../funcionalidades/ocr.md).

### Regla general

Cada dependencia debe responder a una necesidad concreta, ser compatible con
la versión de Expo utilizada y tener su estado de uso documentado. Las
dependencias ya declaradas pero todavía sin uso directo no significan que la
capacidad correspondiente esté activa en AHRE.


## Revisión de limpieza y dependencias (etapa 7, 3 de noviembre de 2026)

La revisión buscó imports, reexportaciones, cargas dinámicas, configuración Expo,
módulos nativos, scripts y pruebas, además de consultar `npm ls --all`, el lockfile,
`npm audit --package-lock-only --json` y `npm outdated --json`. Tras esa revisión,
el líder autorizó retirar los tres paquetes de formularios sin uso. Se actualizaron
manifiesto y lockfile con npm, conservando las versiones de los demás paquetes.
La primera consulta de red falló por DNS; los resultados indicados aquí provienen
del reintento correcto contra el registro npm.

| Dependencia o grupo | Evidencia y decisión propuesta al líder |
| --- | --- |
| `react-hook-form`, `@hookform/resolvers`, `zod` directo | Sin imports ni uso en scripts, plugins, módulos nativos o pruebas. La documentación solo describe una integración futura. El árbol muestra el vínculo de resolvers con los otros dos; se retiraron juntos con autorización del líder. La copia de Zod 3 de Expo CLI es distinta y se conserva. |
| `expo-font` | Plugin en `app.json` y uso indirecto por los iconos y Expo: conservar. |
| `expo-constants` | Perfil consulta la versión configurada y Expo, expo-asset y router-server lo requieren indirectamente: conservar. |
| `date-fns` | `src/components/DateSelector.tsx` importa funciones y el locale español: conservar. |
| Paquetes nativos Expo/React Native | Hay imports, plugins o integración nativa; conservar el conjunto compatible con SDK 57. No actualizarlos de forma independiente solo por existir otra versión. |
| React Navigation | Dentro de los rangos hay actualizaciones: bottom-tabs y native-stack 7.19.2 → 7.21.0, native 7.4.1 → 7.5.1. Son candidatas a evaluar con navegación y dispositivo; no son una corrección de las alertas auditadas. |
| Expo y transitivas vulnerables | La herramienta propone Expo 58.0.23, una versión mayor. La migración necesita revisar conjuntamente Expo, React, React Native, los módulos y el OCR nativo. No aplicar automáticamente en esta limpieza. |
| TypeScript y tipos | Mantener las versiones validadas. Un cambio mayor de compilador exige revisión propia; los tipos de Node del backend pueden alinearse con el runtime Node 24 en una actualización de herramientas, sin saltar a la última versión mayor por defecto. |

### Seguridad y obsolescencia

La consulta repetida antes de integrar, el 3 de noviembre de 2026, conserva
14 paquetes afectados (3 altos, 9 moderados, 2 bajos; sin críticos). Son cuatro
avisos y sus propagaciones, no catorce fallos independientes. npm propone Expo
58.0.23 como cambio mayor; esa propuesta no demuestra que toda la migración
sea compatible ni que elimine cada aviso. No se modificaron dependencias.

Para resolverlos, preparar una actualización separada: comprobar primero si
hay parches compatibles con SDK 57 que cambien las transitivas afectadas;
si no alcanzan, evaluar el salto de SDK siguiendo la
[guía oficial de Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).
Después alinear los módulos con `npx expo install --fix`, ejecutar
`npx expo-doctor`, revisar el lockfile y repetir audit, tipos, integración y
exportación. Estas son tareas propuestas para esa actualización, no comandos
ejecutados en esta corrección de interfaz. Probar además un APK nuevo con
OCR/ML Kit, SQLite, acceso offline y sincronización antes de aprobarla.

No forzar versiones mayores de transitivas mediante overrides sin comprobar
sus consumidores. El aviso de
[deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
todavía no identifica una versión corregida; si persiste tras actualizar Expo,
documentar la ruta afectada y evaluar su exposición concreta. No declarar la
app libre de riesgo solo porque los paquetes aparezcan en herramientas de Expo.

La auditoría actual de APP-AHRE informa 14 paquetes afectados: 3 altos,
9 moderados y 2 bajos; son alertas directas y propagadas desde cuatro avisos:
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) y
[deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
No se evaluó la explotabilidad concreta de cada ruta. Retirar formularios sin uso
no resuelve las alertas del árbol de Expo. La actualización mayor propuesta no
es una corrección que deba ejecutarse con `npm audit fix --force` en esta etapa.

SERVER-AHRE informa cero vulnerabilidades. Express 4.22.3 y sus tipos 4.17.25
están al día dentro de sus rangos; npm ofrece Express 5.3.0 y tipos 5.0.6 como
versiones mayores. No hay motivo confirmado para migrarlos en una limpieza sin
cambios de comportamiento. `mysql2`, `tsx` y TypeScript no aparecen atrasados
según la consulta de sus rangos actuales. Ninguno de los dos lockfiles contiene
paquetes marcados `deprecated`; eso no significa que estén libres de avisos.

### Limpieza implementada

Se retiraron `src/components/ErrorMessage.tsx`, `src/services/index.ts` y
`src/utils/structureSmokeTest.ts`, sin consumidores de código, configuración o
pruebas. Sus referencias descriptivas se retiraron de arquitectura, Perfil y
README. Se conservaron las entradas históricas de changelog.

El compilador confirmó y se retiraron imports sin uso de componentes Social,
pantallas, repositorios, servicios y tipos. El parámetro ignorado de medición del
gráfico se marca `_y`, conservando la posición de `ancho` en la API nativa.
En SERVER-AHRE se eliminaron los selectores `.nota-demo` y `.franja` y sus reglas
asociadas, ausentes del HTML y JavaScript; se conserva `.nota` y las demás reglas.

La modificación de dependencias corresponde al líder según `AGENTS.md`; la
revisión deja una propuesta concreta para retirar el grupo de formularios y
separa las migraciones mayores que necesitan otro alcance y validación nativa.

La limpieza pasó tipos, la comprobación adicional `--noUnusedLocals
--noUnusedParameters`, 158 pruebas de la app y 45 del backend con MySQL
8.4.13 temporal local, sin fallos ni omisiones. PostCSS aceptó el CSS resultante.
El progreso anterior a esta etapa quedó guardado en APP-AHRE `dadf614` y
SERVER-AHRE `b142f7e`; los cambios de limpieza siguen separados de esos commits.
El líder autorizó después la retirada de los tres paquetes. Se ejecutó:

```powershell
npm uninstall react-hook-form @hookform/resolvers zod --ignore-scripts --no-audit --no-fund --offline
```

npm retiró también `@standard-schema/utils@0.3.0`, dependencia exclusiva de los
resolvers. Se comprobó que ninguna versión, URL, integridad ni requisito de los
paquetes conservados cambió. npm recalculó metadatos `peer` y `libc` del lockfile;
no se forzaron overrides ni se modificó el Zod 3 interno de Expo. Las secciones
históricas de auditorías anteriores conservan sus versiones y resultados originales.


Después de retirar las dependencias pasaron otra vez tipos, las 158 pruebas
de la app y las 45 del backend con MySQL local, sin fallos ni omisiones.
`npm ls --all` no reportó problemas. También finalizó la exportación Android
con Hermes; el primer intento falló al escribir un temporal del sandbox y
el reintento con permisos suficientes terminó correctamente. Esta exportación
comprueba el empaquetado, no sustituye instalar y probar un APK en dispositivo.
La auditoría posterior conserva 14 paquetes afectados del árbol de Expo
(3 altos, 9 moderados, 2 bajos); la retirada no corrige esos cuatro avisos.


## Integración online y recurrencias

La [guía de la implementación](../arquitectura/social-online-recurrencias.md) define el contrato actual de categorías por gasto, identidades, conectividad, recurrencias y eliminación lógica.

El líder autorizó para esta tarea `expo-task-manager` y WorkManager 2.10.1 en el módulo local. SERVER-AHRE incorpora `ws` y `@types/ws`. No se aplicaron actualizaciones generales de dependencias.

El líder autorizó `qrcode` y `@types/qrcode` para las invitaciones. Se usa el
núcleo JavaScript para crear una matriz y dibujarla con el `react-native-svg`
existente, sin canvas ni servicios externos. El escáner utiliza `expo-camera`,
ya disponible; los QR contienen el mismo enlace HTTPS de invitación de la web.

El líder autorizó instalar `expo-clipboard` con `expo install` para SDK 57.
El ícono de copia de las invitaciones utiliza `setStringAsync` para copiar el
enlace completo, con confirmación y manejo de fallos. Compartir por una app
conserva el menú nativo de React Native; no se envían mensajes automáticamente.
