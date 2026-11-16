# Ajustes acordados de app y servidor

Rama de ambos repositorios: `codex/mejoras-visuales-accesibilidad`.
Base preservada antes de empezar: app `31fac6b`, servidor `443f9fe`
(reinicio de datos conservando la cuenta y sus credenciales).
Esta revisión es local: no acredita despliegue ni publicación de APK.

## Los 22 puntos

1. Crear depósito conserva una sola acción de guardado, sin Cancelar adicional.
2. Registro muestra Nombre y Apellido en la misma fila y guarda ambos por separado.
3. Aceptar un vínculo exige elegir una ficha propia o crearla con nombre, apellido
   y apodo obligatorio. La aceptación confirma el vínculo en ambas agendas.
   Se permiten homónimos con distinto apodo; no se fusionan por nombre.
4. La baja de una persona se llama Archivar. La agenda permite ver archivadas y
   abrir su ficha para Desarchivar, conservando historial y relaciones.
5. Ver cuenta vinculada muestra nombre, apellido y correo de la cuenta.
6. Login marca los campos de credenciales; crear sala y registrar deuda muestran
   validaciones junto al campo correspondiente. Los errores generales usan toast.
7. Una propuesta rechazada puede enviarse nuevamente. Cada intento nuevo utiliza
   otro `idOperacion`; un reintento con respuesta perdida conserva el mismo.
8. Eliminar deuda personal corrige el adelanto y todos los pagos asociados,
   incluidos los parciales, y ajusta saldos en una transacción. Se conserva el
   historial de correcciones. Perdonar conserva el dinero y cierra el pendiente.
   La eliminación personal no se ofrece para acuerdos online.
9. Marcar todas como vistas está inmediatamente a la izquierda de Ajustes, junto
   al total sin ver. Incluye avisos remotos aún no cargados hasta la hora del marcado.
10. Abrir un aviso lo marca visto y actualiza contadores. Consultas anteriores no
    restauran un contador viejo mientras se confirma la lectura.
11. El permiso Android se presenta como contenedor informativo con flecha hacia
    ajustes y explicación de avisos con la app cerrada.
12. El nombre de la sala muestra candado y estado Abierta/Cerrada.
13. Contraseña de sala usa candado y ojo, con mínimo de ocho caracteres sin exigir
    mayúsculas, números ni símbolos (máximo técnico: 128).
14. Incorporarse a una sala genera aviso persistente para sus cuentas participantes.
15. Los enlaces HTTPS del QR declaran Android App Links y asociación del dominio
    con el certificado público de firma de la APK. Sin app, sigue la alternativa web.
16. Las tarjetas de solicitudes usan tick/X de igual tamaño, con etiquetas accesibles.
17. Los importes muestran dos decimales, incluso enteros: `$ 1,50`, `$ 1,00`.
18. Se rechazan entradas con más de dos decimales, sin redondearlas silenciosamente.
19. Si el administrador marca una parte pagada, su aviso compatible pendiente se
    resuelve automáticamente. Repetir la misma aceptación es idempotente.
20. El cierre espera las asociaciones válidas de todas las cuentas: compra completa
    del pagador, partes efectivamente pagadas y cobros efectivamente recibidos.
    También espera la decisión de los avisos de pago pendientes. Se informa quién
    debe completar qué operación. Las partes que todavía se deben no exigen pago.
21. El cierre confirma movimientos, saldos y obligaciones en una única transacción
    del servidor. La sala cerrada no ofrece incorporación de compras o partes
    pendiente. Los pagos futuros de deudas se gestionan desde la deuda.
22. El detalle del movimiento identifica la sala y el concepto que lo originaron.

## Invitados sin cuenta

El administrador puede confirmar el pago informado por un invitado web sin
exigirle un depósito. Si una cuenta recibe ese pago, debe asociar su propio cobro.
Si el invitado pagó la compra, no se crea un egreso privado para ese invitado.

Las partes impagas entre una cuenta y un invitado generan **deudas personales**
en la cuenta involucrada, tanto para cobrar como para pagar. No generan una
propuesta o aceptación online. La deuda conserva sala y participación de origen;
los pagos posteriores usan el flujo personal. No se crea un segundo adelanto
ficticio: la compra ya quedó contabilizada al cerrar.

Si la cuenta todavía no tenía una ficha para ese invitado, el servidor crea una
ficha privada con apodo libre, editable después. Las obligaciones entre dos
invitados permanecen representadas en el reparto de la sala, sin movimientos
ni deuda privada de otra cuenta.

## Persistencia, sincronización y entrega

El esquema inicial agrega `usuarios.apellido`,
`deudas.origen_sala_online_id` y `deudas.origen_participacion_online_id`.
Solo se mantiene la unicidad de apodo para contactos. No se agregan migraciones
de transición SQLite durante esta etapa de desarrollo. Las bases Expo anteriores
necesitan recrearse con datos de desarrollo descartables.

Para el servidor existente se actualiza `scripts/upgrade-schema.cjs`: agrega
columnas y retira exclusivamente el índice `unico_nombre`, conservando registros.
Usar el procedimiento de respaldo y copia aislada de SERVER-AHRE antes de desplegar.
No borrar bases reales ni usar el reinicio de cuenta como sustituto de esa actualización.
Servidor y APK deben actualizarse coordinadamente por los campos nuevos de réplica.

El cierre emite lotes privados `actualizacionSocial` para cada cuenta afectada.
Se recuperan antes de enviar cambios locales y se ajustan los saldos de depósitos
y conciliaciones pendientes por el impacto financiero del cierre. Así se conservan
gastos independientes hechos offline. La compra adjunta no vuelve a descontarse.
Los IDs de movimientos confirmados se recuperan también en una instalación nueva.

Android App Links requiere reconstruir/instalar la APK y desplegar el frontend
con `/.well-known/assetlinks.json`. El certificado publicado es público, no una
clave privada. Expo Go no verifica el dominio de la APK. Falta comprobar físicamente
el escaneo con esa APK y la asociación desplegada; el navegador/cámara del teléfono
puede mantener preferencias previas de apertura.

## Validación

Las pruebas usan SQLite real en memoria y un MySQL aislado en `127.0.0.1:13307`.
Se comprueban, entre otros: homónimos y apellido, eliminación parcial y saldada,
rollback, cierre bloqueado por otra cuenta, reintento de cierre con respuesta
perdida, gastos offline concurrentes, deudas personales de invitados en ambas
direcciones, repropuestas rechazadas, resolución automática de avisos y procedencia.
Batería completa: 540 pruebas de app y 106 de backend aprobadas, sin omisiones.
Tipos de app/herramientas y compilación TypeScript de backend correctos. Metro
exportó el paquete Android con Hermes; no es una APK instalada ni una prueba
física de permisos, gestos o App Links. No se ejecutaron cambios sobre producción.

Ajuste posterior: estado junto al nombre sin repetirlo en la fecha; pendientes
de cierre agrupados por cuenta únicamente en la sala, con separadores y acceso al
gasto en cada registro propio. Cerrar sala ya aparece deshabilitado mientras
faltan registros; la revisión no repite esa lista. La demo también bloquea cierres
incompletos y permite simular solamente registros ajenos desde la sala. El resumen
muestra fecha y participantes debajo del nombre, descripción completa y omite el
contador de gastos y Categoría por gasto. Eliminar deuda personal queda centrado
debajo de las dos acciones principales. La aceptación usa un
selector Nueva persona / Seleccionar persona con lista buscable. Registrar vínculo
muestra los bordes de sus campos desde el inicio; el ingreso a sala mantiene el
borde fino al enfocar. Se eliminó texto suelto en la tarjeta de aceptación de un gasto.
