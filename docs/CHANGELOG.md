# Historial de cambios

Todos los cambios relevantes realizados en la aplicación AHRE y en su
documentación se registran en este archivo.

## [v0.1.0] - 2026-09-20 - no publicada

### Añadido

- Se definió la estructura base de la aplicación móvil con Expo y React
  Native.
- Se separaron las áreas de pantallas, componentes, navegación, almacenamiento
  local, servicios, constantes y utilidades.
- Se agregó la documentación de arquitectura en
  `docs/arquitectura/estructura-app.md`.
- Se agregó la documentación del flujo de trabajo con Issues, ramas y Pull
  Requests.
- Se agregó el README general del proyecto.
- Se incorporó la documentación de dependencias en
  `docs/configuracion/dependencias.md`.
- Se agregaron dependencias base para navegación, almacenamiento local,
  seguridad, formularios, validación, fechas, imágenes, tipografías, íconos,
  animaciones y configuración del entorno.
- Se agregó la documentación del modelo de datos local en
  `docs/base-de-datos/base-datos-local.md`.
- Se documentaron depósitos, movimientos, transferencias, deudas, pagos y
  gastos compartidos.
- Se creó la carpeta `src/styles/` para centralizar la base visual de AHRE.
- Se agregó la documentación del sistema visual en
  `docs/interfaces/sistema-visual.md`.
- Se agregó la documentación de la estructura de navegación en
  `docs/arquitectura/navegacion.md`.
- Se incorporaron las pantallas base de Inicio, Login, Registro, Dashboard,
  Movimientos, Nuevo, Estadísticas, Social y las pantallas secundarias.

### Cambiado

- Se mantuvo el proyecto utilizando JavaScript y archivos `.js`.
- Se conservó `app.json` como única fuente de configuración de Expo.
- Se dejó una pantalla inicial mínima para verificar la conexión entre las
  capas de la aplicación.
- Se actualizaron `package.json` y `package-lock.json` con las dependencias
  aprobadas y compatibles con Expo SDK 57.
- Se agregaron en `app.json` los plugins necesarios para algunas dependencias
  nativas de Expo.
- Se definieron las categorías como valores predefinidos del campo `categoria`
  de los movimientos, sin crear una tabla independiente.
- Se ajustó el nombre visible de la aplicación a `AHRE`.
- Se definieron la paleta de colores, los temas claro y oscuro, la tipografía,
  el espaciado, los bordes y los estilos globales mediante `StyleSheet` de
  React Native en `src/styles/colors.js` y `src/styles/globalStyles.js`.
- Se configuró la navegación inferior con las secciones Inicio, Movimientos,
  Nuevo, Estadísticas y Social.
- Se configuró la navegación secundaria mediante `Native Stack`, con un
  encabezado verde reutilizable y una flecha de regreso para las pantallas que
  se abren desde Dashboard o Nuevo.
- Se dejó Inicio, Login y Registro sin encabezado verde ni navbar interno, con
  fondo claro y status bar acorde al diseño.
- Se ajustó el navbar inferior para ocupar el ancho de la pantalla, mantener
  el fondo blanco, usar íconos compactos y quedar ligeramente separado de los
  botones del sistema.
- Se configuró `expo-system-ui` y `expo-navigation-bar` para que la zona de
  navegación del sistema Android use el fondo gris claro de las pantallas sin
  navbar interno.
- Se unificó el tamaño del header en las pantallas principales y secundarias y
  se agregó el logo de AHRE con fondo transparente en `assets/ahre-logo.png`.
- Se agregó `assets/ahre-mark.png` sin el nombre inferior para utilizarlo como
  ícono principal de la aplicación y como foreground del ícono adaptativo de
  Android.
- Se configuró `assets/ahre-logo.png` como imagen de carga de Expo y se amplió
  su representación en el header del Dashboard.
- Se extendió el formato del header a Movimientos, Estadísticas y Social, con
  sus títulos, accesos a notificaciones y perfil y descripciones breves.
- Se igualó el tamaño de los títulos de esos headers con el de las pantallas
  secundarias y se aumentó el tamaño de las descripciones.
- Se renombró `DashboardHeader.js` a `MainHeader.js` y se definió el formato de
  `SectionHeader.js` con título junto a la flecha y descripción inferior.
- Se retiró el logo del header secundario y se dejaron las descripciones
  alineadas a la izquierda y centradas verticalmente en el espacio inferior.
- Se diferenció el header del Dashboard, incorporando el saludo y accesos a
  notificaciones y perfil, mientras que las pantallas secundarias mantienen el
  formato con flecha de regreso.
- Se reemplazó la pantalla de ejemplo `HomeScreen` por `InicioScreen` como
  punto de entrada del flujo de acceso.
- Se maquetó `InicioScreen` como bienvenida de AHRE con el símbolo de la marca,
  el nombre en dos líneas y un fondo claro sin luces circulares.
- Se ajustó el tamaño del logo y del nombre de AHRE para adaptarse al espacio
  disponible y respetar las áreas seguras.
- Se reemplazó el botón circular por un deslizador de ancho completo, con una
  manija de esquinas redondeadas, un chevrón hacia la derecha y el texto
  centrado en la pista.
- El relleno del deslizador mantiene un segmento fijo que acompaña a la manija
  y deja una estela continua del mismo color; al completar el recorrido, toda
  la pista queda rellena. El mensaje «Iniciando AHRE…» se muestra en blanco.
- La bienvenida avanza a Login al completar el deslizador; la comprobación de
  sesión queda para un Issue futuro.
- Se configuró la pantalla nativa de carga para acompañar los temas claro y
  oscuro.
- Se agregó la documentación de la pantalla en `docs/interfaces/inicio.md`.

### Verificación

- Expo inició correctamente el proyecto.
- Metro generó correctamente el paquete para Android.
- `expo-doctor` completó correctamente sus 21 comprobaciones.
- La instalación de dependencias no presentó paquetes faltantes o inválidos.
- El modelo local contempla el registro manual de deudas, pagos, transferencias
  entre depósitos y gastos compartidos pagados por el usuario actual.
- No se encontraron archivos TypeScript.
- El bundle de Android compiló correctamente después de agregar los estilos
  globales.
- Expo compiló correctamente después de incorporar la navegación por pestañas,
  las rutas secundarias y los ajustes visuales del navbar.
- Se comprobó que la bienvenida permite abrir Login sin consultar la red ni
  validar una sesión; la decisión entre Login y Dashboard queda pendiente.
- Expo generó correctamente el bundle de Android tras los ajustes finales del
  fondo y del deslizador de Inicio.
- Se comprobó que las pantallas principales y secundarias puedan cargarse sin
  errores de navegación.
- No se detectaron errores de formato en los cambios realizados.

### Estado

- La estructura base quedó preparada para incorporar las funcionalidades de
  AHRE.
- La base de dependencias quedó preparada para comenzar los módulos iniciales
  de la aplicación.
- NPM informó 11 vulnerabilidades moderadas. No se ejecutó una corrección
  automática para evitar cambios de versión no revisados.
- La aplicación continúa en desarrollo y esta versión no es estable ni
  comercial.

## Regla de actualización

Cuando un Issue se considera terminado, el revisor del Pull Request debe
actualizar este archivo antes de realizar el merge o como parte del cierre del
trabajo. La persona que implementa el Issue no debe modificar el historial de
cambios dentro de su rama, salvo que el revisor se lo solicite expresamente.
