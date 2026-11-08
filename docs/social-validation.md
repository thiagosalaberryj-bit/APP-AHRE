# Prueba completa de Social

## Preparación

Comprobar que backend y clientes incluyan las correcciones de la misma revisión.
Esta revisión se verifica localmente: no genera APK ni despliega cambios. Una APK
anterior no incorpora el JavaScript actual. Para pruebas entre dispositivos,
actualizar SERVER-AHRE con su guía social y utilizar una build Android identificada
por versión/código y revisión, o dos clientes de desarrollo compatibles.
Estos ajustes no cambian el esquema SQLite ni requieren borrar los datos locales.

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
2. Enviar a b@pruebas.ahre.test. B acepta en Social → Personas → Solicitudes de vínculo.
3. En A debe aparecer Cuenta vinculada. Si ya estaban vinculados, no repetir.
4. Una segunda ficha no debe poder vincularse a esa misma cuenta automáticamente.

## 2. Crear una sala compartida y entrar

1. A abre Social → Salas → Crear sala. Agrega las fichas de B y C.
2. Activa Compartir online, escribe una contraseña de al menos ocho caracteres y crea.
3. Abre Compartir sala: debe aparecer un enlace global, QR e ícono para copiar.
4. Copia y comparte varias veces: el enlace y QR deben mantenerse y abrir sin regeneración.
5. B usa Social → Salas → Unirme a sala. Pega el enlace, escribe su nombre y la contraseña.
6. Como B ya está vinculado y asignado a la sala, recupera su participación sin duplicarse.
7. C abre el mismo enlace desde el navegador. Una contraseña incorrecta debe mostrar error
   y permitir corregirla. Con nombre y contraseña correctos, queda esperando aprobación.
8. Mientras espera, C no ve gastos, participantes, importes ni depósitos.
9. A abre la pestaña Personas de la sala → Ingresos: debe ver el contador. Toca la solicitud de C,
   elige Persona de mi agenda o Crear persona y confirma Admitir.
10. Intentar asignarlo a B debe rechazarse por pertenecer a otra cuenta. Luego debe poder
    corregir la elección y asignarlo a C. Si C tenía una sesión invitada anterior, confirmar
    Reemplazar acceso anterior; esto revoca el acceso anterior, sin borrar su historia.
11. La web de C debe mostrar la sala tras la aprobación y conectarse en tiempo real.

En WhatsApp, usar el enlace HTTPS completo. La cámara normal del teléfono abre
la web con el QR; el escáner de Social abre el ingreso en la app. Abrir en la app
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
sin que esa persona elija depósito, conservar Pagado con incorporación pendiente;
la falta de depósito no vuelve a convertir el pago en deuda.

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

Las deudas deben aparecer automáticamente en Online. No hay que crearlas ni
aceptarlas otra vez. La sala queda en solo lectura. Abrir y sincronizar varias
veces no debe repetir movimientos. Si falta una selección, el detalle del gasto
permite incorporarla después; no debe bloquear el cierre ni crear otra deuda.

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
