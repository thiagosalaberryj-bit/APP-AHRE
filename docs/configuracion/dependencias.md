# Dependencias de AHRE

Este documento registra las dependencias directas utilizadas por AHRE, su finalidad y el motivo de su incorporación.

El proyecto utiliza Expo SDK 57, React Native y JavaScript. Las dependencias administradas por Expo se instalan con `npx expo install` para conservar la compatibilidad con la versión de SDK utilizada.

## Dependencias de ejecución

### Dependencias existentes

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `expo` | `~57.0.31` | Base del entorno Expo (SDK 57). | Ejecución y configuración general de la aplicación. |
| `expo-status-bar` | `~57.0.1` | Control de la barra de estado. | Ajustes visuales básicos de la aplicación. |
| `react` | `19.2.3` | Biblioteca para construir la interfaz. | Pantallas y componentes de AHRE. |
| `react-native` | `0.86.3` | Framework móvil utilizado por Expo. | Desarrollo de la aplicación para Android y otras plataformas compatibles. |

### Dependencias incorporadas

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `@expo/vector-icons` | `^15.0.2` | Proporciona un conjunto de íconos compatibles con Expo y React Native. | Navegación, acciones y estados visuales de la interfaz. |
| `expo-camera` | `~57.0.6` | Muestra una vista previa de cámara dentro de la aplicación y captura fotografías. | Vista en vivo y captura de comprobantes en OCR; el obturador está debajo del visor. |
| `expo-image-picker` | `~57.0.20` | Permite seleccionar imágenes desde la galería o tomar una fotografía mediante la interfaz del sistema. | Perfil, comprobantes elegidos desde la galería en OCR y documentos. |
| `expo-image-manipulator` | `~57.0.21` | Recorta y transforma imágenes locales en el dispositivo. | Genera en la caché el recorte confirmado para adjuntarlo al borrador OCR. |
| `expo-crypto` | `~57.0.4` | Genera bytes aleatorios y calcula resúmenes criptográficos con Expo. | `passwordSecurity.js` crea una sal de 16 bytes con `getRandomBytesAsync()` y deriva el verificador con una pasada SHA-256 mediante `digestStringAsync()`. |
| `expo-constants` | `~57.0.22` | Expone información constante de la aplicación y del entorno de ejecución. | Está declarada, pero el código de AHRE todavía no la importa. |
| `expo-font` | `~57.0.4` | Permite cargar fuentes personalizadas o incluidas por paquetes. | Está declarada para una posible tipografía personalizada; AHRE todavía usa la fuente del sistema. |
| `expo-local-authentication` | `~57.0.3` | Permite consultar y utilizar la autenticación biométrica disponible en el dispositivo. | Inicio la usa después de comprobar que existe una sesión local válida; la huella autoriza el acceso al Dashboard. |
| `expo-secure-store` | `~57.0.4` | Guarda valores pequeños de forma segura utilizando mecanismos nativos del dispositivo. | `sessionService.js` guarda el identificador del usuario si «Recordarme» está activo. `balanceVisibilityService.js` conserva por usuario la preferencia para ocultar saldos. No guarda contraseñas ni sus verificadores. |
| `expo-splash-screen` | `~57.0.10` | Controla la pantalla de inicio nativa mientras se prepara la aplicación. | Logo de AHRE y fondo claro/oscuro configurados explícitamente en el plugin; coordinación del inicio. |
| `expo-sqlite` | `~57.0.4` | Permite utilizar una base de datos SQLite local. | Persistencia offline-first; también guarda las cuentas, sus verificadores y preferencias locales. |
| `expo-system-ui` | `~57.0.4` | Permite configurar aspectos de la interfaz nativa del sistema. | Fondo de la ventana según el tema activo y transiciones sin un fondo blanco inesperado. |
| `expo-navigation-bar` | `~57.0.3` | Permite definir el estilo de los controles de navegación del sistema Android. | Cambiar el contraste de los controles según el tema; una capa de React Native pinta el fondo que corresponde a cada pantalla. |
| `@react-navigation/native` | `^7.4.1` | Base común para administrar la navegación en React Native. | Organización de los flujos y pantallas de AHRE. |
| `@react-navigation/native-stack` | `^7.19.2` | Implementa navegación tipo pila entre pantallas. | Flujos como inicio de sesión, registro y detalle de movimientos. |
| `@react-navigation/bottom-tabs` | `^7.19.2` | Implementa navegación mediante pestañas inferiores. | Acceso a Inicio, Movimientos, Nuevo, Estadísticas y Social. |
| `react-native-screens` | `~4.26.0` | Optimiza la administración nativa de pantallas utilizadas por la navegación. | Soporte de los navegadores de React Navigation. |
| `react-native-safe-area-context` | `~5.7.0` | Detecta áreas seguras del dispositivo, como barras del sistema y cámaras frontales. | Mantener formularios y navegación accesibles y calcular el inset que colorea la zona inferior de Android. |
| `react-native-gesture-handler` | `~2.32.0` | Proporciona gestos nativos para interacciones táctiles. | Está declarada, pero el código actual no la importa directamente; el gesto del toast usa `PanResponder` de React Native. |
| `react-native-reanimated` | `4.5.1` | Permite crear animaciones ejecutadas de forma eficiente. | Está declarada, pero las animaciones actuales usan `Animated` de React Native y no importan Reanimated directamente. |
| `react-native-worklets` | `0.10.1` | Proporciona la ejecución de funciones de Reanimated en contextos de trabajo. | Soporte requerido por la versión instalada de Reanimated. |
| `react-native-svg` | `15.15.4` | Permite renderizar y manipular gráficos SVG. | Íconos, gráficos y recursos vectoriales de la interfaz. |
| `react-hook-form` | `^7.88.0` | Base para administrar estado, valores, envío y estado de formularios. | Disponible para futuros formularios; Login y Registro mantienen el estado local de sus campos. |
| `zod` | `^4.6.7` | Permite definir esquemas para validar formatos y reglas de datos. | Disponible para formularios futuros; Login y Registro usan reglas locales en `authenticationValidation.js`. |
| `@hookform/resolvers` | `^5.9.1` | Conecta `react-hook-form` con librerías de validación como `zod`. | Integración futura de validaciones dentro de los formularios. |
| `date-fns` | `^4.4.0` | Proporciona funciones para analizar, comparar, ordenar y formatear fechas. | Movimientos, depósitos, estadísticas, filtros y reportes. |

## Cómo se complementan los formularios

Estas dependencias cumplen responsabilidades diferentes:

```text
react-hook-form
        ↓ administra los datos y el estado del formulario
zod
        ↓ define y ejecuta las reglas de validación
@hookform/resolvers
        ↓ conecta ambas dependencias
formulario válido o errores por campo
```

Por ejemplo, `react-hook-form` puede controlar el valor de un campo de monto, mientras que `zod` comprueba que sea obligatorio, numérico y mayor que cero. `@hookform/resolvers` permite que ese resultado llegue al formulario y se muestre junto al campo correspondiente.

Instalarlas no crea formularios automáticamente. Solo deja disponible una base común para que las pantallas implementen formularios consistentes cuando se desarrollen sus funcionalidades.
Login y Registro utilizan validaciones locales y no dependen de
`react-hook-form`, `zod` ni sus resolvers. Estas dependencias siguen disponibles
para otros formularios que requieran estado y validación declarativa.

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
npm install react-hook-form zod @hookform/resolvers date-fns
```

## Consideraciones de configuración

### `expo-image-picker`

La dependencia utiliza la interfaz del sistema para seleccionar una imagen o tomar una fotografía. En OCR se usa para elegir un comprobante de la galería; la captura integrada se realiza con `expo-camera`.

### `expo-camera`

La dependencia muestra la vista en vivo y captura la foto directamente desde el visor de OCR. Su plugin configura el permiso de cámara en iOS y Android; no se solicita acceso al micrófono ni se habilita el escaneo de códigos porque esta pantalla solo toma fotografías. Si cambia esta configuración nativa, hay que regenerar o reconstruir la aplicación para que se aplique.

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
`AppNavigator.js` pinta el inset inferior con la superficie de las pestañas
dentro de `PRINCIPAL` y con el fondo general en las otras pantallas;
`BottomTabBar.js` extiende su propia superficie hasta el mismo inset.

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

No hay dependencias de desarrollo específicas agregadas para AHRE. Se conserva
la configuración proporcionada por Expo.

## Dependencias previstas para módulos futuros

Estas capacidades todavía no están implementadas. Algunas dependencias de la tabla ya están declaradas, pero no se usan hasta que se desarrolle el flujo correspondiente:

- notificaciones locales o push y tareas en segundo plano;
- ubicación y mapas;
- procesamiento avanzado de imágenes adicional al OCR local implementado;
- gráficos;
- Bluetooth;
- sincronización de datos y detección de conectividad.

## Cantidad actual

El proyecto tiene actualmente **30 dependencias directas**:

- 4 dependencias que ya formaban parte del proyecto base;
- 26 dependencias incorporadas para la estructura base y los módulos iniciales.

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
claro/oscuro de AHRE. `plugins/withCompleteAdaptiveIcon.js` agrega un inset nativo
de 22% al primer plano de los íconos adaptativos normal y redondo, conservando
la imagen original para evitar recortes por la máscara del launcher. Ambos
cambios requieren un APK nuevo. `eas.json` declara `cli.appVersionSource: local`
para explicitar el versionado actual sin activar incrementos remotos.

## Versión de la aplicación y APK interno

La configuración actual usa `expo.version: 0.4.0` y `android.versionCode: 2` en
`app.json`. `package.json` y las dos versiones de la raíz de `package-lock.json`
también indican `0.4.0`; las versiones de dependencias no cambian.
EAS conserva `cli.appVersionSource: local` y el perfil `ocr-comparison` genera
un APK de distribución interna. Hace falta reconstruir e instalar el APK para
ver la nueva versión en Android:

```powershell
eas build --platform android --profile ocr-comparison --no-wait
```

La versión instalada de esta rama es independiente de la prerelease histórica
`v0.4.0` de GitHub, que conserva su commit y sus metadatos anteriores a Social.

## Autenticación local y dependencias

`expo-crypto` se usa en `src/authentication/passwordSecurity.js`: el servicio
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
la interfaz de AHRE permanecen en JavaScript. El tamaño final y el rendimiento
deben medirse en dispositivo. La referencia a los términos del SDK está en
`modules/receipt-ocr/NOTICE.md`; pruebas y límites en
[`../funcionalidades/ocr.md`](../funcionalidades/ocr.md).

### Regla general

Cada dependencia debe responder a una necesidad concreta, ser compatible con
la versión de Expo utilizada y tener su estado de uso documentado. Las
dependencias ya declaradas pero todavía sin uso directo no significan que la
capacidad correspondiente esté activa en AHRE.
