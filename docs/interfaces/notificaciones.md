# Notificaciones de AHRE

La pantalla usa historial persistente de SQLite, agrupación por día, filtros
Todas/Pendientes/No vistas y carga de páginas. Las tarjetas distinguen Nueva y
Vista mediante texto y peso tipográfico, además del borde; Pendiente/Resuelta
es un estado independiente. Tocar abre el recurso relacionado.

La rueda de ajustes abre un formulario con tipos, horarios, anticipación,
zona horaria y privacidad. Muestra el permiso real del sistema y permite
solicitarlo de forma explícita o abrir Ajustes. Perfil conserva el interruptor
general de avisos. Se mantienen temas claro/oscuro y estilos locales.

Mercado Pago agrega una pantalla de revisión accesible desde el depósito y
la notificación. Muestra cantidades, período recuperado, cupos manuales,
selección múltiple, categorías, ignorados y asociación de registros existentes.
Un aviso visto no se resuelve mientras queden pagos pendientes.

Ver el [contrato funcional y límites](../funcionalidades/notificaciones-mercado-pago.md)
y la guía de credenciales de SERVER-AHRE. Push Android requiere APK con FCM;
Expo Go conserva las funcionalidades locales compatibles.
