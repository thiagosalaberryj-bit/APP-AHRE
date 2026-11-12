# Notificaciones de AHRE

La pantalla usa historial persistente de SQLite, agrupación por día, filtros
Todas/Pendientes/No vistas y carga de páginas. Las tarjetas distinguen Nueva y
Vista mediante texto y peso tipográfico, además del borde; Pendiente/Resuelta
es un estado independiente. Tocar despliega el aviso y Abrir detalle abre el recurso relacionado.

La rueda de ajustes abre un formulario con tipos, horarios, anticipación,
privacidad. La zona horaria se toma del teléfono al guardar; no es editable. Muestra el permiso real del sistema y permite
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

Solicitudes creadas/decididas, ingresos solicitados/resueltos y pagos informados,
decididos o perdonados generan avisos de Social según el evento recibido.
Los cambios de gastos, integrantes, permisos y el cierre usan sala_actualizada:
actualizan la sala por WebSocket, pero hoy no generan un aviso en el historial.
El tipo sala_cerrada está previsto en el notificador, pero el cierre actual no
lo emite. No se implementaron nuevos eventos de salas en este ajuste visual.

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
