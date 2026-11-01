# Interfaces de Social

## Funcionamiento actual

Social es un registro personal offline conectado a SQLite. No utiliza cuentas
remotas, invitaciones ni sincronización. Cada usuario local conserva su agenda,
salas, ítems, pagos y deudas. El trabajo comenzó con el maquetado del Issue #18;
el usuario autorizó continuar con su funcionamiento en la misma rama sin otro Issue.

Se mantienen las pantallas, tarjetas, fuentes, colores y distribución aprobados.
Los datos de ejemplo fueron retirados de las vistas principales. El ticket de
OCR reutiliza la pantalla y reconocimiento existentes. La lista manual funciona
en Expo Go; la lectura nativa requiere el módulo ML Kit del proyecto.
Nombres, descripciones e importes largos se truncan con puntos suspensivos en
una línea. Los resúmenes mantienen sus columnas y tamaños de fuente; los campos
editables conservan el contenido completo.

La [lógica funcional](../funcionalidades/social.md), el
[contrato de SQLite](../base-de-datos/social.md) y los
[diagramas de escenarios](../diagramas/social/README.md) describen el comportamiento.

## Organización del código

- `src/screens/Social*Screen.tsx`: pantallas independientes para panel, listas,
  perfiles, detalles, formularios y confirmaciones.
- `src/components/social/`: componentes visuales y formularios independientes.
- `src/styles/social/`: estilos existentes, con reglas comunes en SharedStyles.ts.
- `src/social/socialConstants.ts`: opciones de interfaz.
- `ExpenseListForm.tsx`: lista editable, reparto común y ajustes por ítem.
- `src/social/socialService.ts`: entrada pública a los servicios de personas,
  salas, ítems, deudas, pagos y consultas.
- `src/social/useSocialScreen.tsx`: carga al recuperar el foco, navegación y apariencia.
- `src/social/SocialDataContext.ts`: datos del usuario para los componentes de
  cada pantalla, sin un registro global mutable ni fixtures de producción.
- `src/navigation/socialRoutes.tsx`: adapta las rutas existentes a cada pantalla.

SocialScreenFrame conserva encabezados, teclado, desplazamiento y carga. Provee
los datos a sus descendientes y ofrece Reintentar si falla la consulta. Las
pantallas no ejecutan SQL. Las vistas secundarias mantienen su navegación de Stack.

## Panel e historiales

Sin un depósito propio activo con saldo positivo, el panel muestra el requisito
y un acceso a Depósitos. Las altas quedan deshabilitadas o muestran ese mismo
aviso al abrir su ruta o modal directamente. Consultar y editar registros previos
sigue disponible; los depósitos de otra cuenta no habilitan Social.

La tarjeta Tus pendientes muestra Te deben y Debés sin compensar direcciones,
con los accesos Nueva deuda, Personas y Nueva sala. Los importes se calculan
sobre deudas propias pendientes, incluyendo pagos parciales y contactos inactivos.

Debajo aparecen hasta cinco deudas pendientes recientes y hasta tres salas
abiertas. Ver todas las deudas y Ver todas las salas conservan sus flechas.
Sin pendientes se muestran cero y el estado al día; sin salas abiertas se indica
su ausencia. Ya no se utiliza el parámetro de demostración sinDeudas.

El historial de deudas busca por nombre, apellido, apodo, descripción y origen.
Combina Todas/Pendientes/Saldadas y agrupa por mes expandible, con X de Y saldadas.
El nombre mantiene elipsis y la fecha queda fija a la derecha de la tarjeta.
Cada tarjeta abre el detalle de esa deuda. Las canceladas se conservan en SQLite
pero se retiran del listado visible, como explica su confirmación de eliminación.

El historial de salas busca por nombre, categoría, personas y fecha de creación.
Combina Todas/Activas/Cerradas y usa las mismas tarjetas que el panel: icono,
nombre, cantidad de personas, fecha de creación y total gastado. La categoría
permanece dentro del registro, sin agregarse a las tarjetas. Las salas se ordenan
por fecha y hora de creación; las cerradas se identifican como solo lectura.

## Agenda y perfiles

La agenda muestra contactos activos en orden alfabético, con nombre, apodo y
acceso al perfil. El buscador y el botón + mantienen el mismo alto. Agregar abre
el modal existente: Nombre, Apellido y Apodo son obligatorios, con hasta 20
caracteres en el apodo. Se comprueban coincidencias normalizadas contra fichas
activas e inactivas, excluyendo la ficha actual al editar.

Guardar persiste la ficha y espera la recarga antes de cerrar el modal. La agenda
limpia una búsqueda anterior para mostrar inmediatamente el contacto. Ante error se
conservan los campos y se muestra un toast. Ver persona existente permite abrir
una coincidencia. El registro desde selectores utiliza la misma agenda con su
modal de alta; al regresar se conserva el borrador anterior.

El perfil conserva avatar, nombre/apodo truncados, icono de edición, resumen de
ambas direcciones y Registrar deuda. Sus tarjetas muestran pendientes y saldadas.
Desde edición se puede Eliminar persona con confirmación o reactivar una ficha
inactiva. Eliminar desactiva, sin borrar filas ni cancelar deudas. Una ficha
inactiva conserva sus obligaciones anteriores y permite registrar sus pagos;
no admite nuevas deudas o selecciones hasta reactivarla.
Eliminar desde el perfil cierra el modal y vuelve a la agenda de Personas;
guardar datos o reactivar conserva la navegación actual.

En alta se conserva Cancelar; en edición se vuelve con X, fondo o Atrás. La
confirmación de baja utiliza el componente compartido de confirmaciones.

## Creación y detalle de sala

Crear sala guarda nombre, descripción opcional, categoría de egreso, icono,
color y personas. La fecha de la ocasión sigue siendo el último campo y comienza
con el día actual. Se conserva separada de la fecha de creación. Vos se incluye
automáticamente y se aplica un máximo real de tres salas abiertas por usuario.

El detalle conserva su resumen con total gastado y las opciones Balances,
Gastos y Personas, del mismo ancho y con iconos al lado del texto. Agregar gasto
permanece dentro del resumen. Cada gasto es un ítem independiente, con pagador,
importe, personas, reparto y pagos propios.
Agregar gasto comparte los estilos de las acciones del panel, con icono encima
del texto. Ocupa la misma altura y ancho que Total gastado en una fila sin salto;
la cantidad de gastos se muestra debajo de esa fila.
La lista de Gastos usa tarjetas compactas como Balances: icono pequeño,
descripción, pagador y reparto en una misma línea, e importe en el bloque
lateral con flecha. La fecha se conserva en el detalle, no en estas tarjetas.
La sección Gastos muestra los ítems sin el acceso Edición rápida. Las opciones
rápidas se mantienen en Agregar gasto → Registrar lista. Cada gasto se puede
abrir desde su tarjeta y editar individualmente mientras la sala esté abierta.
Las salas cerradas conservan su historial de solo lectura. El formulario no
mantiene un modo separado para editar los gastos de la sala en bloque.
Total gastado y los importes de Balances reutilizan SocialAmountSummary,
el mismo contenedor de fondo suave usado en Tus pendientes del panel.

Personas utiliza el buscador y + existentes. El modal permite agregar personas
registradas. Quitar exige la confirmación roja existente; persiste la baja de
esa pertenencia y conserva sus partes y pagos anteriores. Agregarla otra vez
reactiva la misma relación. Quitar de una sala no desactiva la ficha de la agenda.

Balances conserva las filas compactas que abren el ítem, con colores y swap
como en Deudas. Las salas abiertas muestran pendientes provisionales, incluidos
los de terceros. Solo las obligaciones que te involucran pasan a tu registro al
cerrar. Los pendientes de terceros quedan dentro de la sala.

## Registro y edición de ítems

Se mantiene importe, Qué se pagó, Pagó/Participan en una fila, Iguales/Manual
y Pagos y pendientes plegable. El reparto se calcula y valida antes de guardar.
Los centavos restantes de partes iguales se asignan por un orden estable.
El reparto manual debe sumar exactamente el total, con partes positivas.

El pagador puede estar fuera del reparto. Su propia parte, si existe, ya está
cubierta por la compra; no genera otro egreso. Todos pagaron prepara las entregas
correspondientes. Guardar pide asociar los depósitos o movimientos propios;
los movimientos nuevos se aplican recién al cerrar la sala. El diálogo explica
esta demora y el detalle muestra los nombres de los depósitos asociados.

La edición precarga los importes numéricos, conservando decimales. Solo se
admite en salas abiertas y verifica la versión del registro. Permite corregir
importe, personas, pagador, reparto y pagos marcados mientras son borradores.
Actualiza las asociaciones sin afectar el saldo ni crear compensaciones.

Un ítem conserva el formulario rápido. El modo se elige con el mismo selector
segmentado de Egresos/Ingresos de Estadísticas. Escanear ticket aparece únicamente
en la barra superior de Registrar lista. Registrar lista permite hasta 100 filas
con descripción e importe, agregar/quitar filas y ajustar reparto y depósito
por ítem en modal. El reparto y depósito comunes se aplican a las filas sin
ajustes propios. Las filas compactas alinean nombre y precio, muestran pagador,
reparto, personas y depósito en un resumen truncado, y tienen iconos de editar
en verde y borrar en rojo arriba, cada uno sobre su propio fondo.
Nombre e importe usan borde gris fino en reposo y verde al recibir el foco.
Agregar, Opciones y Escanear quedan juntos en una barra compacta encima de las
filas. No se repite Escanear debajo del selector cuando se está en modo lista.
Opciones rápidas abre un modal con campos seleccionables: pagador, personas,
reparto, depósito y pagos. Solo se despliegan los controles marcados y Aplicar
a todos modifica únicamente esos campos, conservando los demás ajustes de cada
ítem y sus nombres e importes. Aplicar queda deshabilitado hasta elegir un cambio.
El formulario de reparto ya no se muestra permanentemente debajo de la lista.
Cambiar de modo conserva el borrador de ambos formularios.
Guardar lista confirma todos los borradores en una transacción: un error revierte
la lista completa y no modifica saldos.

Escanear ticket abre OcrScreen con destino social y salaId, reutilizando cámara,
galería, recorte, servicio y parser. OcrSocialResult devuelve las líneas mediante
popTo a RegistroSocial; no utiliza OcrExpenseForm ni crea un egreso. Las líneas se
agregan a la lista existente una sola vez por lectura. Importes ausentes o inválidos
se completan manualmente; el total no se copia como importe de cada producto.
El ticket simulado fue retirado. El cierre sigue siendo quien aplica los movimientos.

## Deudas y confirmación de movimientos

Nueva deuda conserva persona, dirección, monto y descripción. En Me debe se
asigna automáticamente Deudas al adelanto y se solicita el depósito del egreso o uno ya
registrado. Le debo guarda solo la obligación, sin ingreso ni selección inicial
de depósito. El depósito se elige al registrar el pago, que genera un egreso.
Se reutiliza el mismo diálogo de movimientos
que los ítems y pagos; cancelar no guarda ni la deuda ni el movimiento. Deuda y
origen se confirman en una transacción. El detalle y el registro de pago identifican
el adelanto y su depósito, usando el campo de origen existente.
El detalle reúne persona, apodo, descripción y estado. Original ocupa la fila
superior; debajo quedan el pendiente y el dinero pagado o recibido lado a lado,
seguidos por fecha y origen. Reutiliza los
contenedores de importe y las acciones de pago/eliminación. Ver persona y
Ver sala de origen quedan fuera del resumen, como accesos secundarios con
icono destacado y flecha del verde claro del texto del botón secundario, con
contraste sobre su fondo verde en ambos temas. El acceso a la sala también
queda fuera de las tarjetas del perfil.
Registrar pago conserva la tarjeta de
consulta, Saldar todo/Otro importe y el monto editable. Los pagos parciales y
completos actualizan el pendiente; se rechazan sobrepagos y pagos de deudas canceladas.
Saldar muestra Deuda saldada y vuelve al inicio de Social; un pago parcial vuelve
a la vista anterior con Pago registrado. Una deuda saldada no ofrece Eliminar deuda
y su cancelación también queda bloqueada si se intenta abrir la ruta directamente.

SocialFormActions ejecuta los guardados, bloquea envíos repetidos y conserva
el formulario ante un error. El aviso de maqueta fue reemplazado por la nota de
guardado local y los resultados se comunican con el toast compartido.

Cuando guardar requiere dinero propio, SocialMovementModal permite seleccionar
un depósito para crear el movimiento o elegir uno ya registrado, con igual
importe y dirección. Reutiliza DepositSelector, DateSelector, TimeSelector y
los controles de Social. Si faltan depósitos ofrece crearlos y regresar al
borrador. Varias operaciones propias se revisan en pasos consecutivos, incluso
si utilizan depósitos distintos. Vincular un movimiento no cambia otra vez el saldo.

Eliminar deuda conserva el resumen, el botón rojo y la segunda confirmación.
Cancelar el modal no modifica nada. Confirmar marca la deuda como cancelada,
conservando persona, origen, pagos y movimientos, sin registrar un cobro ni una
devolución. No se vuelve a agregar un botón Cancelar al pie.

## Cierre y solo lectura

Cerrar sala conserva su revisión: total gastado, ítems, personas, partes pagadas
y pendientes, nombres, dirección e importes. Confirmar consolida las obligaciones
propias, crea los movimientos de los gastos y pagos preparados y cierra la sala
atómicamente. Revalida los depósitos; vincula movimientos existentes sin duplicarlos.
La revisión muestra Total gastado, Por cobrar y Por pagar en los mismos
contenedores de importe del panel, con iconos y truncado para valores largos.

Una sala vacía, toda pagada o con pendientes exclusivamente entre terceros
puede cerrarse sin deudas personales. Después conserva sus ítems y personas en
solo lectura. Los pagos de deudas propias continúan disponibles desde Deudas y
los perfiles; sus estados actualizados se consultan dentro de la sala.

## Verificación

Las pruebas de interacción ejecutan los componentes y sus callbacks con servicios
reales sobre SQLite en memoria, sustituyendo React y los elementos nativos.
Cubren los recorridos principales en claro y oscuro, el modal de movimientos,
los pagos decimales, integrantes, baja/reactivación, cierre y cancelación.
No son un motor de layout ni sustituyen revisar las pantallas en Expo Go.

La auditoría del 30 de octubre de 2026 dejó 92 pruebas automatizadas aprobadas
en el conjunto del proyecto y una exportación Android con Hermes correcta.
Incluye la edición individual desde el detalle del gasto y las opciones rápidas
de Registrar lista, tras retirar el modo separado de edición masiva.

En el dispositivo deben revisarse navegación Atrás, teclado, texto ampliado,
creación de depósito y regreso, reinicio de la app, cambio de cuenta, modo avión
y los diálogos nativos. La lectura real requiere ML Kit, no disponible en Expo Go.
No se preparó un APK ni se verificó la captura nativa en esta etapa.
