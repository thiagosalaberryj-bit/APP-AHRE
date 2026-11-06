# Sistema visual de AHRE

## Objetivo

Este documento registra los tokens visuales y temas compartidos de AHRE. La
aplicación está preparada para Expo y React Native utilizando TypeScript y
`StyleSheet`.

React Native no utiliza archivos CSS web. Por eso los estilos se organizan en
archivos `.ts` dentro de `src/styles/`. Las pantallas podrán combinar estos
estilos globales con estilos locales de layout cuando sea necesario.

Los estilos globales se combinan con layouts locales cuando una interfaz lo
necesita. Por ejemplo, Login y Registro consumen los temas globales y agregan
`src/styles/authStyles.ts` para sus distribuciones particulares.

## Organización

Los filtros y las tarjetas seleccionables de los formularios destacan la
selección mediante relleno, conservando dimensiones, rellenos internos,
grosor de borde y peso tipográfico. El color del texto e icono puede cambiar
para mantener contraste, sin desplazar los controles vecinos.

Los filtros rápidos y activos de Movimientos, Estadísticas y el historial de
deudas usan `MovementSearchFiltersStyles.ts`: altura mínima de 38 puntos,
radio de 5, texto de 14 con peso medio y los mismos colores de selección.

Las cards de movimientos y deudas comparten la base
`FinancialRecordCardStyles.ts`: título de 16 con seminegrita, importe de 16
en negrita y texto secundario de 12 regular. Comparten rellenos, bordes,
ícono de 32 puntos y franja de importe de 112. Ingreso y «Te debe» usan el
verde de éxito; Egreso y «Le debés» usan el rojo de error del tema. Los montos
usan el texto principal y los metadatos el secundario en ambos tipos de card.

Todos los importes editables usan `EntradaMonto` (`src/components/MoneyInput.tsx`):
ingresos, egresos, total OCR, saldo inicial de depósitos, límites de filtros y
los importes de Social (deudas, pagos, gastos y repartos manuales). La variante
compacta permite conservar el espacio de filas y filtros sin duplicar inputs.
El contenedor mantiene el fondo de superficie del tema (blanco en tema claro).

Mientras se escribe, los miles se separan con puntos y los decimales con coma:
`1234567,50` se muestra como `1.234.567,50`. El componente entrega al formulario
texto local sin puntos de miles; las validaciones y la persistencia conservan
sus conversiones existentes. La presentación conserva la coma final, ceros
decimales y precisión del texto; admite dos decimales. El punto decimal de un
teclado se convierte en coma. Se puede pegar un monto local con símbolo `$`,
editar en medio, borrar y limpiar sin que los puntos automáticos traben el cursor.
La lógica de texto vive en `src/utils/moneyInput.ts` y los estilos compactos en
`src/styles/MoneyInputStyles.ts`.

Los campos con límite de caracteres muestran `actual/máximo` en la misma fila
que su etiqueta, alineado a la derecha, sin reservar otra fila debajo del input.
Los estilos compartidos `encabezadoCampo`, `etiquetaCampo` y `contadorCampo` de
`globalStyles.ts` permiten aplicar esta disposición en formularios y modales.
Los límites y las validaciones existentes se conservan, incluido el tratamiento
de descripciones OCR que superan el máximo y deben resumirse antes de guardar.

El contenido principal de todas las pantallas usa el mismo margen lateral que
Inicio/Dashboard: **12 puntos por lado**, definido por
`MARGEN_LATERAL_PANTALLA` en `src/styles/globalStyles.ts`. El ancho disponible
es el de la pantalla menos 24 puntos, también en pantallas anchas; los
contenedores principales no agregan límites de 480 o 560 puntos.

Esta regla se aplica a listas, formularios, detalles, Perfil, Sincronización,
Estadísticas, OCR, autenticación, bienvenida y todas las vistas de Social.
Los espaciados verticales y el relleno interno de tarjetas, campos, encabezados
y diálogos conservan sus propios tokens. Los carruseles y controles que calculan
su ancho desde la ventana descuentan el mismo margen lateral compartido.

```text
src/
└── styles/
    ├── HomeScreenStyles.ts # Estilos propios de la pantalla de inicio
    ├── authStyles.ts    # Layout y detalles visuales de Login y Registro
    ├── colors.ts        # Paleta, estados y temas
    └── globalStyles.ts  # StyleSheet, tipografía, espaciado y bordes
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
| Verde brillante | `#D7FF00` | Relleno de la barra de progreso de inicio |
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

### Notificaciones superiores

Las notificaciones superiores conservan la misma tarjeta verde oscuro en los
temas claro y oscuro. `COLORES_NOTIFICACIONES` centraliza el fondo, los textos,
la barra de tiempo y el color del icono según el tipo de aviso. Los errores usan
rosa claro, los éxitos verde claro y la información azul claro; el tipo también
se comunica con un icono distinto.

| Tipo | Color del icono | Valor |
| --- | --- | --- |
| Error | Rosa claro | `#FF8A80` |
| Éxito | Verde claro de marca | `#CCEB6C` |
| Información | Azul claro | `#89BCF4` |

El texto, el botón de cierre y el progreso usan blanco; la base de la barra usa
blanco con `22%` de opacidad. El componente no define colores aparte: consume
los tokens de `src/styles/colors.ts`.
La API y los casos de uso compartidos se describen en
[`docs/funcionalidades/notificaciones-toast.md`](../funcionalidades/notificaciones-toast.md).

### Colores para depósitos

Estos colores sirven para identificar visualmente un depósito y no representan
su tipo ni su estado.

`COLOR_DEPOSITO_PREDETERMINADO` usa el azul suave `#C3D1E3`, que también forma
parte de esta paleta.
Los íconos de depósitos usan el grafito `COLOR_ICONO_DEPOSITO` (`#263238`) para
separar su tono del color seleccionado para el depósito.

```text
#BED5C8  #C3D1E3  #CEC0E1  #EDB8BC  #F6DB9F
```

### Colores para gráficos

La paleta de categorías utiliza tonos pastel en el tema claro y una variante
ligeramente más saturada de esos tonos en el tema oscuro. Se reutiliza en
Estadísticas, los selectores de categorías y sus detalles.

```text
#F5B3B2  #FBCD9E  #FDE7AF  #D4EFBF
#8EB38F  #89BCF4  #B7ACF6  #E9AAEF
```

En modo oscuro se usan `#F58D8B`, `#F8B878`, `#F9D879`, `#BBE991`,
`#84C889`, `#75B2F3`, `#A596F4` y `#E58FEF`.

Las leyendas de gráficos deben mostrar el nombre de la categoría y no depender
únicamente del color.

## Encabezados de pantalla

Los encabezados principales y secundarios comparten una altura de `120` puntos.
Las descripciones se alinean a la izquierda y quedan centradas verticalmente
debajo de la fila del título.

## Tema claro y oscuro

Los dos temas están definidos en `src/styles/colors.ts` dentro de `TEMAS.claro`
y `TEMAS.oscuro`. `crearEstilosGlobales(tema)` recibe uno de estos objetos y
genera el `StyleSheet` correspondiente.

Todas las pantallas consumen la preferencia de apariencia compartida por AHRE.
`Modo del sistema` sigue el modo claro u oscuro del dispositivo; `Modo claro` y
`Modo oscuro` aplican el tema elegido a fondos, texto, encabezados, controles y
navegación inferior. Si SecureStore conserva el identificador recordado, AHRE
lee la apariencia de ese usuario desde SQLite antes de mostrar Inicio, sin
validar la sesión en ese momento. Sin una sesión recordada, se usa el modo del
dispositivo. `app.json` declara
`userInterfaceStyle: "automatic"` y define fondos de splash para ambos modos.
`App.tsx` actualiza el fondo nativo y el contraste de los controles Android según
el tema activo. `AppNavigator.tsx` aplica los mismos colores al tema de React
Navigation. El Native Stack comparte el fondo del tema para evitar destellos
blancos durante las transiciones.

En las rutas que muestran la barra inferior, `BottomTabBar.tsx` usa el fondo de
pantalla en el exterior de las esquinas superiores redondeadas y la superficie
del tema dentro de la barra y en su inset inferior. `AppNavigator.tsx` reconoce
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

Los valores tipográficos están definidos dentro de `src/styles/globalStyles.ts`:

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

Los valores están centralizados dentro de `src/styles/globalStyles.ts`:

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

Los radios y anchos están definidos dentro de `src/styles/globalStyles.ts`:

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

`src/styles/globalStyles.ts` contiene estilos reutilizables para:

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
Las reglas exclusivas de Login y Registro permanecen en `authStyles.ts` para no
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
- Los estilos permanecen en archivos `.ts` y los componentes con JSX en `.tsx`; no se usa CSS web.

### Selector compartido de depósitos

Ingreso, Egreso, OCR, filtros de Movimientos y Estadísticas y formularios de
Social usan exclusivamente `src/components/DepositSelector.tsx`. Sus estilos
propios están en `src/styles/DepositSelectorStyles.ts`, con ambos temas. El
campo conserva el aspecto de los formularios: altura mínima de 64 puntos,
radio de 10 puntos, nombre de 16 puntos y dato secundario de 14. Muestra el
ícono real del depósito sin recuadro de color, como los otros campos, con borde neutro fino y verde
al abrir. La lista flotante se ancla
al control, tiene scroll limitado, esquinas recortadas y selección por relleno.
Se coloca debajo del borde inferior del campo, con altura limitada y scroll.
La selección individual cierra al elegir; la múltiple permite marcar varias,
seleccionar Todos y cerrar con Listo. `impedirSeleccionVacia` conserva la
restricción del último depósito de los filtros. Ya no se usa una lista inline
ni el cuadro centrado anterior; la presentación está definida en el componente,
sin depender de los estilos específicos de cada formulario.

Los modales de selección de categorías, depósito, fecha, hora y personas
conservan el comportamiento edge-to-edge de Android mediante
`statusBarTranslucent` y `navigationBarTranslucent`, evitando que la ventana
del selector imponga otro fondo a la barra de navegación del sistema. El
desplegable de depósitos espera `keyboardDidHide` antes de abrir si había
teclado visible y no presenta la lista hasta medirla con la ventana abierta.

El anclaje del depósito usa `measure` con `pageX/pageY` y la altura completa
del campo. Las dimensiones disponibles provienen de `onLayout` de la capa
flotante; no se resta el origen de otra ventana medido con `measureInWindow`.
La lista no se reposiciona arriba al abrir, evitando que tape parte del campo.
