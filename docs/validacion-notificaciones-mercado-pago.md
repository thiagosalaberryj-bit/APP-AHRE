# Validación de notificaciones y Mercado Pago · 9 de noviembre de 2026

App y servidor se prepararon desde `main` actualizado, en la rama
`codex/notificaciones-mercado-pago` de cada repositorio. El repositorio
AHRE-MP-MOVIMIENTOS se consultó como referencia sin modificarlo.

| Comprobación | Resultado |
| --- | --- |
| TypeScript de app y herramientas | Correcto. |
| TypeScript de backend y pruebas | Correcto. |
| Suite completa de APP-AHRE con backend y MySQL | 450 aprobadas, sin fallos ni omisiones. |
| Suite completa de SERVER-AHRE con MySQL | 73 aprobadas, sin fallos ni omisiones. |
| Casos específicos de inicialización, depósito, MP offline y planificación | 52 aprobados. |
| Exportación Android Metro/Hermes | Correcta; no genera APK. |
| Compose y flujo n8n | YAML/JSON válidos; ejecución Docker no comprobada. |

Se utilizó el binario MySQL 8.4.3 existente, con `--no-defaults`, una carpeta nueva,
`127.0.0.1:13317` y MySQL X desactivado. Se comprobó `@@datadir` y `@@port` antes
de escribir. Las suites crearon bases propias; al terminar se detuvo esa instancia
y se eliminaron únicamente sus carpetas temporales. No se usaron datos ni el
servicio habitual de Laragon.

Los casos nuevos verifican registro MP atómico offline, idempotencia, históricos,
ignorar/recuperar, asociación sin doble impacto, descarte al eliminar el depósito,
lectura independiente de resolución, horarios y cambio de zona, cuotas concurrentes,
PKCE/cancelación, cifrado autenticado, páginas Search con fallo de red y recibos push.
Search y Expo se simularon en los casos de transporte; no se consultaron cuentas
Mercado Pago reales ni se enviaron avisos a dispositivos reales.

Se agregaron contadores en el depósito, destinos contextuales de sala y
comprobación de canales Android. La presentación visual, batería, reinicio,
OAuth completo, cobertura real de Search y push en un Android físico requieren
la configuración externa de la [guía del servidor](https://github.com/thiagosalaberryj-bit/SERVER-AHRE).

Los recordatorios locales preparan 60 días, renovables al abrir la app. La entrega
no promete ejecución JavaScript mientras está cerrada ni recepción de eventos
nuevos del servidor sin internet. Expo Go omite el token remoto y conserva las
funciones locales compatibles; puede mostrar la advertencia informativa propia
de expo-notifications sobre sus límites.

La validación inicial del 9/11 no publicó ramas, PRs, APK ni despliegues.

## Cierre de versión · 11 de noviembre de 2026

- App 0.9.0/build 14 y backend 0.3.0; changelogs actualizados por pedido
  explícito del líder antes de abrir los PR.
- TypeScript de app, herramientas, backend y pruebas correcto.
- Suite completa de app: 463 aprobadas, cero fallos y cero omisiones, incluyendo
  integración real contra backend y MySQL aislado. Backend: 97 aprobadas, sin
  fallos ni omisiones. Instancia MySQL 8.4.3 temporal, loopback 13327.
- Los nuevos casos comprueban borradores de descripción offline, incorporación
  con texto personalizado sin sobrescribir el original, rechazo atómico de
  descripciones vacías, avisos persistentes de éxito/error e identificación
  antigua sin consumir usos. Los ensayos Search/push emplean datos sintéticos.
- Se actualizaron los adaptadores de la prueba de rendimiento del depósito
  para aislar la consulta de vinculación MP; permanecen las verificaciones
  de 10.000 movimientos y paginación del componente real.
- El usuario confirmó la reparación real: seis ingresos y seis egresos. Esto
  no acredita que Search entregue rendimientos ni todas las clases de movimientos.
- Pendiente configuración Firebase/FCM v1 y comprobación nativa de push,
  permisos, app cerrada, reinicio y modo avión en Android físico.
- No se despliega el servidor ni se publican APK en la landing durante este cierre.

## Ajustes de tarjetas · 12 de noviembre de 2026

Indicadores de movimientos por registrar en salas abiertas y cerradas, suma
en Gastos y distribución por gasto sin aumentar la altura de las tarjetas.
Los pagos de deudas sin gasto asociado se muestran en Pagos por registrar
y abren el formulario existente con la operación correcta. La selección previa
al cierre reduce pendientes sin registrar dinero anticipadamente.

Etiquetas sobre importes compartidas por movimientos, deudas, recurrencias,
MP, salas, gastos y balances: dos segundos al inicio, recorrido de un segundo
y dos segundos al final antes de reiniciar. Se midieron ancho y escala de fuente;
se conservan accesibilidad y desplazamiento manual con Reducir movimiento.
Las etiquetas financieras indicadas por el líder usan peso regular y colores
para distinguir importe, estado y revisión pendiente. Demos existentes actualizadas
sin borrar decisiones ni añadir cargos por mostrar ejemplos.

TypeScript correcto. Última ejecución: 57 pruebas (Social y etiqueta animada)
aprobadas, sin fallos ni omisiones; comprobación de varias repeticiones y pausas
con reloj simulado. Antes del ajuste de pausas, 84 pruebas de tarjetas, listas
y Social aprobadas. La animación nativa requiere revisión visual en el teléfono.
Este commit no incluye ajustes al comportamiento de plegado del encabezado.

## Ajustes locales posteriores: resolución e historial combinado

Cambios sin commit ni despliegue, verificados el 12 de noviembre de 2026.

- TypeScript correcto. Suite de app: 450 aprobadas, cero fallos y 39 pruebas
  MySQL omitidas en la ejecución local habitual.
- Reloj y adaptador nativo simulados con SQLite real: pago parcial conserva
  pendientes; pago final resuelve avisos de días anteriores sin marcarlos vistos
  y elimina alarmas futuras. Pasar una deuda a acuerdo online no la salda.
- Una recurrencia anticipada permanece pendiente hasta aceptar la ocurrencia;
  las repeticiones de esa ocurrencia se cancelan al avanzar. Salas pendientes
  se repiten por fechas fijas y se cancelan al incorporar sus operaciones.
- Un día sin registros conserva su aviso informativo y programa el siguiente;
  no crea obligaciones atrasadas ni movimientos financieros automáticamente.
- Historial conectado de 23 remotas y 7 locales: orden común, máximo diez por
  página, treinta IDs únicos, filtros y copia offline sin duplicados.
- Backend: seis casos API de notificaciones/Search en MySQL aislado y cuatro
  pruebas de roles de pagos aprobados. La prueba de cola de 1.000 usuarios
  completó 2.000 páginas simuladas sin duplicados ni superar cinco consultas
  concurrentes. No es una medición contra cuentas reales de Mercado Pago.
- Encabezado: pruebas de interacción aprobadas en ambos temas; la capa exterior
  de la barra compacta recorta las dos esquinas inferiores.

Queda la comprobación física de entrega con modo avión/app cerrada y la revisión
visual del scroll y redondeado en Expo Go/APK. Las simulaciones prueban fechas,
cancelaciones y estados; no sustituyen la entrega de Android. La programación
concreta cubre 60 días renovables al usar la app, sujeta al sistema operativo.

## Alarmas exactas (cambios locales posteriores)

- TypeScript correcto; suite de 495 casos: 456 aprobados, 39 integraciones MySQL
  omitidas y cero fallos. Incluye los ajustes locales de selección MP.
- Adaptador probado con permiso concedido/denegado, errores del puente, APK sin
  módulo y Android anterior a 12. Expo Go no consulta ni abre funciones nativas
  ausentes. Interfaz verificada en ambos temas al regresar de Ajustes.
- SQLite y reloj simulados verifican que cambiar permiso o forzar regreso
  reemplaza las alarmas existentes sin duplicarlas; una reconciliación normal
  conserva las programaciones sin recrearlas continuamente.
- Expo config prebuild confirma SCHEDULE_EXACT_ALARM. Autolinking Android detecta
  ModuloAlarmasExactas junto al módulo de recurrencias existente.

No se compiló el puente Kotlin localmente: no hay SDK Android configurado.
Requiere una APK nueva y comprobar entrega en dispositivo, concesión/revocación
del acceso especial y retorno a la app. No se cambia el backend ni el horario
de eventos push remotos. No se hizo commit en este ajuste. El 13 de noviembre
se enviaron estas fuentes a EAS con --no-wait; el enlace está en la guía de
publicación. Envío confirmado no equivale a compilación nativa aprobada ni a
entrega física validada; ambas comprobaciones siguen pendientes.

## Claridad de permisos y repetición al cambiar horarios

TypeScript correcto y suite de 500 casos: 461 aprobados, 39 integraciones MySQL
omitidas, cero fallos. Se cubre el bloqueo del modal en ambos temas sin borrar
tipos ni horarios, sin pedir permisos si el general está apagado y sin permitir
guardar cambios por callbacks de accesibilidad. Perfil distingue la preferencia
activa de un bloqueo real de Android; la activación abre Ajustes o solicita
permiso según el estado y versión del sistema.

Regresión de SQLite con reloj simulado: una deuda a cobrar genera un aviso a las
09:00; se deja pendiente y se cambia a las 10:30 del mismo día. Se verifica otra
programación nativa y otra entrada pendiente con ID distinto. No se exige
resolver el primer aviso. Elegir una hora igual al instante actual mueve la
próxima entrega al día siguiente. Sin cambiar hora se conserva la idempotencia.
Las simulaciones no sustituyen comprobar presentación/sonido en Android físico.
No se hizo commit ni se generó otra APK con este ajuste.

Revisión posterior de Perfil: 20 pruebas específicas aprobadas y TypeScript
correcto. El interruptor se ve apagado si Android no concede permiso, conserva
la preferencia de AHRE y los tipos/horarios, y verifica el permiso al intentar
activar. La nueva solicitud de APK 55f805ed se registra en la guía de publicación;
se confirmó el envío sin esperar el resultado de compilación.

## Guardado de horarios y entrega local independiente de la red

Última suite: 511 casos, 472 aprobados, 39 integraciones MySQL omitidas y cero
fallos. TypeScript correcto. Se reproducen con SQLite y adaptador nativo simulado:

- Un guardado que ocurre durante otra reconciliación espera su turno y deja
  instaladas las alarmas del horario más reciente antes de confirmar éxito.
- Una respuesta antigua del backend no sobrescribe el horario recién guardado.
- Al abrir el historial se incorporan los avisos previstos vencidos sin esperar
  el controlador ni Internet, sin duplicar registros.
- Una alarma retrasada aún pendiente en Android se conserva al pasar la hora;
  resolver la deuda la cancela. Una alarma futura perdida se vuelve a instalar.
- Los errores nativos se propagan a Guardar y permiten reintentar, en vez de
  quedar ocultos por el controlador de sincronización.
- Perfil mantiene la altura de la fila con una flecha para activar y un
  interruptor solo cuando puede entregar; pruebas en ambos temas.
- La prueba local de diez segundos exige permiso y que el SDK confirme el ID
  programado. No solicita un token push ni modifica movimientos financieros.

La APK 55f805ed que se venía probando no incluye estas correcciones posteriores.
En esa revisión, la ausencia de entrega reportada todavía requería comprobar la
nueva APK en Android físico. Historial previsto y aceptación de la programación
por el SDK no son recibos de entrega. No se cambió el backend ni se hizo commit.

## Ajustes visuales posteriores a la comprobación en Android

El usuario confirmó que los recordatorios y la prueba de diez segundos funcionan
en su teléfono con la APK posterior c33f1e33. Es una comprobación reportada por
el usuario; las pruebas automatizadas no certifican la entrega física.

- Perfil conserva el interruptor cuando Android permite avisos, tanto encendido
  como apagado en AHRE. Solo muestra la flecha cuando Android deniega el permiso.
- Guardar mantiene el mismo ancho y distribución del formulario; sus controles
  quedan bloqueados y conserva horarios y tipos. Se eliminó el estilo de botón
  deshabilitado que deformaba el contenedor completo.
- Se retiraron el botón temporal de diez segundos y su función de diagnóstico.

TypeScript correcto y 34 pruebas específicas aprobadas: Perfil y modal en ambos
temas, permisos, alarmas exactas y ciclo de recordatorios. La validación completa
previa a la entrega posterior completó 512 casos: 473 aprobados, 39 integraciones
MySQL omitidas y cero fallos. Los cambios se publicaron en el commit dca0f39 y
se enviaron a EAS f0d2bf46 por pedido del usuario, sin esperar la compilación.
No requieren despliegue del backend. El seguimiento se registra en la guía de
publicación.
