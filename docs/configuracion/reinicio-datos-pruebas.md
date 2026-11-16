# Reiniciar datos desde Perfil (herramienta temporal)

Implementado para pruebas con cuentas sintéticas, disponible en Expo Go y en una
APK interna. Conserva la cuenta y el acceso por correo/contraseña. No es la
eliminación definitiva de cuenta ni una función aprobada para la versión final.
El cambio de toasts anterior quedó en el commit local `2e317d9`; esta herramienta
es un cambio posterior coordinado con SERVER-AHRE.

## Disponibilidad

Disponible para cualquier cuenta con sesión iniciada, tanto en Expo Go como
en APK. No requiere listas de correos ni cambios en `.env` o EAS. Basta con
actualizar el backend e instalar la APK actualizada. La contraseña y la frase
de confirmación siguen siendo obligatorias. Actualizar también las apps de las
cuentas relacionadas para que consuman correctamente las bajas compartidas.

La herramienta sigue siendo temporal para poder retirarla antes de la versión
final. Implementarla o compilarla no ejecuta ningún borrado por sí solo.

## Uso

En **Perfil → Ajustes avanzados → Reiniciar mis datos**, revisar los registros y
las cuentas afectadas; escribir correo actual, contraseña y `BORRAR MIS DATOS`.
La vista previa es del servidor; también se descartan los registros y cambios
pendientes locales de esa cuenta, aunque aún no hayan llegado al servidor.

El teléfono pausa y espera las tareas de sincronización, Social e integraciones
antes de enviar la solicitud. Si hay una operación financiera en curso, no
inicia el reinicio. Mientras procesa bloquea cierre del modal y navegación
Atrás. Los errores/resultados aparecen con el componente toast, también dentro
del modal. Al terminar vuelve a Iniciar sesión: ingresar con la misma cuenta
permite empezar vacío y crear nuevamente depósitos, movimientos y relaciones.

Si el alcance cambió desde la vista previa, no borra nada: cerrar el modal y
abrirlo otra vez para revisar la nueva vista previa.

## Qué borra y qué conserva

| Ámbito | Resultado |
| --- | --- |
| Cuenta actual | Borra depósitos, saldos/historial, movimientos y sus correcciones, transferencias, recurrencias/ejecuciones, personas, salas, gastos, participaciones, deudas y pagos. |
| Preferencias | Borra las anteriores y crea preferencias predeterminadas nuevas (`es`, `sistema`, notificaciones activas, sin depósito predeterminado). |
| Social online | Borra vínculos, propuestas/deudas/pagos relacionados, invitaciones, accesos, admisiones, selecciones financieras, incorporaciones, sesiones invitadas y cachés de comandos relacionados. |
| Sala administrada por la cuenta | Elimina la sala compartida completa y sus acuerdos para todas las personas. |
| Sala administrada por otra cuenta | Conserva la sala y otros participantes; retira al participante que reinicia y elimina completos los gastos donde pagaba o tenía una parte. No deja repartos con sumas rotas. Sus obligaciones y copias privadas relacionadas también se eliminan. |
| Otras cuentas | Elimina solo acuerdos/copias de deudas y pagos relacionados. Conserva contactos privados, movimientos, depósitos, saldos, credenciales y acuerdos independientes. Un movimiento ya registrado por otra persona conserva su efecto financiero aunque se retire la asociación social. |
| Integraciones y avisos | Borra vinculación/tokens OAuth de AHRE, trabajos, operaciones obtenidas, decisiones, push, avisos y recordatorios de la cuenta. No borra ni mueve dinero en Mercado Pago. |
| SQLite/SecureStore | Borra outboxes, respaldos de reparación, cachés, autorizaciones locales y fechas de sincronización de la cuenta; cancela sus recordatorios, retira sus avisos nativos presentados y descarta enlaces/notificaciones pendientes y la preferencia de ocultar saldos. Conserva las otras cuentas guardadas en el teléfono. |
| Acceso e identidad | Conserva usuario, correo, contraseña/verificadores, identificador de instalación y autorización remota para volver a entrar. Cierra la sesión local; otras sesiones remotas de esa cuenta vencen. |
| Journal del servidor | Elimina lotes históricos propios; retira contenido relacionado del historial de las otras cuentas conservando IDs/revisiones/hash para reconocer ACK perdidos. Conserva la revisión monótona y un lote nuevo con bajas/IDs opacos y preferencias limpias, que también actúa como recibo. |

Es un reinicio lógico de datos de AHRE. No es borrado forense de páginas SQLite,
logs del sistema, backups externos o datos de servicios externos. Los recuerdos
visuales de foto de Perfil son temporales en memoria y se descartan al salir.

## Integridad y sincronización de la otra cuenta

El servidor calcula el alcance con las relaciones reales de MySQL y elimina
hijos antes que padres, incluidas reversiones. No desactiva FK ni vacía tablas
globales. El alcance requiere una huella de vista previa vigente; el borrado,
las actualizaciones de sala, las preferencias limpias y los lotes de bajas se
confirman en una sola transacción. Un fallo revierte todo.

La revisión de cada cuenta afectada avanza y se emiten eventos de usuario/sala.
La app lee los lotes antes de enviar su outbox. Si encuentra `reinicioPruebas`,
retira cambios pendientes de registros/referencias eliminadas y ACK ya
confirmados; si queda contenido independiente en un lote parcialmente afectado,
le asigna otro ID. Aplica las bajas y conserva/reaplica los cambios pendientes
independientes. Invalida cachés/comandos/avisos relacionados para que no revivan
el acuerdo. Una descripción que coincida con un ID de gasto no se interpreta
como referencia: se comparan campos de identidad, no textos libres.

La otra cuenta recibe el resultado al sincronizar con conexión; estando offline
puede mostrar una copia antigua hasta esa sincronización. El consumidor de bajas
funciona en todas las APK actualizadas. Las versiones anteriores de
la app no garantizan esta depuración; usar todas las cuentas con este código.

## Interrupciones y recuperación

Antes de enviar se guarda en SecureStore un ID de operación y token para
consultar el recibo. `GET /testing/reset/receipt?operacion=<uuid>` espera el mismo
bloqueo transaccional que el borrado. Un recibo negativo cancela ese ID de
operación: si el POST todavía estaba demorado en la red, no podrá borrar después.
Una respuesta perdida se verifica; no se
interpreta un timeout como que el servidor no borró nada.

Si está confirmado, SQLite se limpia en una transacción y se cierra la sesión.
Si no hubo commit, se conserva SQLite. Si no se puede saber el resultado o falla
la limpieza local, se conserva el marcador y se bloquean nuevas tareas; cerrar
y abrir AHRE con conexión completa la recuperación **antes** de montar los
controladores y la navegación. No borrar manualmente el marcador ni deshabilitar
la ruta del servidor mientras haya un reinicio pendiente. El token solicitante
se conserva temporalmente para verificar el recibo; al cerrar sesión se revoca.

## Archivos y retirada antes de la versión final

- Interfaz: `src/components/ProfileDataReset.tsx`, inclusión en `ProfileScreen.tsx`.
- Servicio/recuperación: `src/development/dataResetService.ts`, llamada inicial en `App.tsx`.
- Pausa de tareas: `src/development/testResetState.ts`; integración en
  `SyncStatus.tsx`, `syncService.ts`, `onlineController.tsx`, `onlineService.ts`,
  `IntegrationController.tsx` e `integrationSync.ts`.
- Bajas remotas: `src/development/resetSync.ts`, antes del push en `syncService.ts`.
- Servidor: `backend/src/testingReset.ts`, registro/health/rate limit en `app.ts`,
  guía equivalente en SERVER-AHRE.
- Pruebas: `tests/dataReset.test.ts`, casos `reinicio online` en
  `tests/onlineIntegration.test.ts`, casos `reinicio` del backend.

Para retirar: terminar todos los recibos pendientes, sincronizar todos los
clientes afectados. Quitar el componente y su inclusión, el servicio/arranque y
la pausa de tareas. Retirar
endpoint y pruebas específicas del botón. **Conservar el
consumidor de bajas mientras existan cuentas/dispositivos con lotes de reinicio
sin consumir**; no eliminarlo solo porque se ocultó el botón. Actualizar Perfil,
índices y esta guía. No cambiar dependencias ni crear migraciones de transición.

## Verificación

Pruebas con SQLite en memoria y una instancia MySQL desechable y exclusiva en
`127.0.0.1:13307`, con ruta de datos verificada antes de escribir. Cubren disponibilidad
en APK sin variables, eliminación de relaciones locales sin FK rotas, respuesta perdida,
resultado no confirmable, contraseña/confirmación, cualquier cuenta autenticada, conservación
del acceso y de depósitos ajenos, salas propias y ajenas, y pendientes mixtos.
La prueba táctil/visual en Android y la instalación de una APK siguen siendo
verificaciones de dispositivo; las pruebas automáticas no las sustituyen.

Resultado final del 14/11/2026: app **527/527**, backend **104/104**, sin fallos
ni omisiones; tipos de ambos repositorios correctos y exportación Android/Hermes
correcta con la herramienta habilitada. Estos resultados no acreditan despliegue
ni pruebas táctiles en una APK instalada.

Ajuste posterior solicitado: reinicio disponible para cualquier cuenta autenticada,
en Expo Go y APK, sin variables de entorno ni lista de correos. Se conserva la
contraseña, confirmación, integridad de Social y recuperación. Verificación del
ajuste: 6 pruebas locales y 3 integraciones con MySQL aprobadas; backend: 3 casos
de reinicio aprobados. Tipos de app y backend correctos. El recuento integral
anterior corresponde al estado previo a esta simplificación.


La vista previa espera ahora las operaciones activas de esta instalación antes de calcular su alcance. Esto evita confirmar una vista previa anterior al último ACK de un pago. Las operaciones posteriores de otra cuenta siguen invalidando la huella y requieren revisar la vista previa; se conserva la protección ante cambios reales. La integración de dos cuentas espera la confirmación del otro participante antes de iniciar su reinicio.
