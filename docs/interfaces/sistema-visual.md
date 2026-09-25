# Sistema visual de AHRE

## Objetivo

Este documento registra los tokens visuales y temas compartidos de AHRE. La
aplicación está preparada para Expo y React Native utilizando JavaScript y
`StyleSheet`.

React Native no utiliza archivos CSS web. Por eso los estilos se organizan en
archivos `.js` dentro de `src/styles/`. Las pantallas podrán combinar estos
estilos globales con estilos locales de layout cuando sea necesario.

Los estilos globales se combinan con layouts locales cuando una interfaz lo
necesita. Por ejemplo, Login y Registro consumen los temas globales y agregan
`src/styles/authStyles.js` para sus distribuciones particulares.

## Organización

```text
src/
└── styles/
    ├── HomeScreenStyles.js # Estilos propios de la pantalla de inicio
    ├── authStyles.js    # Layout y detalles visuales de Login y Registro
    ├── colors.js        # Paleta, estados y temas
    └── globalStyles.js  # StyleSheet, tipografía, espaciado y bordes
```

Las constantes de rutas y otras constantes de dominio continúan en
`src/constants/`. Los valores visuales no se duplican allí.

## Paleta de colores

### Marca y superficies

| Nombre | Valor | Uso |
| --- | --- | --- |
| Verde oscuro | `#024C42` | Encabezados, detalles, iconos de deuda y elementos principales |
| Verde medio | `#296860` | Contenedores secundarios, botones de encabezado y enfoque |
| Verde claro | `#CCEB6C` | Acciones principales, iconos destacados y texto sobre verde |
| Fondo claro | `#F4F4F4` | Fondo general del modo claro |
| Superficie | `#FFFFFF` | Tarjetas, formularios, contenedores y navegación |
| Texto principal | `#111111` | Títulos, montos y contenido principal |
| Texto secundario | `#686868` | Ayudas, descripciones y metadatos |
| Borde | `#D6D6D6` | Separadores y bordes suaves |
| Borde fuerte | `#1A1A1A` | Inputs y controles que necesitan definición |

Las pantallas utilizan fondo gris claro con contenedores internos blancos. No
se pinta todo el contenedor de verde.

### Estados y movimientos

Los colores de ingresos y egresos son suaves para evitar saturación visual.
Siempre deben acompañarse con texto, signo o icono.

| Nombre | Valor | Uso |
| --- | --- | --- |
| Ingreso | `#A8D5B2` | Dinero recibido y movimientos positivos |
| Egreso | `#E7B0B0` | Dinero gastado y movimientos negativos |
| Éxito | `#2E7D32` | Operaciones completadas |
| Error | `#C62828` | Errores y validaciones |
| Advertencia | `#F9A825` | Avisos importantes |
| Información | `#1976D2` | Mensajes informativos |
| Enfoque | `#296860` | Inputs enfocados y elementos seleccionados |

### Colores para depósitos

Estos colores sirven para identificar visualmente un depósito y no representan
su tipo ni su estado.

```text
#BED5C8  #C3D1E3  #C8C7CA  #CEC0E1  #EDB8BC  #F6DB9F
```

### Colores para gráficos

```text
#E53935  #F57C00  #FBC02D  #8ED657
#2E7D32  #1E88E5  #8E6BE8  #E47AD3
```

Las leyendas de gráficos deben mostrar el nombre de la categoría y no depender
únicamente del color.

## Encabezados de pantalla

Los encabezados principales y secundarios comparten una altura de `120` puntos.
Las descripciones se alinean a la izquierda y quedan centradas verticalmente
debajo de la fila del título.

## Tema claro y oscuro

Los dos temas están definidos en `src/styles/colors.js` dentro de `TEMAS.claro`
y `TEMAS.oscuro`. `crearEstilosGlobales(tema)` recibe uno de estos objetos y
genera el `StyleSheet` correspondiente.

Todas las pantallas leen el modo claro u oscuro del sistema y aplican el tema a
fondos, texto, encabezados, controles y navegación inferior. `app.json` declara
`userInterfaceStyle: "automatic"` y define fondos de splash para ambos modos.
`App.js` actualiza el fondo nativo y el estilo de los controles Android: usa
controles claros en tema oscuro y oscuros en tema claro. El Native Stack
comparte el fondo del tema para evitar destellos blancos durante las
transiciones.

En las rutas que muestran la barra inferior, `BottomTabBar.js` usa el fondo de
pantalla en el exterior de las esquinas superiores redondeadas y la superficie
del tema dentro de la barra y en su inset inferior. `AppNavigator.js` reconoce
la ruta superior `PRINCIPAL` y dibuja una capa no interactiva en el área segura
inferior de Android: usa la superficie cuando están las pestañas y el fondo
general en Inicio, Login, Registro y pantallas secundarias. El tamaño de esta
capa viene de `useSafeAreaInsets()`; no bloquea toques ni altera el contenido.
El plugin `expo-navigation-bar` declara `enforceContrast: false` para permitir
que la interfaz pinte esa zona sin un velo de contraste de Android.

### Tema claro

- Fondo general: `#F4F4F4`.
- Tarjetas y formularios: `#FFFFFF`.
- Texto principal: `#111111`.
- Texto secundario: `#686868`.
- Encabezado: `#024C42` con texto blanco.
- Acción principal: `#CCEB6C` con texto `#024C42`.
- Acción secundaria: `#296860` con texto `#CCEB6C`.

### Tema oscuro

- Fondo general: `#081C19`.
- Tarjetas y formularios: `#10322D`.
- Texto principal: `#FFFFFF`.
- Texto secundario: `#C5D1CF`.
- Bordes: `#557570`.
- Encabezado: `#024C42` con texto blanco.
- Acción principal: `#CCEB6C` con texto `#024C42`.
- Acción secundaria: `#296860` con texto `#CCEB6C`.

El tema oscuro conserva la jerarquía de marca y modifica fondos, superficies y
textos para mantener contraste.

## Tipografía

Se utiliza la fuente del sistema del dispositivo. No se carga una fuente
externa por ahora, aunque `expo-font` queda disponible para una decisión futura
si el diseño lo requiere.

Los valores tipográficos están definidos dentro de `src/styles/globalStyles.js`:

| Uso | Tamaño |
| --- | ---: |
| Título principal | `28` |
| Subtítulo | `22` |
| Encabezado | `18` |
| Texto normal | `16` |
| Texto secundario | `14` |
| Texto auxiliar | `12` |
| Monto | `24` |
| Botón | `16` |
| Etiqueta | `14` |

## Espaciado

Los valores están centralizados dentro de `src/styles/globalStyles.js`:

| Nombre | Valor |
| --- | ---: |
| Mínimo | `4` |
| Pequeño | `8` |
| Medio | `12` |
| Grande | `16` |
| Extra grande | `24` |
| Enorme | `32` |
| Padding de pantalla | `24` |
| Separación entre secciones | `24` |
| Separación de formularios | `16` |

## Bordes

Los radios y anchos están definidos dentro de `src/styles/globalStyles.js`:

| Elemento | Valor |
| --- | ---: |
| Radio pequeño | `8` |
| Campo | `10` |
| Botón | `12` |
| Tarjeta | `16` |
| Contenedor | `20` |
| Circular | `999` |
| Borde fino | `1` |
| Borde normal | `2` |

## Estilos globales disponibles

`src/styles/globalStyles.js` contiene estilos reutilizables para:

- pantallas y contenido;
- encabezados;
- títulos, subtítulos, texto, etiquetas y montos;
- tarjetas;
- botón principal, secundario, de texto y deshabilitado;
- campos de entrada normales, enfocados, con error y deshabilitados;
- mensajes de ayuda y error;
- separadores;
- iconos de detalle;
- navegación inferior y sección activa.

Los estilos globales son consumidos por las pantallas y componentes existentes.
Las reglas exclusivas de Login y Registro permanecen en `authStyles.js` para no
duplicar tokens globales ni mezclar sus layouts con los de otras pantallas.

## Criterios de accesibilidad

- El color no es la única forma de comunicar ingresos, egresos, errores o
  selección.
- Los movimientos deben incluir texto, signo, etiqueta o icono.
- Los controles interactivos deben mantener una zona táctil apropiada; la base
  utiliza como referencia `48` unidades para botones.
- Los textos principales deben conservar contraste suficiente con su fondo.
- Los estados de los campos de entrada deben comunicarse mediante borde y
  mensaje textual.
- Debe probarse el diseño con el escalado de texto del sistema.
- Los iconos deben acompañar una etiqueta cuando la acción no sea evidente.

## Verificación

- La pantalla inicial importa `crearEstilosGlobales()` y utiliza sus estilos sin
  copiar valores visuales.
- La pantalla inicial importa los estilos globales para comprobar que pueden
  reutilizarse desde una pantalla de Expo.
- Expo compila el bundle Android sin errores de importación.
- No se agregan archivos `.css`, `.ts` ni `.tsx`.
