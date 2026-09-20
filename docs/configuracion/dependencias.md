# Dependencias de AHRE

Este documento registra las dependencias directas utilizadas por AHRE, su finalidad y el motivo de su incorporación.

El proyecto utiliza Expo SDK 57, React Native y JavaScript. Las dependencias administradas por Expo se instalan con `npx expo install` para conservar la compatibilidad con la versión de SDK utilizada.

## Dependencias de ejecución

### Dependencias existentes

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `expo` | `~57.0.24` | Base del entorno Expo. | Ejecución y configuración general de la aplicación. |
| `expo-status-bar` | `~57.0.1` | Control de la barra de estado. | Ajustes visuales básicos de la aplicación. |
| `react` | `19.2.3` | Biblioteca para construir la interfaz. | Pantallas y componentes de AHRE. |
| `react-native` | `0.86.3` | Framework móvil utilizado por Expo. | Desarrollo de la aplicación para Android y otras plataformas compatibles. |

### Dependencias incorporadas

| Dependencia | Versión | Finalidad | Uso en AHRE |
| --- | --- | --- | --- |
| `@expo/vector-icons` | `^15.0.2` | Proporciona un conjunto de íconos compatibles con Expo y React Native. | Navegación, acciones y estados visuales de la interfaz. |
| `expo-image-picker` | `~57.0.19` | Permite seleccionar imágenes desde la galería o tomar una fotografía mediante la interfaz del sistema. | Perfil, comprobantes, documentos y futuras funciones de OCR. |
| `expo-constants` | `~57.0.19` | Expone información constante de la aplicación y del entorno de ejecución. | Configuración de entorno, versión de la aplicación y valores definidos en la configuración de Expo. |
| `expo-font` | `~57.0.4` | Permite cargar fuentes personalizadas o incluidas por paquetes. | Tipografía de la interfaz cuando se defina la identidad visual de AHRE. |
| `expo-local-authentication` | `~57.0.3` | Permite consultar y utilizar la autenticación biométrica disponible en el dispositivo. | Protección de acceso a la aplicación y operaciones sensibles. |
| `expo-secure-store` | `~57.0.4` | Guarda valores pequeños de forma segura utilizando mecanismos nativos del dispositivo. | Tokens, credenciales u otros datos sensibles de sesión. |
| `expo-splash-screen` | `~57.0.9` | Controla la pantalla de inicio nativa mientras se prepara la aplicación. | Evitar transiciones incorrectas al abrir AHRE y coordinar su inicio. |
| `expo-sqlite` | `~57.0.3` | Permite utilizar una base de datos SQLite local. | Persistencia principal del enfoque offline-first. |
| `expo-system-ui` | `~57.0.4` | Permite configurar aspectos de la interfaz nativa del sistema. | Fondo de la ventana y transición visual de inicio. |
| `@react-navigation/native` | `^7.4.1` | Base común para administrar la navegación en React Native. | Organización de los flujos y pantallas de AHRE. |
| `@react-navigation/native-stack` | `^7.19.2` | Implementa navegación tipo pila entre pantallas. | Flujos como inicio de sesión, registro y detalle de movimientos. |
| `@react-navigation/bottom-tabs` | `^7.19.2` | Implementa navegación mediante pestañas inferiores. | Acceso a Inicio, movimientos, estadísticas, notificaciones y perfil. |
| `react-native-screens` | `~4.26.0` | Optimiza la administración nativa de pantallas utilizadas por la navegación. | Soporte de los navegadores de React Navigation. |
| `react-native-safe-area-context` | `~5.7.0` | Detecta áreas seguras del dispositivo, como barras de estado y cámaras frontales. | Evitar que el contenido quede debajo de elementos del sistema. |
| `react-native-gesture-handler` | `~2.32.0` | Proporciona gestos nativos para interacciones táctiles. | Navegación, desplazamientos y futuras interacciones de la interfaz. |
| `react-native-reanimated` | `4.5.1` | Permite crear animaciones ejecutadas de forma eficiente. | Transiciones y cambios de interfaz sin lógica de negocio. |
| `react-native-worklets` | `0.10.1` | Proporciona la ejecución de funciones de Reanimated en contextos de trabajo. | Soporte requerido por la versión instalada de Reanimated. |
| `react-native-svg` | `15.15.4` | Permite renderizar y manipular gráficos SVG. | Íconos, gráficos y recursos vectoriales de la interfaz. |
| `react-hook-form` | `^7.88.0` | Administra el estado, los valores, el envío y el estado de los formularios. | Login, registro, depósitos, ingresos, egresos y edición de perfil. |
| `zod` | `^4.6.5` | Define esquemas de validación y comprueba que los datos tengan el formato esperado. | Validación de campos antes de guardar o enviar información. |
| `@hookform/resolvers` | `^5.9.1` | Conecta `react-hook-form` con librerías de validación como `zod`. | Ejecutar los esquemas de `zod` automáticamente dentro de los formularios. |
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

## Comandos utilizados

Dependencias administradas por Expo:

```bash
npx expo install expo-image-picker expo-constants
```

Dependencias JavaScript:

```bash
npm install react-hook-form zod @hookform/resolvers date-fns
```

## Consideraciones de configuración

### `expo-image-picker`

La dependencia utiliza la interfaz del sistema para seleccionar una imagen o tomar una fotografía. La solicitud de permisos debe realizarse desde la funcionalidad que la necesite, por ejemplo, al cargar una imagen de perfil o un comprobante.

No se incorpora `expo-camera` en esta etapa porque AHRE necesita inicialmente seleccionar imágenes o tomar fotografías desde el selector del sistema. Una cámara personalizada con vista previa, controles propios o captura continua deberá evaluarse en el issue correspondiente.

### `expo-constants`

No reemplaza la configuración de `app.json`. Su función es permitir que el código consulte determinados valores de la aplicación y del entorno en tiempo de ejecución. La configuración general del proyecto continúa en `app.json`.

### Formularios y fechas

Estas dependencias no requieren cambios adicionales en `app.json`. La validación concreta y el formato de fechas deben definirse cerca de cada funcionalidad, evitando concentrar reglas de módulos diferentes en un único archivo.

## Dependencias de desarrollo

Actualmente no se agregaron dependencias de desarrollo específicas para este issue. Se conserva la configuración proporcionada por Expo.

## Dependencias previstas para módulos futuros

Estas dependencias no se instalan todavía porque dependen de decisiones funcionales o técnicas que se tomarán al desarrollar cada módulo:

- notificaciones y tareas en segundo plano;
- ubicación y mapas;
- OCR y procesamiento avanzado de imágenes;
- biometría;
- gráficos;
- Bluetooth;
- sincronización de datos y detección de conectividad.

## Cantidad actual

El proyecto tiene actualmente **26 dependencias directas**:

- 4 dependencias que ya formaban parte del proyecto base;
- 22 dependencias incorporadas para la estructura base y los módulos iniciales.

No se incluyen las dependencias de módulos futuros hasta que exista una necesidad concreta y una decisión técnica documentada.

## Criterio de incorporación

Cada dependencia debe responder a una necesidad concreta, ser compatible con la versión de Expo utilizada, tener una finalidad documentada y comprobarse mediante la ejecución de la aplicación antes de considerarse parte estable de la base del proyecto.
