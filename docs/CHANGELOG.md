# Historial de cambios

Todos los cambios relevantes realizados en la aplicación AHRE y en su
documentación se registran en este archivo.

## [v0.3.0] - 2026-09-25 - no publicada

### Añadido

- Se maquetó el formulario de egreso con monto, descripción, depósito,
  categorías y controles interactivos de fecha y hora. (#12)
- Se agregó la opción de marcar un egreso como recurrente y elegir una
  frecuencia diaria, semanal, mensual o anual. (#12)
- Se definieron categorías preestablecidas para ingresos y egresos. (#12)
- Se completó el panel de Estadísticas con gráficos de distribución por
  categoría y de columnas, filtros por tipo y categoría, selección de períodos
  y exploración de valores al tocar o deslizar sobre los gráficos. (#14)
- Se agregaron los detalles secundarios de categoría y movimiento, agrupación
  visual de movimientos por fecha y datos de detalle compatibles con el esquema
  documentado. (#14)

### Cambiado

- Se compactaron los encabezados principales y secundarios a 120 puntos, con
  descripciones alineadas a la izquierda y centradas verticalmente.
- Se ajustaron los gráficos para cambiar entre ellos con deslizamiento
  horizontal, elegir fechas con calendario y recorrer las categorías debajo
  del gráfico de columnas. (#14)
- Se unificó el estilo y el comportamiento secundario de las pantallas de
  detalle de categoría y movimiento. (#14)

### Documentación

- Se actualizaron las guías de navegación y sistema visual para describir el
  tamaño y la alineación de los encabezados.
- Se documentó el formulario y las categorías de movimientos en
  `docs/interfaces/movimientos.md`. (#12)
- Se documentaron los controles, períodos, filtros, interacciones y el modelo
  de datos de las pantallas de Estadísticas en
  `docs/interfaces/estadisticas.md`; también se actualizó la navegación. (#14)

### Alcance pendiente

- El formulario de egreso valida los campos y simula el guardado, pero todavía
  no persiste los movimientos.
- Las estadísticas y sus detalles todavía utilizan datos de muestra y no
  consultan SQLite. (#14)

## [v0.2.0] - 2026-09-24 - no estable

### Añadido

- Se maquetó el Dashboard principal con balance, acciones rápidas, depósitos
  simulados con tipo y descripción, y movimientos recientes. (#8)
- Se maquetaron Login y Registro con identidad de AHRE, campos de nombre,
  correo, contraseña y confirmación, placeholders, controles para mostrar u
  ocultar contraseña y navegación visual entre pantallas.
- Se agregaron componentes reutilizables para contenedor de autenticación,
  campos, contraseña, botón principal y mensaje de error.
- Se agregaron estados visuales de campo normal, enfocado, completado, error y
  deshabilitado, además de soporte de carga y error general en los componentes.
- Se agregó el switch animado «Recordarme», el texto de recuperación de
  contraseña, el aviso legal de una línea y el copyright con año dinámico.

### Cambiado

- Se reemplazó la acción rápida de depósito por OCR, se tituló la tarjeta como
  «Balance» y se aplicaron los colores de estado a ingresos y egresos. (#8)
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
- Los botones de Login y Registro prueban el flujo visual Login → Dashboard y
  Registro → Login sin autenticar, crear usuarios ni guardar sesión.
- Las pantallas existentes siguen el tema claro u oscuro del sistema. La barra
  inferior y la zona de controles del sistema Android usan colores acordes al
  tema y a la ruta activa; fuera de esas pestañas se usa el fondo de pantalla.
- Se ajustaron el contraste de los botones de autenticación, el peso de su texto,
  los bordes y placeholders de inputs y la sombra del botón central «Nuevo».

### Documentación

- Se documentó la interfaz del Dashboard y se actualizó el README con su estado
  y alcance actuales. (#8)
- Se documentó la pantalla inicial en `docs/interfaces/inicio.md`.
- Se ampliaron la documentación de autenticación, navegación, tema visual,
  pantalla inicial, estructura de carpetas y dependencias.

### Verificación

- Expo generó correctamente el bundle de Android tras los ajustes del fondo y
  del deslizador de Inicio.
- Se comprobó que la bienvenida abre Login sin consultar la red ni validar una
  sesión; Login muestra el Dashboard como destino visual sin validar una sesión.

### Alcance pendiente

- No hay autenticación, registro real, recuperación de contraseña, aceptación
  persistida de términos, validación, envío a servicios, persistencia de
  sesión ni lógica de negocio en Login o Registro.
- Los errores y la carga están preparados en los componentes, pero las
  pantallas no los activan por ahora.

## [v0.1.0] - 2026-09-20 - no estable

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
