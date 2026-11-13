# Historial de cambios

Todos los cambios relevantes realizados en la aplicación AHRE y en su
documentación se registran en este archivo.

## [Sin publicar]

## [v0.9.0] - 2026-11-13 - no estable

### Añadido

- Campana con contador de avisos no vistos, tarjetas plegables con iconos por
  tipo, agrupación por fecha y ejemplos de los nueve tipos en datos de prueba.
- Historial combinado local/servidor paginado de diez en diez, con copia offline.
- Acceso a Alarmas y recordatorios de Android para habilitar horarios precisos,
  con consulta del permiso real y alternativa compatible en Expo Go.

- Historial persistente de notificaciones, preferencias por tipo, recordatorios
  locales sin conexión y destinos a deudas, salas, depósitos y movimientos.
- Vinculación OAuth de un depósito con Mercado Pago y revisión de pagos Search:
  categorías propuestas, selección múltiple, ignorados recuperables, asociación
  a registros existentes y registro offline sin duplicar el saldo.
- Descripción editable desde la card, conservada como borrador local y utilizada
  al registrar. El dato original del proveedor se conserva para comparación.
- Indicadores de pendientes, historial de consultas en modal y seguimiento
  WebSocket solo mientras una consulta esté en curso.
- Avisos persistentes al finalizar búsquedas/identificación y ante fallos definitivos.

### Corregido

- Resolución al completar acciones y repetición diaria de deudas con saldo,
  salas y recurrencias pendientes dentro del horizonte de 60 días.
- Recurrencias anticipadas conservan la ocurrencia a confirmar; pagar parcialmente
  una deuda no la resuelve y los avisos informativos no crean tareas atrasadas.
- Ajustes de notificaciones con scroll independiente, X fija y selector de hora;
  el acceso para solicitar permisos se oculta si ya están concedidos.
- Perfil mantiene el interruptor de AHRE cuando Android permite avisos y usa
  una flecha solo si los bloquea. Apagar conserva los tipos y horarios elegidos.
- Guardar espera la programación nativa sin depender del backend; serializa los
  cambios, conserva alarmas retrasadas pendientes y recupera programaciones perdidas.
- El formulario conserva su distribución mientras guarda y bloquea sus controles;
  se retiró el botón temporal de prueba de diez segundos.
- Las entregas al cambiar horario tienen identidades distintas, aunque el aviso
  anterior siga pendiente. El historial incorpora los avisos previstos vencidos;
  no los presenta como recibos de entrega física del teléfono.
- Plegado del header sin rebotes, accesos compactos al terminar la transición y
  recorte inferior redondeado durante toda la animación.
- Pendientes de salas coincidentes entre listado y detalle demo desde la primera
  entrada offline; diagnóstico persistente para errores SQLite de datos de prueba.

- Identificación de ingresos/egresos con detalle y filtros de Mercado Pago,
  actualización de pagos antiguos sin consumir búsquedas y tratamiento de importe cero.
- Registro bloqueado visualmente con explicación al tocar; errores en diálogo
  central y aviso fijo junto a las acciones, sin depender del desplazamiento.
- Etiqueta «Próxima búsqueda automática» y usos disponibles centrados en el botón.
- Revisión de Mercado Pago con barra compacta de selección y acciones en modal,
  sin el bloque inferior que tapaba los movimientos.

### Entrega

- App 0.9.0, Android versionCode 14; requiere backend coordinado 0.3.0.
- TypeScript correcto. Revisión previa al merge: 512 pruebas de app y 101 del
  backend aprobadas, cero fallos y cero omisiones, con MySQL 8.4.3 temporal aislado.
- El usuario confirmó la entrega de recordatorios en Android. Queda ampliar
  la comprobación física a todos los tipos, reinicios y modelos de teléfono.
- Expo Go conserva revisión y registro offline; push remoto requiere APK y FCM v1.
- Rendimientos de la billetera y tratamiento específico de transferencias propias
  siguen fuera de esta entrega. Search no representa un extracto completo.


### Cambiado

- Encabezados fuera del desplazamiento en todas las pantallas que los usan,
  con plegado automático al bajar, controles para desplegar y volver arriba,
  animación y soporte de reducir movimiento.
- Barra compacta del mismo color del encabezado, con íconos de sincronización,
  notificaciones y perfil sin fondos individuales, conservando acciones y estados.
- Inicio describe su contenido como «Tu balance, depósitos y movimientos.».
- Social elimina los botones Cancelar de Nueva persona y de la confirmación
  para quitar integrantes, y el regreso duplicado «Volver a integrantes» del
  historial. Se conservan los cierres y el regreso del encabezado.

- Filtros y accesos rápidos compartidos entre Movimientos y Detalle de depósito.
- Campos y selector de íconos compartidos entre creación y edición de depósitos.
- Marco común de los siete modales de Perfil y lista común de idioma/apariencia.
- Gráficos y controles de fecha de Estadísticas separados de la pantalla;
  cálculos y formatos de presentación organizados en un módulo propio.
- Detalle de depósito reutiliza el filtrado, orden y agrupación mensual cuando
  no cambian los datos ni los criterios. Su buscador aplica una pausa de 250 ms
  y limpia inmediatamente la búsqueda, también en Recurrentes.

### Verificación

- El 13 de noviembre se revisaron conflictos y archivos versionados antes del
  merge autorizado. Las suites completas usaron SQLite y MySQL aislados;
  no se accedió a datos de producción. Credenciales, APK y compilados quedan
  fuera del árbol versionado; se conservan fuentes, módulos, tests y lockfiles.
- Encabezados y ajustes de Social: tipos correctos y suite local con 399 pruebas
  aprobadas, cero fallos y 39 integraciones MySQL omitidas. Se comprueban los
  controles compactos en ambos temas y el regreso del historial por el encabezado.
  No se repitió MySQL para estos cambios de presentación.
- Tipos y comprobación de declaraciones sin uso aprobados. Suite completa
  con MySQL 8.4.3 temporal de Laragon: 395 pruebas de app y 60 de backend
  aprobadas, cero fallos y cero omisiones. Las 39 integraciones anteriormente
  omitidas quedaron ejecutadas. Cero bases temporales restantes; instancia
  detenida, puerto cerrado y carpeta de datos de prueba eliminada.
- Pruebas de callbacks, selección, fechas, temas, cancelación de búsquedas y
  reutilización de cálculos; escenario adicional con 10.000 movimientos.
- La persona usuaria indicó que los recorridos revisados se ven y funcionan
  igual. No se midieron tamaño del APK ni tiempos de respuesta nativos.

## [v0.8.0] - 2026-11-08 - no estable

### Añadido

- Salas compartidas en tiempo real con caché SQLite, edición offline, comandos
  idempotentes, control de versiones y recuperación HTTP de eventos WebSocket.
- Acceso global con contraseña y QR, aprobación de ingresos, vínculos por correo
  y continuidad de identidad entre invitado web y cuenta propia.
- Acuerdos online con aceptación, historial de pagos informados/confirmados/
  rechazados y perdón sin crear dinero. Cada cuenta utiliza depósitos propios.
- Recurrencias con aceptación manual desde depósitos, pendientes por fecha y
  registros únicos. La tarea automática heredada se desregistra y su callback
  conservado no genera movimientos financieros.
- Demos sociales interactivas para creador y participante, restringidas a la
  cuenta local de desarrollo; no usan el servidor ni se habilitan en release.
- Iconos de estado en el historial de deudas para pagos pendientes, confirmados,
  rechazados y anulados, perdón y movimientos por incorporar, en ambos temas.

### Cambiado

- Categoría por gasto, cierre con obligaciones compartidas e incorporación
  financiera independiente por cuenta, sin duplicar la compra del pagador.
- Detalles, filtros, formularios e historial social reutilizan componentes y
  estilos locales, con solicitudes por persona y soporte de ambos temas.
- Eliminar movimientos conserva original y corrección vinculada, excluye ambos
  de estadísticas y mantiene los acuerdos sociales sin cambios automáticos.
- Menos descargas y escrituras sin novedades; reconciliación al reanudar y
  comprobaciones transaccionales para evitar propuestas cruzadas duplicadas.
- Inicio de Social sin límite de tarjetas: muestra todas las salas abiertas y las
  cerradas con movimientos propios por registrar. Las tarjetas muestran el
  contador, que descuenta incorporaciones locales sin esperar la sincronización.
  Al completar los registros, las cerradas permanecen en Ver todas las salas.
- Versión 0.8.0 y código Android 13; documentación vigente separada de antecedentes.

### Corregido

- Recuperación inicial de cuentas, serialización SQLite y diagnóstico de bloqueos.
- Publicación con depósitos/movimientos preparados y reintentos sin duplicados.
- Aceptación independiente de avisos de pago y rechazo de cambios económicos.
- Cierre del modal durante guardados y consistencia de partes/balances web.
- Retirada de imports y estilos sin referencias.
- Pendientes de incorporación visibles por sala/gasto, bloqueo inmediato de envíos
  y cancelación durante operaciones, carga solo en el botón elegido, propuestas
  rechazadas ocultas al destinatario y origen de deuda sin adelanto duplicado.
- Etiquetas y filtros Saldada/Perdonada separados; Cerrada reservado a salas.

### Verificación

- 349 pruebas de app y 60 de backend aprobadas, cero fallos y cero omisiones,
  con SQLite real, MySQL temporal aislado, HTTP y WebSocket. TypeScript correcto.
- Tras los ajustes de iconos y visibilidad de salas: 127 pruebas sociales
  aprobadas, incluidas las nuevas comprobaciones en ambos temas, y TypeScript
  correcto. Esta verificación específica complementa la ejecución conjunta anterior.
- Pendiente: revisión en dispositivos, enlaces/QR, WSS detrás del proxy real y
  aceptación manual sin red y navegación nativa. Preparar una build no acredita esas pruebas.

## [v0.7.0] - 2026-11-05 - no estable

### Añadido

- Agrupaciones mensuales plegables en pendientes de sincronización,
  Movimientos e historial de depósitos, reutilizando el mismo encabezado.
- Fecha y hora local de los pendientes y última sincronización exitosa por cuenta.
- Filtros rápidos acumulativos por familias de categorías y rangos de importe
  en Movimientos y Estadísticas, con criterios visibles que se pueden quitar.
- Campo monetario compartido con separadores de miles al escribir y soporte
  de decimales, pegado y edición del texto.
- Comparación del balance general con el cierre del mes anterior, calculada
  con movimientos y ajustes locales y respetando la privacidad del saldo.
- Consulta del importe completo de movimientos y depósitos mediante un modal.

### Cambiado

- Unificación de márgenes, tipografías, bordes y tamaños en claro y oscuro.
  Cards de movimientos y deudas comparten su base visual, colores semánticos
  y franja de importe; los depósitos conservan una presentación diferenciada.
- Rediseño de Sincronización, Estadísticas y detalles de movimiento, depósito
  y categoría. Inicio y Social comparten las proporciones de sus resúmenes.
- Categorías organizadas por familias cromáticas y variaciones de tono,
  con contraste específico en oscuro y prioridad de categorías frecuentes.
- Cards de categorías con relleno uniforme intermedio y mayor saturación en
  claro, con íconos más contrastados. Los colores de los gráficos se conservan.
  Salas muestra las categorías frecuentes en el mismo orden que Egresos.
- Filtros de Estadísticas, Movimientos e Historial de deudas con el mismo estilo.
- Selectores de depósito compartidos y desplegables flotantes de fecha,
  período y personas. La selección cambia el relleno sin agrandar controles.
- Etiqueta del selector de depósitos sin negrita en todos sus usos.
- Formularios y modales con estilos coordinados, contadores junto a las
  etiquetas y selección de íconos y categorías más clara.
- Social más compacto: cards de deuda compartidas, pestañas animadas, reparto
  igualitario con importes por persona, edición manual, listas y opciones rápidas.
- Crear sala presenta Participantes antes de Categoría y reutiliza el modal
  de agregar personas, con búsqueda, selección previa y confirmación. El selector
  de color comparte estilos, nombres y orden con la creación de depósitos.
- Variación mensual del depósito en dos renglones compactos, con opciones
  a la derecha. El texto largo se desplaza y reinicia tras tres segundos al
  final; respeta la preferencia de reducir movimiento.
- Datos de prueba ampliados para recorrer categorías, períodos e importes.
- Guías de interfaz, funcionamiento y desarrollo actualizadas. Los Issues
  pasan a ser contexto opcional para el trabajo indicado por el usuario.

### Corregido

- Bloqueos transitorios de SQLite al preparar el diario: espera y reintentos
  acotados, con diagnóstico y sin borrar datos.
- Anclaje del selector de depósitos y tratamiento de las barras de Android
  al abrir selectores. Los buscadores resaltan su borde solo al recibir foco.
- Textos e importes largos y mensajes repetidos de conexión o guardado local.

### Eliminado

- Esqueletos y animaciones de entrada de las pantallas, sin retirar las consultas.
- Buscador de Estadísticas y separadores diarios redundantes en los listados.

### Verificación

- TypeScript correcto; 194 pruebas: 186 aprobadas, 8 omitidas por requerir
  entornos externos y ningún fallo. Incluye la reconstrucción del cierre anterior
  con depósitos nuevos, registros históricos y reversiones.
- Exportación Android/Hermes correcta con 2157 módulos y 38 recursos.
- Metadatos de app y paquetes en 0.7.0, con código Android 5. Las comprobaciones
  automáticas no sustituyen la revisión visual ni la de funciones nativas en APK.
- Trabajo de interfaz asociado al [PR #67](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/67).

### Alcance pendiente

- La categoría permanece asociada a la sala. Elegir una categoría por gasto
  requiere una implementación posterior coordinada con el backend.
- Las funciones nativas de OCR y biometría deben comprobarse en un APK de esta
  versión. La publicación de esta release no genera ni actualiza el APK.

## [v0.6.0] - 2026-11-03 - no estable

### Añadido

- Recuperación guiada del correo rechazado: detección del lote de perfil,
  respaldo de eventos originales, vista previa y confirmación explícita.
  Se verifican identidad, revisión y generación sin alterar eventos financieros.
- Pruebas de recuperación de cuenta, cola, consultas Social y saldo del primer
  movimiento de depósitos nuevos; guías de entorno, publicación y revisión final.
- Primera integración con SERVER-AHRE y su base MySQL: autenticación remota y recuperación de
  datos en otro dispositivo, manteniendo el ingreso y los registros locales
  cuando el servidor no está disponible. Trabajo autorizado por el líder sin Issue.
- Diario SQLite de cambios por cuenta, con secuencia persistente y lotes por
  operación local. Los envíos son FIFO: un depósito se envía antes de sus
  movimientos; un fallo detiene los lotes siguientes y los reintentos conservan
  el identificador para evitar duplicados.
- Indicador de servidor disponible, sincronización, falta de conexión, sesión
  remota pendiente y conflicto. Los avisos de conexión se muestran al cambiar
  de estado, sin repetirse por cada operación.
- Una instalación autorizada por cuenta, con identificador persistente,
  reemplazo confirmado, revocación y desvinculación después de sincronizar.
  Registro y primer acceso requieren conexión; el acceso offline posterior
  conserva la autorización previa. Los pendientes revocados no se reenvían
  con otra generación y siguen guardados localmente.
- Icono de conexión en los encabezados, con arcos de wifi progresivos, loader,
  tick y error; contador en la esquina sin cambiar el tamaño del botón y
  `...` al superar tres dígitos. Al tocarlo se abre la lista de pendientes.
  La sonda detecta pérdida y recuperación de conexión sin crear movimientos.

### Cambiado

- Lecturas SQLite serializadas sin preparar lotes de escritura, índice de
  pendientes por cuenta/lote y recuentos limitados durante ráfagas de envío.
- Consultas Social sin escrituras después de preparar la identidad; adelantos
  agrupados y formateadores de fecha e importe reutilizados.
- README breve, índice documental y guías operativas coordinadas con SERVER-AHRE.
- Las transacciones financieras sincronizan juntos sus registros y saldos.
  Los datos recibidos se aplican sin generar nuevos envíos. Las cuentas locales
  previas se incorporan mediante una carga inicial ordenada por dependencias.
- El cambio de contraseña requiere sesión y conexión con el servidor cuando
  está configurado, para evitar contraseñas divergentes. Las credenciales y los
  tokens no se incluyen en el diario de datos; los tokens se guardan en
  SecureStore solo cuando se recuerda la sesión.
- Los cambios locales disparan el envío automático y los recibidos durante
  un envío se atienden al terminar. El diario incluye desactivaciones de
  depósitos, cancelaciones de deudas, cierres y entidades de Social.
- El backend valida depósitos, ingresos, egresos, ajustes, transferencias y
  Social mediante módulos separados. Recalcula saldos en centavos y confirma
  el lote completo o lo rechaza, conservando los pendientes locales.
- Los ajustes locales de saldo usan redondeo a dos decimales para coincidir
  con MySQL. Se corrigió la visibilidad del saldo al volver del detalle de
  un movimiento al depósito, respetando la selección de privacidad.
- Se documentan la estructura, responsabilidades y flujo de datos. La
  documentación de SERVER-AHRE describe el despliegue manual desde Windows y
  Ubuntu, sin automatización al cambiar `main`.

### Corregido

- El ingreso remoto recupera la cuenta local por su ID estable después de un
  cambio de correo offline, conservando datos, preferencias y pendientes.
- Ingresos y egresos del mismo minuto de creación del depósito impactan el
  saldo usando su instante de creación. Los movimientos anteriores conservan
  su condición histórica; no se recalculan automáticamente registros viejos.
- Acerca de AHRE obtiene la versión de la configuración Expo en lugar del
  literal 1.0.0; actualmente muestra 0.6.0.

### Eliminado

- Archivos e imports sin consumidores, y dependencias directas de formularios
  `react-hook-form`, `@hookform/resolvers` y `zod`, con autorización del líder.
  Se conserva la copia de Zod requerida internamente por Expo.
- Material gráfico de procesos y referencias, por decisión del líder.

### Documentación

- Se unificaron los README y las guías de desarrollo, publicación y revisión
  de ambos repositorios. Se retiró el material gráfico de procesos por pedido
  del líder y se conservaron las explicaciones y los enlaces verificados.
- Se integraron los cambios del [PR #66](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/66).
- Se actualizaron los metadatos de la app a 0.6.0 y el código Android a 4.
  La descarga pública 0.5.0 se conserva hasta publicar un APK nuevo.

### Verificación

- Pasaron los tipos de la app y herramientas, 158 pruebas de la app y 45 del
  backend, sin fallos ni omisiones, con MySQL 8.4.13 temporal aislado.
- Se aprobó la exportación Android/Hermes. El líder confirmó los recorridos
  funcionales anteriores en Expo Go; no se generó un APK 0.6.0 en esta entrega.

### Alcance pendiente

- Expo permanece en SDK 57 por decisión del líder. Siguen 14 paquetes afectados
  por cuatro avisos (3 altos, 9 moderados y 2 bajos), sin parches corregidos
  dentro de los rangos admitidos. No se forzaron actualizaciones.
- La sincronización requiere app activa. Social y los lotes financieros mantienen
  cargas completas; los pendientes revocados no tienen recuperación general.
- Los registros históricos anteriores no se recalculan automáticamente. La
  publicación de un nuevo APK requiere comprobar OCR y biometría en Android.

## [v0.5.0] - 2026-11-01 - no estable

Versión preparada para revisión en el
[PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65), pendiente de
publicación. Incluye Social del Issue #18 y la migración a TypeScript,
solicitada por el líder sin Issue asociado. La configuración usa `0.5.0` y
`android.versionCode: 3` para la próxima compilación. La prerelease histórica
`v0.4.0` conserva su código y sus metadatos.

### Añadido

- Se agregó la comprobación de tipos de la app, el plugin de Expo y las pruebas
  mediante `npm run typecheck`, con configuraciones separadas para React Native
  y Node. Se incorporaron TypeScript `6.0.3`, `@types/react` `19.2.4` y
  `@types/node` `24.19.2` como dependencias de desarrollo. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- La cuenta de desarrollo incorpora tres contactos, una sala con cuatro gastos
  de reparto igual y manual, partes pagadas y pendientes y una deuda personal
  de $1.800. La carga comparte la transacción de los ejemplos financieros y
  conserva los registros editados, desactivados o cerrados al reingresar. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- Se agregaron 18 escenarios automatizados sobre ejemplos sociales, cierre,
  pagos parciales, reintentos, rollback, lote de 100 gastos, borradores inválidos
  y transferencias; el conjunto pasa de 92 a 110 pruebas. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- Social guarda personas, salas, ítems, repartos, deudas y pagos personales en
  SQLite local, sin comunicación entre dispositivos. El cierre confirma los
  movimientos preparados y crea únicamente deudas que involucran al usuario. (#18)
- Registrar lista permite cargar hasta 100 ítems con opciones rápidas comunes,
  ajustes individuales y guardado atómico. Escanear ticket reutiliza el OCR
  existente y devuelve líneas editables sin registrar un egreso anticipado. (#18)
- Las deudas personales a cobrar registran el egreso del adelanto; las deudas
  a pagar no alteran depósitos hasta registrar el pago. Vincular un movimiento
  existente conserva el saldo y evita duplicarlo. (#18)

### Cambiado

- Se preparó la versión `0.5.0` con fecha 1 de noviembre de 2026, sincronizando
  `app.json`, `package.json` y las dos versiones de la raíz del lockfile.
  Android pasa al código `3` para la próxima build; las dependencias mantienen
  sus versiones. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- Se migraron todas las fuentes JavaScript propias a `.ts`, `.tsx` o `.cts` y
  se activó `strict: true` para la app y las herramientas. Se tiparon SQLite,
  repositorios, servicios, navegación, formularios, componentes, estados,
  referencias, errores externos y OCR. El módulo Android conserva Kotlin y
  las dependencias de ejecución mantienen sus versiones. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- La consulta social agrupa pagos, partes, integrantes y gastos una vez por
  carga para evitar búsquedas completas repetidas por cada registro. Se
  actualizaron las entradas de Expo y las referencias documentales a las
  fuentes migradas. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- Se reorganizó la maqueta de Social como un registro personal offline, con
  resumen de pendientes, deudas recientes, agenda e historiales de deudas y
  salas con búsqueda y filtros. No incluye invitaciones ni unión a salas. (#18)
- Las salas representan ocasiones con hasta tres activas e ítems independientes,
  cada uno con pagador, personas, reparto y estado de pago propios. Se prepararon
  edición mientras están abiertas, revisión de cierre e historial de solo lectura;
  los pendientes propios pasan al registro de deudas después del cierre. (#18)
- Se unificaron las tarjetas y formularios, con confirmación de eliminación de
  deudas, registro de pagos y estados derivados de los datos locales. Se retiró
  el ticket OCR simulado y se conectó el reconocimiento existente. (#18)
- Se separaron las pantallas, los componentes reutilizables, los estilos y los
  datos de Social en archivos independientes, y se actualizó su documentación. (#18)
- Se retiró Edición rápida de Gastos y su modo de formulario sin acceso desde la
  interfaz. Las opciones rápidas permanecen en Agregar gasto → Registrar lista;
  los gastos existentes conservan la edición individual. (#18)
- Se eliminaron opciones y parámetros sin consumidores, se unificó la validación
  de listas y se simplificó la selección de participantes sin duplicados. (#18)
- En la compilación anterior de Social se sincronizó la versión de Expo, del
  paquete y de la raíz del lockfile en `0.4.0`, con código Android `2`. No se
  cambiaron dependencias en esa actualización. (#18)

### Corregido

- Los borradores sociales se leen desde `unknown` y validan la estructura de
  personas pagadas y asociaciones antes de usarse. Se rechazan JSON incompletos
  y campos de tipos inválidos con un error de dominio. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- Se ajustaron los contratos de las proyecciones SQLite a los campos que
  consultan. La reversión de transferencias consulta `anulado`, usado por su
  validación, y la consulta del usuario activo incluye `fecha_actualizacion`.
  ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))

### Verificación

- El 1 de noviembre de 2026 pasaron `npm run typecheck`, las 110 pruebas de
  `npm test` y la exportación Android con Hermes. La
  [build EAS de Android](https://expo.dev/accounts/thiago-salaberry/projects/APP-AHRE/builds/02dec8dd-ef34-4968-9a5c-66cdec47537c)
  del commit `8d106b3`, versión `0.4.0` y código Android `2`, perfil interno
  `ocr-comparison` (APK), finalizó
  correctamente. El líder confirmó que probó ese APK y funciona; se registra
  como una validación funcional general en dispositivo. ([PR #65](https://github.com/thiagosalaberryj-bit/APP-AHRE/pull/65))
- En la auditoría del 30 de octubre de 2026 pasaron las 92 pruebas de Social,
  esquema, servicios, interfaz, datos de desarrollo y OCR. La exportación Android con Hermes terminó
  correctamente después de la limpieza de código. (#18)
- Esa revisión estática no detectó imports rotos ni archivos o exports huérfanos
  de Social. La auditoría del Issue #18 no incluyó validación visual ni captura
  OCR social en dispositivo; la confirmación posterior del APK se registra en
  la verificación del PR #65. (#18)

## [v0.4.0] - 2026-10-30 - no estable

Publicada como prerelease en [GitHub](https://github.com/thiagosalaberryj-bit/APP-AHRE/releases/tag/v0.4.0)
sobre el commit `8906702b48281f1efe1303a3975b49e397f32063`, anterior al módulo
Social del Issue #18. Incluye las correcciones de dependencias del PR #64.
La entrega contiene código fuente, sin APK adjunto, y conserva los metadatos
internos de versión `0.3.0` del commit etiquetado.

### Añadido

- Se integró ML Kit en Android con el modelo latino incluido para reconocer
  comprobantes sin descargar modelos durante el uso. La cámara, la galería y
  el recorte existentes permiten preparar una revisión editable de monto,
  fecha, hora, comercio y productos. (#31)
- La revisión OCR permite confirmar un egreso con categoría y depósito elegidos
  manualmente, usando las validaciones, transacciones y actualización de saldo
  existentes. Si no hay depósitos, permite crear uno y retomar el borrador.
  Las imágenes son temporales y se bloquean confirmaciones repetidas. (#31)
- Se agregó el perfil EAS interno `ocr-comparison` para generar el APK con el
  módulo nativo y se configuró la fuente local de versiones de la app. (#31)
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
- Se conectaron Registro y Login con SQLite local: validación de campos,
  correo único normalizado, verificador de contraseña con sal y creación de
  sesión local opcional mediante SecureStore. El flujo funciona sin conexión.
  (#20)
- Se agregó un componente toast reutilizable para errores, confirmaciones y
  avisos informativos, con animaciones de entrada y salida, barra de tiempo,
  cierre automático, botón para cerrar y gesto horizontal. Los colores por tipo
  se centralizaron en la paleta global. (#20)
- Se conectó el formulario de creación de depósitos con la lógica de dominio y
  SQLite local. Se guardan el nombre, el saldo inicial, el tipo, el ícono, el
  color y la descripción; si esta última queda vacía, se genera a partir del
  nombre y el tipo. (#22)
- Se conectó el detalle del depósito con SQLite local y la sesión activa. La
  pantalla consulta sus movimientos, permite buscar y filtrar por tipo, fecha,
  categoría y monto, editar sus datos y eliminarlo lógicamente sin perder el
  historial asociado. (#23)
- Se conectó el formulario de Ingreso con SQLite local: carga depósitos activos
  y categorías de ingreso, valida los datos y guarda movimientos atómicamente
  con su recurrencia y actualización de saldo. (#24)
- Se conectó el formulario de Egreso con SQLite local reutilizando el formulario
  y el servicio de Ingreso. Valida depósitos activos y categorías de egreso, y
  guarda el movimiento con su recurrencia y actualización atómica del saldo.
  (#25)
- Movimientos consulta en SQLite los ingresos y egresos del usuario, con
  búsqueda, filtros combinables, paginación y detalle por ID. Funciona sin
  conexión a Internet. (#26)
- Estadísticas consulta los movimientos locales para separar ingresos y egresos,
  calcular distribuciones por categoría y presentar períodos semanales y
  anuales completos. El detalle incluye evolución y movimientos reales de cada
  categoría; todo funciona sin conexión. (#28)
- Perfil consulta y actualiza los datos de la cuenta y guarda las preferencias
  de idioma, notificaciones y apariencia en SQLite local. (#29)
- Se agregó el cambio permanente de contraseña: verifica la contraseña actual
  y guarda en SQLite el nuevo verificador con sal para los siguientes ingresos.
  (#29)

### Cambiado

- Se actualizaron los parches de Expo a `~57.0.30`, `expo-constants` a
  `~57.0.22`, `expo-crypto` a `~57.0.4`, `expo-image-manipulator` a
  `~57.0.21`, `expo-splash-screen` a `~57.0.10` y `expo-sqlite` a
  `~57.0.4`, manteniendo el SDK 57. (#31)
- Se simplificó el cálculo local del verificador de contraseña a SHA-256 con
  sal en una pasada para reducir la espera de Registro y Login en Expo Go.
  (#20)
- Los formularios de depósito, ingreso y egreso conservan los errores junto a
  cada campo y muestran con un toast el aviso general cuando faltan datos. Se
  quitó el mensaje general del pie; en depósitos, los contadores aparecen junto
  al título y la ayuda indica que los decimales se ingresan con coma. (#22)
- El detalle de depósito presenta el saldo actual de forma compacta y lo compara
  con el saldo al cierre del mes anterior. La opción para ocultar saldos se
  guarda por usuario en SecureStore y se comparte entre el Dashboard y el
  detalle. (#23)
- Los movimientos y transferencias con fecha y hora anteriores a la creación
  de un depósito permanecen en su historial, pero no alteran su saldo actual.
  La regla también se aplica al editar operaciones y a sus reversiones; los
  formularios de Ingreso y Egreso muestran esta aclaración. (#23)
- Se alineó la presentación de los filtros de Movimientos con la del detalle de
  depósito: opciones de tipo y fecha, campos de monto, indicación de
  desplazamiento y orden de secciones. Se renovó también el modal de opciones
  del depósito. (#23)
- Los carruseles de fecha de Movimientos y Detalle de depósito muestran un
  degradado en los bordes para indicar las opciones fuera del área visible; el
  indicador cambia con el desplazamiento y el tema activo. (#26)
- Se actualizaron Expo SDK de `57.0.25` a `57.0.26`, `expo-camera` de
  `57.0.5` a `57.0.6`, `expo-constants` de `57.0.19` a `57.0.20` y
  `expo-navigation-bar` de `57.0.2` a `57.0.3`. (#20)
- Al abrir AHRE, SQLite se prepara antes de mostrar Inicio. El deslizador
  consulta la sesión: sin sesión abre Login; con sesión válida solicita la
  huella y muestra el logo completo con una barra animada, porcentaje y estado
  durante 1,5 segundos antes de abrir el Dashboard. La carga respeta los temas
  claro y oscuro. (#21)
- El Dashboard dejó de mostrar datos simulados y ahora consulta el usuario,
  los depósitos y los movimientos recientes desde SQLite. Calcula el balance
  con los saldos actuales, muestra hasta cinco movimientos y actualiza los datos
  al recuperar el foco. Se agregaron estados vacíos con acceso para crear el
  primer depósito y reintento ante errores. (#27)
- El formulario de Ingreso conserva el ancho y el espaciado de Egreso, recalcula
  los errores al editar los campos y bloquea los controles mientras guarda. El
  Dashboard conserva los datos visibles al actualizarse al recuperar el foco y
  reserva los esqueletos para la carga inicial o un reintento sin datos. (#24)
- AHRE usa el tema del sistema al primer inicio y recupera la apariencia elegida
  desde las preferencias locales en los inicios posteriores. (#29)
- Se unificaron los modales de Perfil: encabezado a la izquierda con icono,
  título y descripción, botón `X` arriba a la derecha y opciones alineadas. La
  verificación del perfil permite enviar la contraseña con el teclado o usar
  la huella debajo del campo. (#29)
- Estadísticas abre por defecto en Mes para la distribución y en Año para las
  columnas. El detalle de categoría agrupa sus filtros y resultados en una
  tarjeta, con descripción, conteo mensual e importe. (#28)

### Corregido

- La interpretación OCR reconoce años de dos cifras, separa el contador de
  artículos del importe total y trata variantes como `TOTALCS$)` como etiquetas,
  evitando agregarlas como productos. Reúne nombres partidos y conserva el
  comercio en la descripción; los datos ambiguos requieren revisión. (#31)
- El ícono adaptativo de Android incorpora un margen para mostrar el caballo
  completo. La pantalla nativa de carga usa el logo de AHRE con fondos para
  los temas claro y oscuro. Ambos cambios requieren reconstruir el APK. (#31)

### Documentación

- Se documentaron el esquema SQLite, las relaciones, las transacciones, el
  acceso a los repositorios, la estrategia de saldos y las reglas de
  compensación. (#19)
- Se documentaron el registro y Login locales, la sesión, los avisos toast y
  las versiones actualizadas de dependencias Expo. (#20)
- Se documentaron el flujo de inicio, su navegación, la autenticación
  biométrica y los estados de carga. (#21)
- Se documentó la carga local del Dashboard y se actualizaron su guía de
  interfaz y el README. (#27)
- Se actualizaron las guías de creación de depósitos, formularios financieros
  y notificaciones toast para describir la validación y su presentación. (#22)
- Se documentaron el detalle local del depósito, sus filtros, la edición y
  eliminación lógica, la comparación mensual y la privacidad compartida de los
  saldos. También se describió cuándo los movimientos y transferencias afectan
  el saldo según la fecha de creación del depósito. (#23)
- Se documentaron la creación local de ingresos, sus validaciones, la relación
  obligatoria con depósitos, el saldo, la recurrencia y el funcionamiento sin
  conexión. También se actualizó la documentación del Dashboard y el README
  para describir la actualización sin reemplazo visual de los datos. (#24)
- Se documentaron el registro local de egresos, la reutilización del formulario
  y los repositorios de movimientos, la validación, la recurrencia, el impacto
  en el saldo y el funcionamiento sin conexión. (#25)
- Se documentaron el historial local de Movimientos, la búsqueda, los filtros,
  la paginación, el detalle y los estados. Las guías de interfaz describen el
  degradado que indica el desplazamiento en Movimientos y Detalle de depósito.
  (#26)
- Se actualizaron las guías de Perfil, autenticación local, Inicio, arquitectura
  y sistema visual para describir las preferencias persistentes, el cambio de
  contraseña y los modales de Perfil. (#29)
- Se documentaron las fuentes SQLite, consultas, períodos, agrupaciones,
  porcentajes, estrategia monetaria, detalles y funcionamiento offline de
  Estadísticas. Se actualizaron las guías de interfaz y el README. (#28)

- Se documentaron la evaluación y selección de ML Kit, el flujo OCR hasta el
  egreso, los permisos, el tratamiento temporal de imágenes, las limitaciones,
  la compilación EAS y la reutilización de la persistencia de movimientos.
  Se actualizaron las guías de interfaz, arquitectura y dependencias. (#31)

### Verificación

- Se incorporaron 24 pruebas automatizadas de interpretación, preparación del
  borrador y persistencia con el esquema y servicio reales sobre SQLite en
  memoria, incluidos errores y rollback. Se verificaron la exportación Android
  con Hermes y la generación nativa de splash e íconos. (#31)
- El líder confirmó el buen funcionamiento en su dispositivo el 16 de octubre
  de 2026. La guía OCR distingue esta comprobación de los escenarios manuales
  de aceptación que todavía deben registrarse individualmente. (#31)

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
