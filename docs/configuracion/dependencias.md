# Dependencias de AHRE

Este documento registra las dependencias directas utilizadas por AHRE, su finalidad y el motivo de su incorporación.

El proyecto utiliza Expo SDK 57, React Native y JavaScript. Las dependencias administradas por Expo se instalan con `npx expo install` para conservar la compatibilidad con la versión de SDK utilizada.

## Dependencias de ejecución

### Dependencias existentes

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `expo` | `~57.0.25` | Base del entorno Expo (SDK 57). | Ejecución y configuración general de la aplicación. |
| `expo-status-bar` | `~57.0.1` | Control de la barra de estado. | Ajustes visuales básicos de la aplicación. |
| `react` | `19.2.3` | Biblioteca para construir la interfaz. | Pantallas y componentes de AHRE. |
| `react-native` | `0.86.3` | Framework móvil utilizado por Expo. | Desarrollo de la aplicación para Android y otras plataformas compatibles. |

### Dependencias incorporadas

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `@expo/vector-icons` | `^15.0.2` | Proporciona un conjunto de íconos compatibles con Expo y React Native. | Navegación, acciones y estados visuales de la interfaz. |
| `expo-camera` | `~57.0.5` | Muestra una vista previa de cámara dentro de la aplicación y captura fotografías. | Vista en vivo y captura de comprobantes en OCR; el obturador está debajo del visor. |
| `expo-image-picker` | `~57.0.20` | Permite seleccionar imágenes desde la galería o tomar una fotografía mediante la interfaz del sistema. | Perfil, comprobantes elegidos desde la galería en OCR y documentos. |
| `expo-image-manipulator` | `~57.0.20` | Recorta y transforma imágenes locales en el dispositivo. | Genera en la caché el recorte confirmado para adjuntarlo al borrador OCR. |
| `expo-crypto` | `~57.0.3` | Genera bytes aleatorios y calcula resúmenes criptográficos con Expo. | `passwordSecurity.js` crea una sal de 16 bytes con `getRandomBytesAsync()` y deriva el verificador con una pasada SHA-256 mediante `digestStringAsync()`. |
| `expo-constants` | `~57.0.19` | Expone información constante de la aplicación y del entorno de ejecución. | Está declarada, pero el código de AHRE todavía no la importa. |
| `expo-font` | `~57.0.4` | Permite cargar fuentes personalizadas o incluidas por paquetes. | Está declarada para una posible tipografía personalizada; AHRE todavía usa la fuente del sistema. |
| `expo-local-authentication` | `~57.0.3` | Permite consultar y utilizar la autenticación biométrica disponible en el dispositivo. | Está declarada, pero AHRE todavía no la importa ni activa flujos biométricos. |
| `expo-secure-store` | `~57.0.4` | Guarda valores pequeños de forma segura utilizando mecanismos nativos del dispositivo. | `sessionService.js` guarda el identificador del usuario si «Recordarme» está activo. No guarda contraseñas ni sus verificadores. |
| `expo-splash-screen` | `~57.0.9` | Controla la pantalla de inicio nativa mientras se prepara la aplicación. | Evitar transiciones incorrectas al abrir AHRE y coordinar su inicio. |
| `expo-sqlite` | `~57.0.3` | Permite utilizar una base de datos SQLite local. | Persistencia offline-first; también guarda las cuentas, sus verificadores y preferencias locales. |
| `expo-system-ui` | `~57.0.4` | Permite configurar aspectos de la interfaz nativa del sistema. | Fondo de la ventana según el tema activo y transiciones sin un fondo blanco inesperado. |
| `expo-navigation-bar` | `~57.0.2` | Permite definir el estilo de los controles de navegación del sistema Android. | Cambiar el contraste de los controles según el tema; una capa de React Native pinta el fondo que corresponde a cada pantalla. |
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
| `zod` | `^4.6.5` | Permite definir esquemas para validar formatos y reglas de datos. | Disponible para formularios futuros; Login y Registro usan reglas locales en `authenticationValidation.js`. |
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
- OCR y procesamiento avanzado de imágenes;
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

Cada dependencia debe responder a una necesidad concreta, ser compatible con
la versión de Expo utilizada y tener su estado de uso documentado. Las
dependencias ya declaradas pero todavía sin uso directo no significan que la
capacidad correspondiente esté activa en AHRE.
