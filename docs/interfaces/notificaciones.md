# Notificaciones de AHRE

La pantalla usa historial persistente de SQLite, agrupación por día, filtros
Todas/Pendientes/No vistas y carga de páginas. Las tarjetas distinguen Nueva y
Vista mediante texto y peso tipográfico, además del borde; Pendiente/Resuelta
es un estado independiente. Tocar despliega el aviso y Abrir detalle abre el recurso relacionado.

La rueda de ajustes abre un formulario con tipos, horarios y anticipación. Los avisos nativos y push muestran el mismo título y mensaje que el historial. La zona horaria se toma del teléfono al guardar; no es editable. Muestra el permiso real del sistema y permite
solicitarlo cuando falta o abrir Ajustes. Perfil conserva el interruptor
general de avisos. Se mantienen temas claro/oscuro y estilos locales.

Mercado Pago agrega una pantalla de revisión accesible desde el depósito y
la notificación. Muestra cantidades, período recuperado, cupos manuales,
selección múltiple, categorías, ignorados y asociación de registros existentes.
Un aviso visto no se resuelve mientras queden pagos pendientes.

Ver el [contrato funcional y límites](../funcionalidades/notificaciones-mercado-pago.md)
y la guía de credenciales de SERVER-AHRE. Push Android requiere APK con FCM;
Expo Go conserva las funcionalidades locales compatibles.

## Historial y configuración

La campana muestra avisos no vistos (99+ como máximo visible) en el encabezado
y en la barra compacta. El servidor informa el total sin descargar todo el historial;
abrir un aviso reduce el contador y no resuelve automáticamente sus pendientes.

Las páginas traen diez avisos del más reciente al más antiguo. Cargar 10 más
pide la página siguiente con cursor, sin repetir registros. Los filtros también
se aplican en el servidor. Sin conexión se paginan las copias SQLite disponibles.
La sincronización automática solo descarga la página reciente; no recorre el
historial completo en cada actualización. El endpoint actualizado de SERVER-AHRE
es necesario para este comportamiento en cuentas reales.

Con conexión, cada página combina los avisos actuales del servidor con los
locales del dispositivo. Un cursor común por fecha e identificador mantiene
el orden al intercalarlos, sin duplicar las copias remotas de SQLite. Sin
conexión se muestra la unión ya guardada; los cambios de otras cuentas se
conocen al sincronizar, no se infieren offline.

Ajustes reutiliza ProfileModal: X, cierre al tocar afuera y botón Guardar, sin
Cancelar ni Actualizar historial. Filas compactas con interruptores, selector
de hora de la app sin teclado ni borde exterior y botones de anticipación.
Perfil conserva el interruptor general. Cerrar sin guardar descarta el borrador.

En Entrar con datos de prueba se preparan 18 avisos ficticios de los nueve tipos,
con ejemplos vistos/no vistos y pendientes/resueltos. Se identifican como Demo,
no envían push ni crean gastos y conservan las decisiones al volver a entrar.
Abrir Notificaciones permite probar dos páginas de 10 y 8.

## Avisos compactos y recordatorios de deudas

Cada aviso inicia plegado con icono propio por tipo, título, hora y flecha que
indica si está plegado o desplegado. El recordatorio de registro usa un icono de lista. Tocar esa
fila despliega o pliega descripción y estado. Abrir detalle marca el aviso como
visto y navega al recurso; expandir permite leer sin abandonar el historial.
Los avisos se agrupan por fecha completa con un encabezado y separador por día,
manteniendo las tarjetas del mismo día juntas al cargar más páginas.

Las deudas de AHRE no tienen vencimiento: se recuerda revisar su saldo pendiente
al horario elegido, sin alertas de deuda vencida ni anticipación. La anticipación
solo se ofrece para recurrencias. Los ejemplos se actualizan sin reiniciar su
estado de lectura ni cambiar el orden histórico de sus fechas.

El modal de ajustes usa fondo táctil separado de la tarjeta, scroll de altura
limitada y X fija fuera del scroll. No cambia la interacción de otros modales
de Perfil. Si ya hay permiso no se muestra el acceso para solicitarlo; si falta
y Android permite pedirlo, se solicita una vez al abrir. Un rechazo permanente
muestra el acceso a Ajustes, sin repetir la petición automáticamente.

### Cobertura actual de salas online

Agregar directamente una cuenta amiga a una sala genera un aviso de invitación que identifica al administrador y la sala. Los eventos de Social generan títulos concretos con persona, sala e importe cuando corresponde: solicitudes de vínculo y su decisión/cancelación, solicitud y decisión de ingreso, entrada, expulsión, revisión de gastos por salida, cierre, propuesta y aceptación/rechazo/retiro, pago informado/confirmado/rechazado y deuda perdonada.

El destino incluye `evento` para distinguir el ícono y `gastoId` cuando la acción pertenece a un gasto. La tarjeta abre esa acción; los registros limitados de un expulsado conducen a Social. Las acciones pendientes se resuelven por su referencia específica, sin marcarlas como vistas. Marcar un pago desde el gasto también resuelve su solicitud compatible y avisa a quien la envió. La revisión de salida continúa pendiente hasta confirmarla.

La notificación se crea desde un evento canónico por destinatario; los canales secundarios no duplican el aviso. Reintentar el mismo comando no emite otra notificación. Los cambios ordinarios de gastos y permisos actualizan la sala por WebSocket sin producir avisos genéricos de Novedad social.

## Resolución y repetición

Vista y resuelta siguen siendo independientes. Pagar parcialmente una deuda
no resuelve su recordatorio; saldarla, perdonarla o cancelarla cierra sus avisos
locales y cancela la programación futura al reconciliar. Una deuda privada
que pasa a acuerdo online conserva sus pendientes por ambos identificadores.

No registrar movimientos un día conserva un aviso informativo de esa fecha,
sin crear una obligación financiera ni una tarea atrasada. El día siguiente
tiene su propio recordatorio. Registrar hoy no modifica el historial de ayer;
registrar antes del horario cancela el aviso previsto para hoy. El cierre
mensual también es informativo: no se interpreta que abrir Estadísticas haya
completado una revisión financiera.

Deudas con saldo, salas con operaciones sin incorporar y recurrencias sin
confirmar se recuerdan diariamente al horario elegido. Se programan fechas
concretas para un horizonte móvil de 60 días; cada apertura y cambio local
recalcula, cancela lo resuelto y renueva el horizonte. No se mueve la ejecución
de mañana cada vez que se abre la app. El sistema operativo controla la entrega;
una ausencia mayor a ese horizonte necesita reabrir para volver a programar.

Cada aviso recurrente conserva la ocurrencia que lo originó. La anticipación
no lo resuelve: queda pendiente hasta confirmar/avanzar esa ocurrencia o
desactivar la recurrencia. Los recordatorios diarios posteriores se cancelan
al avanzar y se preparan los de la siguiente ocurrencia.

Solicitudes, ingresos, propuestas y pagos online se resuelven por su acción
concreta; otra solicitud de la misma sala no mantiene abierta una ya decidida.
El backend también reconcilia avisos antiguos al consultar el historial.
Una autorización MP renovada cierra su error de autorización; una búsqueda
completa cierra errores de consulta anteriores. Desvincular cancela ambos.
Esto no registra ni ignora movimientos financieros pendientes.

### Precisión del horario en Android

La APK declara SCHEDULE_EXACT_ALARM, un acceso especial distinto al permiso
para mostrar notificaciones. Notificaciones → Ajustes → Horario preciso de
recordatorios muestra el estado real y permite abrir Alarmas y recordatorios
del paquete AHRE en Android 12+. No se solicita automáticamente ni se da por
concedido al abrir esa pantalla. Android puede revocarlo.

Al volver a AHRE se consulta canScheduleExactAlarms y se reemplazan las alarmas
previas, incluso si el sistema las eliminó al revocar el permiso. Un cambio
detectado de precisión también reprograma los recordatorios existentes. Expo
Notifications usa setExactAndAllowWhileIdle cuando está permitido y conserva
la alternativa aproximada si no lo está. No se añaden temporizadores JS para
disparar el aviso. Permitir precisión no habilita por sí solo la entrega si
está denegado el permiso de notificaciones o su canal.

Expo Go no llama al puente nativo de AHRE ni abre este acceso: informa que se
requiere una APK. Una APK anterior que no incluya el módulo pide actualizar,
sin romper el historial ni los recordatorios compatibles. En Android anterior
a 12 y otras plataformas se omite el ajuste especial.

Se requiere recompilar/instalar la APK: recargar JavaScript no agrega permisos
ni módulos nativos. Para comprobarlo: denegar y conceder desde Ajustes, volver
a AHRE y revisar el estado; programar unos minutos después y probar con la app
cerrada, con y sin conexión. Repetir después de revocar el permiso. Esta opción
solo afecta recordatorios locales: no adelanta los eventos push del servidor.
El sistema operativo y el fabricante siguen controlando la entrega.
Referencia: [Alarmas de Android](https://developer.android.com/develop/background-work/services/alarms).

### Claridad de permisos y pruebas de horario

Horario preciso usa un botón con fondo visible; el texto solo indica si está
activado o ayuda a reducir retrasos, sin referencias técnicas a eventos remotos.
La pantalla omite el aviso genérico de permisos cuando todo está habilitado.
Si Android bloquea las notificaciones, aparece un contenedor informativo con
flecha hacia ajustes: «Activá las notificaciones de la app para recibir avisos
aunque esté cerrada», sin texto rojo ni botón separado; el estado se vuelve a consultar al regresar del sistema. Perfil
distingue la preferencia del usuario de la entrega: no muestra Activadas si
Android niega permiso. Conservar la preferencia no concede ese permiso.

Al apagar Notificaciones en Perfil, el modal conserva tipos y horarios pero
bloquea controles, privacidad, precisión y Guardar. Ir a Perfil permite volver
a activarlas; no se solicita permiso automáticamente mientras el general esté
apagado. Las opciones vuelven a habilitarse con sus valores anteriores.

Una notificación de deuda pendiente no bloquea la siguiente entrega. Al cambiar
el horario a otro posterior del mismo día se reemplaza la programación futura,
pero se usa un ID de entrega distinto para no actualizar el aviso ya mostrado
ni omitir la segunda entrada del historial. Reprogramar sin cambiar hora sigue
siendo idempotente. Completar la acción cancela los recordatorios posteriores.
Para probar, elegir una hora unos minutos por delante, Guardar y esperar.
La hora exacta que ya comenzó se considera pasada y va al próximo día aplicable.
El recordatorio de registro se cancela hoy si ya se registró un movimiento;
para probar deudas debe existir saldo pendiente y estar activo su tipo de aviso.

### Confirmación local de programación y diagnóstico

Guardar ajustes espera a que termine la programación nativa antes de cerrar el
modal. No espera sincronización ni llamadas al backend; los trabajos locales
se serializan para que una reconciliación anterior no termine después con datos
viejos. Los errores del programador nativo se muestran en el modal de error,
sin fingir que guardar la preferencia confirma también la alarma.

Al consultar el historial se incorporan los recordatorios cuya fecha prevista
ya pasó, sin esperar el ciclo del controlador ni conexión. Es historial de
avisos previstos: no acredita entrega física. Las alarmas retrasadas que Android
todavía conserva no se cancelan solo por pasar la hora; se cancelan si el aviso
se resuelve, se desactiva o se cambia explícitamente su horario. Si desaparece
una alarma futura del sistema, se vuelve a programar aunque SQLite tenga su ID.

Durante el guardado, el formulario conserva el ancho, la distribución y los
valores de sus opciones; solo se bloquea la interacción. No se aplica el estilo
de botón deshabilitado al contenedor completo. El botón temporal de diagnóstico
de diez segundos fue retirado después de comprobar la entrega en el dispositivo.

## Lectura y contador

El tick doble está inmediatamente a la izquierda de la tuerca, junto al total
sin ver. Marca avisos locales y remotos hasta la hora de pulsarlo, aunque no estén
en la página cargada. Abrir una tarjeta marca ese aviso visto; los contadores
compartidos cambian al momento y descartan resultados de consultas anteriores
a esa lectura. Visto y resuelto siguen siendo estados distintos.


## Correcciones de acceso, permisos e invitaciones · 16/11/2026

Sin hardware biométrico o sin huella configurada, Inicio deriva a Login y exige contraseña; nunca abre Dashboard directamente. Login recupera el correo de la cuenta al reabrir si «Recordarme» está activo y la sesión sigue vigente; la contraseña permanece vacía. Cerrar sesión o perder su autorización limpia el correo recordado.

Nombre y apellido del registro fuerzan una única línea en el input desde el primer render. Aceptar/rechazar tienen separación explícita. Quitar de una sala muestra los gastos afectados como lista desplazable, con confirmación visible. Una solicitud de una cuenta amiga se acepta directamente con su ficha confirmada; el servidor rechaza cualquier intento de asignarla a otra.

Notificaciones muestra primero Paso 1 para habilitar los avisos y, al concederlo, Paso 2 para configurar horarios precisos, con el mismo contenedor y acceso por flecha. El Paso 2 desaparece cuando Android confirma el permiso. Al fondo del modal de ajustes queda la fila Horarios precisos, con el estilo de Perfil y el estado real; abre los ajustes de Android para activar o desactivar el permiso y vuelve a consultarlo al regresar. Los horarios precisos reducen retrasos de recordatorios locales, no cambian la entrega del proveedor push. Las push y los recordatorios muestran el mismo título y mensaje del historial, sin sustituirlos por «Tenés que revisar algo en AHRE»; se retira el control que ocultaba ese contenido. El campo mostrarDetalles se conserva solo por compatibilidad del contrato.


## Contenido de cada tipo de aviso

Conservé el mismo título y cuerpo entre el historial, los recordatorios nativos y
las push. Ese contenido tiene distinto nivel de detalle según el tipo:

| Tipo en ajustes | Contenido actual |
| --- | --- |
| Registrar movimientos | Recordatorio general para registrar lo de hoy. |
| Deudas que debo | «Le debés a Lucía Pérez» y «Saldo pendiente: $ 1.234,50.». |
| Deudas que me deben | «Martina Gómez te debe» y el saldo pendiente con dos decimales. |
| Recurrencias | Nombre del movimiento en el título y nombre del depósito en el mensaje, tanto anticipado como al momento y pendiente. |
| Salas | Nombre de la sala en el título y cantidad de movimientos pendientes de incorporar a un depósito. |
| Resumen mensual | Invitación general a revisar el balance y compararlo con el mes anterior. |
| Mercado Pago | Cantidad por revisar o resultado de la conexión/importación, según el evento. |
| Social | Solicitud, decisión, ingreso, invitación, expulsión, cierre, propuesta o pago, con persona/sala/importe cuando corresponde. |
| Cuenta | Situación concreta de acceso, autorización o sincronización; el detalle depende del evento. |

Los horarios precisos afectan los recordatorios locales. No aceleran las push
remotas. La fila al fondo del modal abre Android; su interruptor refleja el
permiso real y no cambia de estado hasta comprobarlo al volver. Ya no hay un
botón separado «Configurar horario preciso» al principio del modal.


### Recordatorios descriptivos · 16/11/2026

Agregué el nombre y apellido de la otra persona y el saldo restante a los
recordatorios de deudas personales y acuerdos online. El importe descuenta los
pagos vigentes, excluye el movimiento de origen y conserva dos decimales. Una
deuda vinculada a un acuerdo aceptado genera un único conjunto de recordatorios.

Los tres momentos de una recurrencia identifican su descripción y depósito.
Las salas usan el nombre del detalle actualizado o el que acompaña las operaciones
cuando ese detalle ya no está disponible. Los datos antiguos sin nombre conservan
una descripción de respaldo; nunca muestran identificadores internos.

Al reconciliar, los cambios de saldo o nombre reemplazan la programación futura,
sin alterar los avisos históricos ya generados. Android recibe el mismo título y
mensaje descriptivos. No cambié horarios, destinos ni las reglas de resolución.
La información de contexto procede de SQLite y de las copias online ya recibidas;
no requiere un nuevo contrato del servidor.

Comprobé 49 casos de notificaciones, permisos y acceso sin fallos ni omisiones,
y los tipos de app/herramientas. Después completé la suite integral y preparé
el commit local de esta entrega; la recepción y presentación
física en Android quedaron confirmadas en la prueba general de la APK 0.9.2.


## Marcado masivo sin acciones individuales

Marcar todas como vistas conserva las marcas por aviso mediante un único
INSERT … SELECT y un UPDATE en la misma transacción, sin recorrer cada aviso
desde JavaScript. No abre avisos ni ejecuta sus acciones y encola una sola
confirmación remota. El botón muestra tres puntos, evita envíos repetidos y
actualiza el contador tras guardar. Las recargas se agrupan si llegan eventos
durante una lectura. Una prueba con 2.000 avisos comprueba que la cantidad de
consultas no crece por cada aviso y que se conserva el marcado del historial.
