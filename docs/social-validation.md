# Prueba completa de Social

## Recorrido visual local actualizado

En Inicio, tocar **Entrar con datos de prueba** otra vez para añadir estos ejemplos
a la cuenta local existente. No hay que borrar sus datos: los ejemplos nuevos se
agregan una sola vez y no revierten ediciones, pagos, decisiones ni desarchivados.

| Dónde entrar | Qué se puede comprobar sin servidor |
| --- | --- |
| Perfil → Editar perfil | Nombre y apellido separados, límites de 80 caracteres y nombre completo en la tarjeta. La cuenta de ejemplo tiene apellido AHRE. |
| Social → Personas | Solicitud de Martina Ruiz con tick/X. Aceptar exige ficha existente o nueva con apodo. Se puede rechazar o aceptar localmente. |
| Debajo de Personas → Ver personas archivadas | Modal con Diego Medina, búsqueda, apertura de ficha y desarchivado directo. No reemplaza la lista de personas activas. |
| Ficha de Bruno → Ver cuenta vinculada | Nombre, apellido y correo ficticio de la cuenta. |
| Otra ficha → Vincular cuenta | Solicitar un vínculo con correo ficticio y cancelarlo; queda solo en la simulación local. |
| Notificaciones | Avisos vistos/no vistos y resueltos/pendientes, contador y marcado global con el tick doble junto a Ajustes. |
| Crear sala / Registrar deuda | Campos obligatorios, errores junto al campo, contraseña con candado y ojo, importes con dos decimales. No es necesario guardar para revisar errores. |
| Demo · Viaje con amigos → Personas | Solicitudes de pago de Bruno e ingresos de invitados con controles compactos. Marcar su parte pagada resuelve el aviso compatible. |
| Demo · Viaje con amigos → Compartir sala | Contraseña de ocho caracteres, mostrar/ocultar contraseña y QR/enlace ficticios. |
| Salas → Historial | Candado y estado Cerrada, gastos en solo lectura y sin incorporación atrasada desde el gasto. |
| Demo · Del lado de quien debe | Ejemplos de pago confirmado, rechazado, pendiente y deuda perdonada; respuestas simuladas desde una misma cuenta. |
| Deuda personal Entrada adelantada de prueba | Registrar un pago parcial y eliminar la deuda personal, comprobando la corrección del movimiento y saldo. |
| Encuentro de prueba | Repartos, depósitos preparados y cierre local. Sus movimientos muestran sala y concepto de origen en el detalle. |
| Crear depósito y barra inferior | Una sola acción de guardado y texto Escanear. |

La simulación no prueba recepción en otro dispositivo, persistencia MySQL,
sincronización entre cuentas, requisitos financieros de todos los miembros de una
sala remota, entrega push con la app cerrada ni Android App Links desde la cámara.
Esos recorridos conservan su comprobación real con APK y backend. Los enlaces demo
no invitan a otra persona. Las pantallas y acciones compartidas son las mismas de
la app, con datos ficticios y un transporte local autorizado solo en desarrollo.

## Preparación

Comprobar que backend y clientes incluyan las correcciones de la misma revisión.
Esta revisión se verifica localmente: no genera APK ni despliega cambios. Una APK
anterior no incorpora el JavaScript actual. Para pruebas entre dispositivos,
actualizar SERVER-AHRE con su guía social y utilizar una build Android identificada
por versión/código y revisión, o dos clientes de desarrollo compatibles.
La revisión de los 22 ajustes cambia el esquema inicial SQLite: recrear únicamente
las bases descartables Expo de desarrollo. Para datos reales del servidor usar
la actualización controlada con respaldo. Ver [ajustes acordados](ajustes-acordados.md).

Usar A en la APK, B en Expo Go y C en un navegador sin cuenta. Las cuentas de
prueba existentes son a@pruebas.ahre.test y b@pruebas.ahre.test; su contraseña
acordada es Hola1234. Anotar los saldos iniciales de los depósitos de A y B.
AHRE registra información; estas pruebas no transfieren dinero.

La cuenta local «Entrar con datos de prueba» sirve para revisar interfaces y
simular decisiones como creador o participante. Exige modo desarrollo y cuenta
local autorizada, también en una build de desarrollo; no se habilita en release.
Sus enlaces son ficticios, no se conectan con otro cliente ni prueban MySQL o WSS.

## 1. Agenda y vínculo sin sala

1. En A: Social → Personas → ficha de B → tres puntos → Vincular cuenta.
2. Enviar a b@pruebas.ahre.test. B acepta en Social → Personas → Solicitudes de vínculo, eligiendo una ficha
   existente o registrando una con apodo obligatorio. Comprobar el vínculo en ambos lados.
3. En A debe aparecer Cuenta vinculada. Si ya estaban vinculados, no repetir.
4. Una segunda ficha no debe poder vincularse a esa misma cuenta automáticamente.

## 2. Crear una sala compartida y entrar

1. A abre Social → Salas → Crear sala. Agrega las fichas de B y C.
2. Activa Compartir online, escribe una contraseña de al menos ocho caracteres y crea.
3. Abre Compartir sala: debe aparecer un enlace global, QR e ícono para copiar.
4. Copia y comparte varias veces: el enlace y QR deben mantenerse y abrir sin regeneración.
5. B usa Social → Salas → Unirme a sala. Pega el enlace y escribe solo la contraseña; nombre y apellido provienen del perfil.
6. Como B ya está vinculado y asignado a la sala, recupera su participación sin duplicarse.
7. C abre el mismo enlace desde el navegador. Una contraseña incorrecta debe mostrar error
   y permitir corregirla. Sin cuenta, completa nombre, apellido y contraseña y queda esperando aprobación. Con cuenta usa el perfil; un vínculo confirmado con el administrador permite entrar automáticamente si nunca fue expulsado.
8. Mientras espera, C no ve gastos, participantes, importes ni depósitos.
9. A abre la pestaña Personas de la sala → Ingresos: debe ver el contador. Toca la solicitud de C,
   elige Seleccionar persona o Nueva persona y confirma Admitir.
10. Intentar asignarlo a B debe rechazarse por pertenecer a otra cuenta. Luego debe poder
    corregir la elección y asignarlo a C. Si C tenía una sesión invitada anterior, confirmar
    Reemplazar acceso anterior; esto revoca el acceso anterior, sin borrar su historia.
11. La web de C debe mostrar la sala tras la aprobación y conectarse en tiempo real.

En WhatsApp, usar el enlace HTTPS completo. La cámara normal del teléfono abre
la APK instalada con App Links verificado o la alternativa web sin app.
El escáner de Social abre el ingreso en la app. Abrir en la app
está pensado para la APK instalada, no para iniciar Expo Go por enlace nativo.

## 3. Gastos, solicitudes y depósitos privados

1. A registra Comida por $120, categoría Alimentación, pagada por A y dividida entre A/B/C.
2. A abre el detalle → Mis movimientos → Compra: Comida. Elige su depósito y guarda para el cierre.
3. B abre ese gasto → Ya pagué mi parte. Elige su depósito para los $40 y guarda.
4. A ve un pendiente en Personas y en B. Tocar B abre el detalle y muestra quién envió
   el aviso, fecha, gasto y estado; no debe desplegar una segunda lista en la sala.
5. A acepta el aviso desde B o desde el gasto. Ambos lugares deben actualizarse.
6. A vuelve al gasto y prepara su depósito para Cobro: Comida por $40.
7. C prueba Ya pagué mi parte en la web. No debe pedir depósito. A rechaza ese aviso:
   C sigue debiendo $40 y ve la decisión en Mis solicitudes.
8. A registra Taxi por $60, categoría Transporte, pagado por B y dividido solamente entre A/B.
9. B abre Taxi y prepara su depósito para la compra completa de $60.
10. A todavía no pagó su parte del taxi: debe ver $30 pendientes, sin registrar un egreso.

11. Abrir Mis movimientos, guardar una selección y probar la cruz, el fondo y
    Atrás mientras se procesa: el modal permanece abierto hasta terminar.
12. Con dos participantes con avisos pendientes sobre el mismo gasto, aceptar
    ambos consecutivamente. El primero no debe invalidar al segundo. Cambiar
    pagador, importe o reparto sí debe exigir un aviso nuevo.

Hasta aquí los saldos de A y B deben seguir iguales a los anotados inicialmente.
Nadie debe ver o elegir los depósitos de otra cuenta.

También probar marcar directamente una parte pagada desde el detalle como
administrador y volver a marcarla pendiente antes del cierre. No debe crear
movimientos ni deudas permanentes. Si el administrador confirma un pago ajeno
sin que esa persona elija depósito, conservar Pagado y bloquear el cierre hasta
que registre su asociación. Un invitado sin cuenta no necesita depósito.

## 4. Desconexión, cambios y cierre

Antes de compartir una sala local, preparar una compra con depósito y otra con
un movimiento existente. Publicar y reintentar ante una respuesta perdida:
ambas selecciones deben conservarse; cerrar no debe repetir el movimiento adjunto.

1. A se desconecta y cambia la descripción de un gasto. Debe quedar pendiente de sincronización.
2. El cierre compartido debe estar bloqueado sin conexión o mientras haya cambios sin confirmar.
3. Reconectar A: la edición llega a B y C sin duplicarse.
4. En una prueba aparte, cambiar importe o pagador tras preparar el depósito:
   una asociación incompatible debe pedir revisión y no aplicarse al cierre.
5. Con los importes del apartado anterior, cerrar la sala.

Resultado esperado tras recibir el cierre:

| Cuenta | Movimientos nuevos | Diferencia de saldo | Deudas pendientes |
| --- | --- | ---: | --- |
| A | Compra $120 y cobro $40 | −$80 | Debe $30 a B; C le debe $40 |
| B | Pago de parte $40 y compra $60 | −$100 | A le debe $30 |
| C | Ningún movimiento privado | No aplica | Debe $40 a A |

Las deudas A/B aparecen automáticamente en Online. La deuda de C, sin cuenta,
es personal en A. No hay que crearla ni aceptarla otra vez. La sala queda en solo lectura. Abrir y sincronizar varias
veces no debe repetir movimientos. Si falta una selección de cualquier cuenta,
se informa quién y qué falta y se bloquea el cierre. En una sala cerrada no se
pueden incorporar compras o partes atrasadas. Los pagos posteriores de deudas
se gestionan desde la deuda.

## 5. Pagar una deuda de sala

1. A abre Todas las deudas → Online → deuda del taxi con B.
2. Informa $10 desde su depósito: aparece un egreso de $10, pero sigue debiendo $30.
3. B abre el evento del historial, elige su depósito de recepción y confirma.
4. El pendiente pasa a $20 y B tiene un solo ingreso de $10.
5. Reabrir y sincronizar no debe duplicar ninguno.
6. A informa otros $5 y B los rechaza: el pendiente sigue en $20, B no recibe ingreso
   y A conserva su egreso. Si fue un error, A puede corregir su movimiento privado
   sin modificar automáticamente el acuerdo compartido.

## 6. Propuesta de deuda independiente

1. A crea Nueva deuda → Me debe → B, por $100, y activa Proponer deuda online.
2. Elige su depósito de origen. La anotación privada y su adelanto se conservan.
3. B encuentra una tarjeta en Todas las deudas → Online → Invitaciones.
4. Abrirla muestra su detalle con Aceptar/Rechazar; no debe aparecer un formulario
   grande de propuestas o pagos en el listado general.
5. B acepta. El acuerdo queda como deuda online sin exigir otra anotación manual.
6. Informar $25 desde B no reduce el pendiente hasta que A elija depósito y confirme.
   Después deben quedar $75. El importe original sigue siendo $100.
7. En otra propuesta, rechazar debe conservar la deuda privada del remitente.
8. Si B ya había anotado la misma deuda, probar asociarla explícitamente al aceptar:
   debe quedar una sola representación del acuerdo, sin fusionar personas ni duplicar importes.
9. Si A y B enviaron propuestas sobre esos mismos registros, aceptar una y reconocer
   la anotación privada de la otra cuenta. La propuesta cruzada no debe poder
   aceptarse como segundo acuerdo; rechazarla conserva el registro y el acuerdo elegido.

## 7. Cuentas, acceso y regresiones

- C se registra desde su sesión web admitida: debe conservar participación y obligaciones.
  Después entra con esa cuenta en la app y elige sus propios depósitos al registrar pagos.
- Renovar el enlace invalida el anterior para nuevas solicitudes; cambiar la contraseña
  exige la nueva al solicitar ingreso. No expulsa a participantes ya admitidos.
- Deshabilitar nuevos ingresos debe impedir nuevas solicitudes, sin borrar la sala.
- Retirar un participante conserva gastos y obligaciones históricas y revoca su acceso activo.
- Verificar filtros Todas/Locales/Online, Invitaciones, Debo/Me deben, búsqueda y estados.
- Repetir los recorridos principales en tema claro y oscuro, con teclado y nombres largos.
- Crear y cerrar una sala local sin Internet: debe conservar el flujo offline existente.

La comprobación automatizada usa SQLite, MySQL aislado y HTTP/WebSocket. No
sustituye este recorrido físico de cámara, teclado, enlaces y APK. El formulario
global web también se revisó localmente en ambos temas antes del despliegue.


## Confirmación manual y claridad financiera

Las recurrencias vencidas se aceptan desde Depósito → Recurrentes o se desactivan;
no generan dinero automáticamente. La aceptación es única por fecha programada.
En salas cerradas se indica cuántos movimientos propios faltan incorporar y qué
gastos los originan. La incorporación local actualiza el aviso sin esperar la red.
Las acciones financieras bloquean otros envíos y cancelaciones mientras guardan;
solo el botón elegido muestra carga. Las deudas usan Te debe/Le debés mientras
haya pendiente, Saldada cuando se pagó todo y Perdonada si se perdonó el resto.
Cerrada corresponde a salas. Las propuestas rechazadas se retiran del destinatario
y se conserva el registro privado del creador. Deuda registrada integra el
movimiento de origen, sin repetir una fila Adelanto registrado ni otro cargo.

Prueba física pendiente: nueva APK en Android, funcionamiento sin red, apertura
tras fechas vencidas, doble toque, navegación Atrás y resumen después de aceptar.
La APK build 11 anterior no incluye estos cambios; no se generó otra en esta revisión.

## Eliminación personal y repropuestas

Eliminar una deuda personal con pagos parciales debe corregir adelanto y pagos
asociados y devolver el saldo correspondiente; perdonar conserva esos movimientos.
Rechazar y reenviar una propuesta debe generar un aviso nuevo en la otra cuenta,
tanto para Debo como Me deben. Reintentar una respuesta perdida no duplica avisos
ni propuestas. Los importes siempre muestran dos decimales y rechazan una tercera
cifra decimal de entrada.

## Ajustes de solicitudes y cierre

El estado Abierta/Cerrada aparece junto al nombre, sin repetirse junto a la fecha.
En la sala se muestra Pendientes para cerrar, agrupado por persona y con líneas
entre integrantes. Las compras, cobros y pagos propios abren directamente su
gasto; los registros ajenos y avisos no son accesos. Cerrar sala permanece
deshabilitado desde el detalle hasta verificar todos los registros; desconocer
el estado remoto no equivale a estar listo. La revisión de cierre no repite esa
lista y conserva la protección de Confirmar cierre. El servidor conserva su
validación transaccional para todas las cuentas.

La demo ahora aplica el mismo bloqueo: preparar cada operación propia en Mis
movimientos y resolver los avisos de pago. En el detalle de sala, Simular
registros de los demás representa exclusivamente las acciones de otras cuentas
ficticias y no completa los registros propios. En una cuenta real esa acción no
existe. Modificar el reparto o importe exige revisar los registros simulados.

El resumen muestra fecha y cantidad de participantes debajo del nombre, sin
contador de gastos ni Categoría por gasto. La descripción se muestra completa,
sin límite de líneas. Eliminar deuda personal aparece centrado debajo de las
acciones Registrar pago / Perdonar deuda y conserva su confirmación destructiva.

Validación de estos ajustes: 135 pruebas de interfaz y demo Social aprobadas,
sin omisiones, en temas claro y oscuro; comprobación TypeScript de app y
herramientas correcta. Se verifica el acceso al gasto propio, los registros ajenos
sin acceso, la habilitación del cierre al completar registros y la separación de
Eliminar deuda. Estas pruebas no sustituyen una revisión visual en el teléfono.

Aceptar un vínculo o un ingreso utiliza el selector deslizante Nueva persona /
Seleccionar persona y una lista con búsqueda, en lugar de etiquetas. Nombre,
apellido y apodo muestran siempre el borde habitual en Registrar vínculo; en
el ingreso a sala usan borde fino al enfocar (o al mostrar un error). Se
conservan la selección de una ficha existente y el apodo obligatorio al crearla.

Se corrigió un espacio literal dentro de la tarjeta de aceptación del gasto:
React Native exige que incluso ese texto esté dentro de Text. La prueba de
regresión abre el gasto con una solicitud pendiente y comprueba sus hijos nativos.

## Revisión de escaneo y filtros

Escanear verifica depósitos antes de mostrar cámara/galería y ofrece Nuevo
depósito desde una tarjeta de estado si no hay ninguno. El resultado ya no
incluye creación de depósito. Escanear/Tomar foto conserva su ubicación junto
a Galería; Texto reconocido es desplegable y Escanear otro comprobante es una
acción secundaria. El comercio continúa siendo una propuesta heurística editable.

Estadísticas, Movimientos y Detalle de depósito usan categorías en listado
vertical con icono, nombre y casilla. El catálogo completo permanece disponible
sin movimientos. Incluir todas no marca cada opción; elegir una inicia el filtro.
Se retiraron Todas/Ninguna del panel de Estadísticas. Los paneles reservan la
zona segura inferior; el selector de depósitos también limita su altura y puede
abrirse arriba para mantener opciones y Listo fuera de la navegación Android.
Los contadores del encabezado plegado se bajaron sin cambiar el desplegado.

Validaciones de esta revisión: TypeScript de app/herramientas correcto; 25 pruebas
OCR, 54 de filtros/estadísticas/detalle/posición del selector y dos regresiones del
selector de depósitos aprobadas. No acreditan una prueba visual en el teléfono.

## Validación del flujo acordado de salas

Casos automatizados adicionales: Recordarme conserva correo sin contraseña y funciona sin huella; Inicio conserva la validación biométrica cuando está configurada; decisiones con carga estable en ambos temas; fichas archivadas que admiten nuevas deudas y salas; revisión por expulsión y bloqueo de cierre. El servidor prueba identidad autenticada, admisión atómica con apodo repetido, reciprocidad, reingreso de amigos, expulsión y acceso financiero limitado, cierre entre cuentas sin amistad y retiro/reenvío idempotente de propuestas.

Comprobar manualmente en una APK: teclado y botones Android dentro de los modales, ingreso por enlace/QR con dos cuentas, recepción push y la tarjeta de registros propios después de expulsión. Las pruebas de componentes y la exportación Hermes no sustituyen esa prueba física. Para las restricciones SQLite de archivo, usar una base local de desarrollo recreada. No es necesario borrar la base del servidor.


### Resultado automatizado del 15/11/2026

Tipos de app y servidor correctos. App: **572 pruebas aprobadas, cero fallos y cero omisiones**. Servidor coordinado: **115 pruebas aprobadas, cero fallos y cero omisiones**. MySQL 8.4.3 desechable en loopback, puerto 13347, con bases sintéticas por escenario. Las integraciones se habilitaron con `AHRE_MYSQL_TEST=1` y `AHRE_SERVER_SOURCE=C:/Programacion/AHRE/SERVER-AHRE`; no se omitieron por falta de configuración. Exportación Android/Hermes correcta con Expo local, sin instalar dependencias.

El rechazo del reinicio por una confirmación todavía en vuelo se cubre con espera de actividad antes de la vista previa y cinco ejecuciones consecutivas correctas. La limpieza del reinicio contempla autoría y revisiones de salida, sin dejar bloqueada la sala que conserva otro administrador.

Estos resultados validan código local; no acreditan despliegue ni recepción push, teclado o gestos en una APK física. Los cambios permanecen sin commit, push, despliegue ni envío de una nueva compilación a EAS.


Correcciones del 16/11: acceso sin huella exige Login y cerrar sesión limpia correo; inputs de identidad de una línea; pasos de permisos secuenciales; aceptación directa de amigos con protección de ficha; invitación al agregar integrantes; push con título/cuerpo del historial. Verificación: suite de app y servidor con MySQL aislado y prueba específica del contenido nativo y del Paso 2. Los commits locales incluyen el trabajo pendiente anterior y estas correcciones, sin desplegar ni generar una nueva APK.
