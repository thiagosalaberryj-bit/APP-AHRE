# Estado y validación de AHRE

Referencia vigente: **8 de noviembre de 2026**, rama
`codex/social-online-recurrencias`, versión configurada 0.8.0 y código Android 11.
Este estado corresponde al código local; no identifica una APK instalada ni
la revisión que corre en producción. El changelog queda a cargo de la revisión.

## Estado actual

| Área | Comportamiento implementado |
| --- | --- |
| Finanzas privadas | SQLite y sincronización por cuenta, saldos en centavos, depósitos propios y correcciones con historial. |
| Salas | Locales hasta publicarse; categorías por gasto, administración del creador y permisos limitados de edición. |
| Acceso | Enlace global con contraseña/admisión, QR y enlaces individuales heredados; identidad conservada al registrar una cuenta. |
| Deudas | Propuestas con aceptación, pagos informados/confirmados/rechazados y perdón sin movimientos ficticios. |
| Tiempo real | HTTP autenticado, eventos persistentes, WebSocket y recuperación periódica. |
| Recurrencias | Motor local idempotente, pausa/reactivación/reprogramación y tarea Android WorkManager sin red. |
| Demos | Cuenta local autorizada y modo desarrollo, sin solicitudes al servidor; no disponibles en release. |

## Correcciones de la auditoría

- Publicar conserva depósitos y movimientos preparados en la misma transacción
  que crea la sala. Un reintento no duplica selecciones ni incorporaciones.
- Los avisos nuevos guardan huella económica. Aceptar uno no invalida a otras
  personas; cambiar importe, pagador o reparto sí exige revisión. MySQL agrega
  `huella_gasto` de forma aditiva; los avisos anteriores siguen validando versión.
- Las asociaciones de deudas privadas se bloquean y verifican al aceptar.
  No se ocultan conflictos de propuestas cruzadas ni se fusionan registros.
- El modal financiero bloquea su cierre hasta completar el guardado y su acción
  posterior. La web usa las obligaciones actuales para el balance y las partes.
- La app evita descargar y reescribir todo sin novedades: consulta eventos cada
  15 segundos y reconcilia al iniciar/reanudar, ante pendientes y cada 60 segundos.
  El backend agrupa las consultas de relaciones de deudas.
- Se retiraron cuatro imports/tipos del servidor, 18 estilos de filtros antiguos
  de depósito y un estilo de sala sin referencias. No se cambian estilos globales.

No se reparan automáticamente selecciones ausentes de salas publicadas antes
de la corrección ni acuerdos duplicados históricos: requieren revisión explícita
de sus datos, sin inventar asociaciones ni fusionar deudas reales.

## Evidencia automatizada vigente

| Verificación | Resultado |
| --- | --- |
| TypeScript habitual, app/herramientas y servidor/pruebas | Correcto. |
| Comprobación adicional `noUnusedLocals`/`noUnusedParameters` | Correcta en las fuentes de ambos repositorios. |
| Suite completa APP | **343 aprobadas, 0 fallos, 0 omisiones**. |
| Suite completa backend | **60 aprobadas, 0 fallos, 0 omisiones**. |
| Integración | SQLite real, MySQL 8.4.13 aislado, HTTP y WebSocket. |

Las integraciones usaron una instancia temporal en `127.0.0.1:13317`, bases
`ahre_test_*` y credenciales sintéticas en memoria. Se apagó al terminar y no
se accedió a producción. La suite comprueba además rollback de publicación
inválida, respuestas perdidas, dos avisos independientes, cambio de pagador,
propuestas cruzadas y ampliación repetida del esquema sobre avisos heredados.
Sin el entorno MySQL, esas integraciones se omiten; no deben contarse como aprobadas.

## Validación manual y entrega pendientes

- Recorrer las interfaces actuales en Expo Go y navegador real, con ambos temas,
  nombres largos, escalado de texto, teclado y navegación Atrás.
- Probar cámara/QR, portapapeles, compartir por otra app, WhatsApp y apertura de
  la invitación en Android. Las demos locales no validan esos enlaces reales.
- Verificar WSS detrás de Nginx y recuperación entre dispositivos con la entrega
  actualizada. Las pruebas automatizadas usan un servidor HTTP/WebSocket local.
- Comprobar WorkManager sin red con una build nativa y la app cerrada. Expo Go
  no incluye el módulo propio ni ML Kit; las pruebas Node no validan su ejecución.
- Con autorización posterior, coordinar despliegue con respaldo y copia aislada,
  build Android, revisión de PR y publicación. **Esta revisión no genera APK,
  no hace commit/push ni despliega cambios.**

Notificaciones/push, traducción integral y recuperación general de pendientes
de una instalación revocada siguen fuera de esta entrega. Se conservan los datos
pendientes y las restricciones de autorización existentes.

El [contrato técnico](arquitectura/social-online-recurrencias.md) reúne roles,
conectividad y fronteras financieras. La [guía de pruebas](social-validation.md)
separa demos locales del recorrido real A/B/C.

## Antecedentes históricos

<details>
<summary>Ver evidencia anterior, etapas y builds de noviembre de 2026</summary>

Las secciones siguientes conservan la evidencia y las limitaciones de cada
etapa, no el estado vigente. Sus expresiones «actual» o «más reciente» se refieren
a la fecha original. Los resultados y pendientes vigentes son los de arriba.

Referencia histórica del 3 de noviembre de 2026. Este documento concentraba el
estado operativo que antes se repetía en el README.

## Estado por etapa

| Etapa | Resultado |
| --- | --- |
| 1 · Entorno y línea base | Dependencias preparadas con autorización, tipos y MySQL temporal aislado. |
| 2 · Identidad y correo | Recuperación por ID después de cambiar correo offline, sin duplicar la cuenta. |
| 3 · Correo rechazado | Reparación guiada con respaldo, vista previa y conservación de eventos financieros. |
| 4 · SQLite y cola | Lecturas sin preparar lotes, índice por lote y recuentos limitados durante envío. |
| Corrección de saldo | El movimiento del mismo minuto de creación del depósito impacta el saldo; conserva el historial anterior. |
| 5 · Backend | Carga acotada de perfil/preferencias, joins e índices existentes y agrupaciones de dominio. |
| 6 · Social en la app | Consultas sin escrituras tras preparar identidad, adelantos agrupados y formateadores reutilizados. |
| 7 · Limpieza y dependencias | Archivos/imports/CSS sin uso retirados; grupo de formularios retirado con autorización. |
| 8 · Documentación | Guías y README; sin cambios funcionales ni despliegue ejecutado por el agente. |
| 9 · Integración final | Revisión técnica local aprobada; publicación, revisión del PR y merge pendientes. |

El líder confirmó los recorridos manuales de las etapas 2 a 7 en Expo Go,
incluidos correo, depósito nuevo, reconexión, Social y la prueba rápida tras
retirar dependencias. Son confirmaciones funcionales del recorrido solicitado,
no una matriz exhaustiva de dispositivos, accesibilidad o rendimiento.

## Evidencia automatizada más reciente

La etapa 9 volvió a aprobar tipos e integración: 158 pruebas de la app y 45
del backend, sin fallos ni omisiones. Ver el [informe final](revision-final.md).
La exportación Android y la auditoría npm siguientes corresponden a la etapa 7.

Después de la retirada autorizada de paquetes en la etapa 7:

- Tipos de APP-AHRE correctos; revisión adicional sin imports/parámetros sin uso.
- 158 pruebas de la app y 45 del backend aprobadas, cero fallos y cero omisiones.
- MySQL Community 8.4.13 temporal en 127.0.0.1:13307; credenciales sintéticas,
  permiso sobre bases `ahre_test_*` y proceso apagado al terminar.
- Exportación Android/Hermes correcta; primer intento bloqueado por escritura
  del temporal de Windows y reintento correcto con permisos suficientes.
- Árbol npm coherente; versiones, URLs e integridad de paquetes conservados sin cambios.

La exportación no genera un APK. Los escenarios automatizados de captura nativa
no sustituyen una prueba de ML Kit en Android. Ver [OCR](funcionalidades/ocr.md),
[entorno de pruebas](configuracion/entorno.md) y [dependencias](configuracion/dependencias.md).
Los recuentos de pruebas son evidencia fechada, no un número que cada cambio deba mantener.

## Recorrido manual de referencia

1. Con backend actualizado y conexión, registrar una cuenta sintética e ingresar.
2. Editar nombre/preferencias y esperar pendientes en cero.
3. Con la app cargada, cortar internet; crear depósito con 1000, egreso 100 e
   ingreso 50. Debe mostrar 950 incluso en el minuto de creación.
4. Reconectar: cero pendientes, mismo saldo y movimientos sin duplicados.
5. Crear una persona y sala de dos participantes, gasto 100 pagado por vos con
   el depósito y reparto igual, sin devolución ajena. Cerrar: saldo 850 y 50 por cobrar.
6. Registrar devolución 25 en ese depósito: saldo 875 y pendiente 25.
7. Recorrer agenda, sala, gasto y deuda; consultas sucesivas no crean pendientes
   después de sincronizar la identidad. Una edición o pago sí debe generarlos.
8. Cerrar sesión normalmente y volver a ingresar: conservar datos, preferencias y saldos.

La recuperación de correo duplicado se verifica usando otra cuenta que exista
solo en servidor u otra instalación, para no detenerse primero en la validación
local de duplicados. Seguir [Perfil](interfaces/perfil.md#recuperación-guiada-de-correo-rechazado-etapa-3).

## Límites y trabajo pendiente

- Sincronización con la app activa; no hay ejecución nativa con la app cerrada.
- Social es personal por cuenta; no hay salas compartidas por web entre cuentas.
- Pendientes revocados conservados, sin interfaz general de recuperación. La
  reparación disponible está limitada al rechazo específico de perfil/correo.
- La consulta de Social mantiene su conjunto completo; paginar requiere revisar
  los consumidores. Los lotes financieros del backend también cargan estado completo.
- Notificaciones muestra ejemplos; guardar idioma no implementa traducción integral.
- «Acerca de AHRE» toma la versión de `Constants.expoConfig.version`; actualmente 0.7.0, con código Android 5 en el manifiesto.
- Los movimientos ya guardados con una hora anterior al depósito no se
  recalculan automáticamente al instalar la corrección del formulario.
- Auditoría de la app: 14 paquetes afectados (3 altos, 9 moderados, 2 bajos)
  del árbol de Expo; backend: cero en la consulta del 3 de noviembre. La propuesta
  de Expo 58 requiere una migración separada, no `audit fix --force`.

Los commits locales de resguardo anteriores a la etapa 7 son `dadf614` en
APP-AHRE y `b142f7e` en SERVER-AHRE. Las etapas posteriores pueden permanecer
sin commit hasta la revisión. Un commit, un push, un merge, un despliegue y una
build de APK no son equivalentes; no asumir publicación por estos resultados.


## Comprobación documental de la etapa 8

La revisión comprueba enlaces locales, imágenes, UTF-8 y cercos de código en
la documentación de ambos repositorios.

Las fuentes de la app, dependencias y scripts de despliegue se conservaron.
No se repiten pruebas funcionales por estos cambios exclusivamente documentales.

## Verificación de los últimos ajustes de interfaz

El 5 de noviembre de 2026 se verificó el commit `63363c8` de la rama
`codex/cambios-interfaz`: `npm run typecheck` correcto y `npm test` con
194 pruebas, 186 aprobadas, 8 omitidas y ningún fallo. Las omisiones dependen
de entornos externos; no equivalen a pruebas aprobadas. La suite incluye la
comprobación nueva del cierre anterior con depósitos nuevos, registros
históricos y reversiones. Posteriormente se completaron los ajustes de creación
de sala, contraste de categorías y etiqueta del selector de depósitos para 0.7.0.

Estos ajustes unifican cards y filtros, las proporciones de los resúmenes de
Inicio y Social, la variación del balance general y la presentación compacta
con desplazamiento del dato mensual en Detalle de depósito. TypeScript y las
pruebas no verifican layout ni animaciones nativas: la revisión en dispositivo
debe cubrir textos largos, privacidad, claro/oscuro y reducción de movimiento.
El túnel Expo de desarrollo no implica que se haya generado o publicado un APK
con estos cambios.

La verificación final de 0.7.0 del mismo día repitió TypeScript y la suite completa:
194 pruebas, 186 aprobadas, 8 omitidas y ningún fallo. También pasó la exportación
Android/Hermes (2157 módulos y 38 recursos). Incluye los últimos cambios de
creación de salas, colores de categorías y contraste de íconos. Los escenarios
de interfaz cubren búsqueda, confirmación y reapertura de participantes y
persistencia del color de la sala en ambos temas. No se generó un APK 0.7.0.

## Rama Social online y recurrencias · 6 de noviembre de 2026

La implementación agrega categorías por gasto, eliminación lógica, motor recurrente,
salas compartidas, identidades, invitados y eventos WebSocket.
Ver [contrato técnico](arquitectura/social-online-recurrencias.md).

La verificación conjunta más reciente pasó 215 pruebas de la app y 46 del backend,
sin fallos ni omisiones, con SQLite real y MySQL temporal aislado.
Incluye permisos, respuestas perdidas, conflictos, reconocimiento de deudas privadas,
registro de invitados, carga inicial de otra instalación y HTTP/WebSocket.
La actualización MySQL se probó dos veces sobre un esquema heredado aislado:
conservó categorías, lotes originales, saldos y la primera ocurrencia recurrente.

Se verificó la web de invitados en ambos temas y a ancho de teléfono con datos ficticios.
La compilación Android está en validación en EAS; la prueba de WorkManager con
la app cerrada en un dispositivo físico sigue pendiente y no se da por verificada.
El despliegue remoto no se ejecutó: SSH rechazó el acceso del alias documentado.
No se modificaron datos de producción ni el changelog.

## Corrección de recuperación inicial de cuentas

La cuenta existente se creaba localmente sin preferencias pero marcada como preparada, omitiendo su carga inicial. Se mantiene pendiente hasta descargar la instantánea y se recupera también el estado vacío ya marcado preparado con revisión cero y sin preferencias. No modifica datos del servidor ni descarta finanzas locales existentes. La regresión reproduce una descarga fallida, reintenta y comprueba depósitos y perfil. Verificación: 216 pruebas de app y 46 de backend, sin fallos ni omisiones. Build Android 7.

## Detalles de movimientos y recurrencias

El panel recurrente ahora se renderiza en el detalle del depósito. El detalle permite editar y presenta una eliminación roja con confirmación. Por pedido actualizado, eliminar crea una corrección inversa vinculada y conserva el original con fecha_eliminacion; ambos se excluyen de estadísticas. Se verifican idempotencia, saldo, acuerdos y ocurrencias futuras. La recuperación de instantáneas difiere FK hasta el commit para admitir originales y reversiones fuera de orden. Verificación: 218 pruebas de app y 46 del backend, cero fallos y cero omisiones. No se compiló otro APK para estos ajustes; se prueban desde Expo Go, y el servidor requiere actualizar las reglas de corrección privada.

## Pestañas y filtros del detalle de depósito

Se reutilizan los componentes de búsqueda y filtros de Movimientos. Recurrentes tiene contador y contenedor plegado inicialmente, tiempo restante actualizado cada minuto y fechas sin identificador técnico de zona. El acceso desde el depósito pasa movimientoId; el detalle también acepta el ID de la copia recibida como respaldo para consultar el registro real. TypeScript y verificación conjunta: 224 pruebas de app y 46 de servidor, todas aprobadas y sin omisiones. Los recorridos visuales en Expo Go requieren la revisión en el dispositivo.

## Revisión del flujo Social online · 7 de noviembre de 2026

La revisión actual pasa TypeScript en ambos repositorios y las suites completas:
281 pruebas de app y 53 de servidor, sin fallos ni omisiones. Las integraciones
usan SQLite real y MySQL 8.4.13 temporal, con bases independientes por escenario;
no se conectan a producción. Se comprobó también la sintaxis Bash de los scripts
y el empaquetado local del servidor sin enviar archivos por SSH.

El recorrido nuevo vincula dos cuentas por correo sin publicar una sala, reconoce
sus anotaciones privadas como un único acuerdo y registra pagos parciales desde
el depósito propio. Pierde respuestas de solicitud, aceptación, pago y recepción
para comprobar los reintentos. El pendiente cambia solo al confirmar; rechazar
otro pago conserva el egreso del remitente y no crea un ingreso del destinatario.
La prueba de sobrepago ahora confirma dos pagos en paralelo: solo uno prospera.

Se corrigieron tres casos detectados durante la revisión:

- Una solicitud de actualización durante otra descarga social programa otra
  pasada serial antes de resolver. Evita mostrar el pendiente anterior después
  de confirmar un pago y conserva la exclusión mutua de las descargas.
- Crear una invitación confirma primero la sincronización privada de la ficha.
  Una persona recién agregada obtiene así su vínculo al aceptar la invitación.
- El registro o ingreso del invitado conserva decisiones previas de vínculos.
  La primera asociación emite eventos de sala y de sus propietarios; volver a
  ingresar no devuelve un vínculo confirmado al estado pendiente.

Las integraciones cubren publicación, permisos y delegación, invitados, cambios
offline, conflictos, cierre, incorporación en depósitos propios, correcciones
privadas, tickets WebSocket y recuperación HTTP de eventos tras reiniciar el
transporte. Los escenarios de navegador ejecutan el JavaScript de invitados con
un adaptador de DOM; no sustituyen una prueba visual de navegador y teléfono.

Los cambios de esta revisión permanecen locales: no se desplegó el servidor, no
se generó otro APK ni se publicaron commits. Para cerrar la validación de uso
falta recorrer app y navegador contra el despliegue actualizado, incluyendo
escaneo QR, apertura del enlace en Android, WSS detrás de Nginx y ambos temas.
Los ajustes de la app se prueban recargando Expo Go; un APK anterior no los incluye.

## Rediseño de Social · build 10

La app pasa 285 pruebas con SQLite real y MySQL temporal aislado, cero fallos y
cero omisiones. TypeScript y la exportación Android/Hermes pasan. Los escenarios
nuevos cubren contraseña incorrecta, múltiples ingresos con enlace global,
protección de fichas vinculadas, corrección de una decisión rechazada, selección
de depósito sin efecto inmediato, incorporación única al cierre y revisión de
selecciones ante cambios de importe. Una parte pagada sin depósito no genera
deuda. El recorrido físico queda en [la guía manual](social-validation.md).

La entrada global web se revisó localmente en ambos temas. La nueva imagen
frontend conserva la corrección de permisos Nginx. No se desplegaron cambios ni
se modificaron datos de producción desde esta sesión.

El backend completó 54 pruebas, cero fallos y cero omisiones. EAS recibió la build 10
con ID 38745167-d8f9-463e-9c6a-2598b694980f; el envío confirmó estado NEW.
No equivale a compilación finalizada ni a APK probada en un dispositivo.

</details>
