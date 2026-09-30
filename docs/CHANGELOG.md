# Historial de cambios

Todos los cambios relevantes realizados en la aplicación AHRE y en su
documentación se registran en este archivo.

## [v0.4.0] - 2026-09-29 - no publicada

### Añadido

- Se implementó la capa local de persistencia SQLite con inicialización,
  versionado, esquema relacional y repositorios para las entidades del modelo.
  Las operaciones compuestas usan transacciones y no dependen de Internet ni
  de un backend. (#19)
- Los depósitos guardan el saldo vigente y permiten registrar conciliaciones
  manuales en un historial local. Los ingresos, egresos y transferencias
  actualizan los saldos afectados. (#19)
- La eliminación de ingresos y egresos conserva el movimiento original y crea
  una compensación enlazada; las transferencias se compensan con otra
  transferencia y sus movimientos asociados. (#19)

### Documentación

- Se documentaron el esquema SQLite, las relaciones, las transacciones, el
  acceso a los repositorios, la estrategia de saldos y las reglas de
  compensación. (#19)

## [v0.3.0] - 2026-09-26 - no estable

### Añadido

- Se incorporó el flujo visual de OCR con cámara en vivo, captura de fotos,
  selección desde la galería y ajuste del encuadre antes de adjuntar el
  comprobante al borrador del movimiento. (#17)
- Se agregó la revisión del total del ticket y el detalle editable de productos
  con cantidades, precios unitarios y subtotales; categoría, depósito, fecha y
  hora quedan para completar o confirmar manualmente. (#17)
- Se maquetó el formulario de creación de depósitos con saldo inicial, nombre,
  tipo, ícono, color y descripción. La creación continúa simulada y no persiste
  depósitos. (#9)
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
- Se maquetó el formulario de ingreso con monto, descripción, depósito,
  categoría, fecha, hora y recurrencia visual. (#11)
- Se incorporó el detalle de depósito con búsqueda y filtros locales por tipo,
  fecha, categorías y monto; los movimientos se agrupan por día y abren su
  pantalla de detalle. (#10)
- Se añadió la pantalla de Perfil con datos de cuenta simulados, selección y
  retiro de foto, edición de perfil y cambio de contraseña en flujos de
  demostración. (#16)
- Se agregaron opciones avanzadas futuras para Cuenta fantasma, Seguridad y
  Registro, visibles como apartados próximamente. (#16)

### Cambiado

- El botón «Tomar foto» queda debajo del visor de cámara. El usuario puede
  mover y ampliar la imagen antes de confirmar el recorte que se adjunta; se
  quitaron los contornos de color de los controles. (#17)
- El saldo inicial del depósito aparece primero y comparte la presentación
  destacada del monto de ingreso; el nombre queda debajo. (#9)
- Se asignó a los depósitos una paleta propia de cinco colores con selección
  marcada por un tick y un borde verde. El Dashboard muestra los íconos de los
  depósitos en grafito, independiente del color de cada depósito. (#9)
- Los colores de las categorías de Estadísticas mantienen tonos pastel en el
  tema claro y usan una variante más saturada en el tema oscuro, también en sus
  detalles.
- Se actualizaron las referencias visuales de depósitos en el Dashboard y se
  retiró el selector de colores adicionales del formulario. (#9)
- Se retiró la acción «Cancelar» del pie del formulario de ingreso; el regreso
  queda disponible desde la flecha del encabezado. (#11)
- Se actualizó Expo SDK de `57.0.24` a `57.0.25` y `expo-image-picker` de
  `57.0.19` a `57.0.20`. (#11)
- Se compactaron los encabezados principales y secundarios a 120 puntos, con
  descripciones alineadas a la izquierda y centradas verticalmente.
- Se ajustaron los gráficos para cambiar entre ellos con deslizamiento
  horizontal, elegir fechas con calendario y recorrer las categorías debajo
  del gráfico de columnas. (#14)
- Se unificó el estilo y el comportamiento secundario de las pantallas de
  detalle de categoría y movimiento. (#14)
- Se reorganizó el historial de movimientos con filas de categoría y
  descripción, metadatos de hora y depósito, y filtros en una hoja superpuesta
  con selección adaptable de fechas, depósitos y categorías. (#13)
- Los movimientos recientes del Dashboard adoptaron la presentación del
  historial y se agrupan por día con rótulos «Hoy», «Ayer» y fechas anteriores.
  (#13)
- Se ubicó el acceso a opciones del depósito arriba a la derecha y se renovaron
  los modales de opciones, edición y eliminación. La edición reutiliza los
  controles del formulario de creación sin saldo inicial. (#10)
- El Perfil organiza sus datos en una tarjeta compacta, incluye la fecha de
  registro y ubica Cerrar sesión al final de la pantalla. (#16)
- La apariencia clara, oscura o del sistema se puede elegir desde Perfil y se
  aplica en toda la aplicación durante la sesión; no se persiste al reiniciar.
  (#16)
- Se ajustaron los avisos simulados de Notificaciones a tres tarjetas y se
  agruparon por día; el último aviso conserva espacio para mostrarse completo.
  (#15)

### Corregido

- Se corrigieron las coordenadas de origen que impedían confirmar el recorte de
  la imagen del comprobante. (#17)

### Documentación

- Se documentaron el flujo OCR y las dependencias `expo-camera` y
  `expo-image-manipulator`; el proyecto queda registrado con 29 dependencias
  directas. (#17)
- Se documentaron el formulario de depósitos, su paleta y la presentación de
  sus íconos; también se actualizaron las guías de Estadísticas y del sistema
  visual. (#9)
- Se actualizaron las guías de navegación y sistema visual para describir el
  tamaño y la alineación de los encabezados.
- Se documentó el formulario y las categorías de movimientos en
  `docs/interfaces/movimientos.md`. (#12)
- Se documentaron los controles, períodos, filtros, interacciones y el modelo
  de datos de las pantallas de Estadísticas en
  `docs/interfaces/estadisticas.md`; también se actualizó la navegación. (#14)
- Se actualizaron las guías de Movimientos y Dashboard para describir las filas,
  el agrupamiento por día y el comportamiento de los filtros. (#13)
- Se actualizaron el README, la interfaz de movimientos y las versiones de
  Expo en la documentación de dependencias para reflejar el formulario de
  ingreso y Expo SDK `57.0.25`. (#11)
- Se documentaron el detalle del depósito, sus filtros y la edición y
  eliminación simuladas. (#10)
- Se actualizaron el README y las guías de Perfil, navegación, arquitectura y
  sistema visual para describir las opciones del perfil y sus límites actuales.
  (#16)
- Se documentaron los tres avisos simulados de Notificaciones, su agrupación
  por día y el espacio de desplazamiento para el área segura inferior. (#15)

### Alcance pendiente

- El formulario de depósitos valida los campos y simula la creación, pero aún
  no persiste depósitos. (#9)
- El formulario de egreso valida los campos y simula el guardado, pero todavía
  no persiste los movimientos.
- El formulario de ingreso representa los campos y simula el guardado, pero
  todavía no persiste los movimientos ni ejecuta recurrencias. (#11)
- Las estadísticas y sus detalles todavía utilizan datos de muestra y no
  consultan SQLite. (#14)
- La edición y eliminación de depósitos aún no guardan cambios ni ejecutan la
  operación. (#10)
- La edición de perfil, los cambios de contraseña, el idioma, las notificaciones
  y la foto funcionan solo como demostraciones locales; no hay autenticación ni
  persistencia de cuenta. Cerrar sesión no revoca una sesión real. (#16)
- Cuenta fantasma, Seguridad y Registro son apartados desactivados para una
  implementación futura. (#16)
- El reconocimiento OCR y la confirmación del egreso siguen simulados; el
  comprobante recortado se conserva en caché y no se guarda de forma permanente
  con el movimiento. (#17)

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
