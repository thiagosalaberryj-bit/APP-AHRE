# Interfaces de Social

## Funcionamiento actual

Los campos limitados muestran el contador junto al título: nombre, apellido y
apodo de personas, nombre y descripción de sala, descripción de deuda y de gastos,
y descripción de cada ítem de lista.
La descripción de sala admite varias líneas y mantiene el estilo compartido de
los campos de Social, con borde neutro y foco verde. Se reutiliza `SocialTextField`
con sus estilos locales en `src/styles/social/SocialTextFieldStyles.ts`.

Las pantallas comparten `SocialScreenFrame`: esperan la consulta inicial sin
esqueletos ni tarjetas de carga y conservan los datos visibles al recuperar el
foco mientras se actualiza la información local.

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

La [lógica funcional](../funcionalidades/social.md) y el
[contrato de SQLite](../base-de-datos/social.md) describen el comportamiento.

## Organización del código

- `src/screens/Social*Screen.tsx`: pantallas independientes para panel, listas,
  perfiles, detalles, formularios y confirmaciones.
- `src/components/social/`: componentes visuales y formularios independientes.
- `src/styles/social/`: estilos existentes, con reglas comunes en SharedStyles.ts.
- `src/social/socialConstants.ts`: opciones de interfaz.
- `ExpenseListForm.tsx`: lista editable, reparto común y ajustes por ítem.
- `src/social/socialService.ts`: entrada pública a los servicios de personas,
  salas, ítems, deudas, pagos y consultas.
- `src/social/useSocialScreen.ts`: carga al recuperar el foco, navegación y apariencia.
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

El panel conserva esa distribución con una escala visual más compacta, acorde
con Inicio: resumen con relleno de 12 puntos, importes de 24 puntos, acciones
con íconos de 20 puntos y esquinas menos redondeadas. Deudas recientes y Salas
usan tarjetas compactas, con títulos de 16
puntos, metadatos de 12 puntos y menor espacio interior. Sus contenedores tienen
radio de 10 puntos y las franjas de importe, de 5. El estado sin deudas usa el
mismo borde fino del tema. Los ajustes de resumen y acciones son locales al panel. El historial de deudas
comparte la card compacta del panel. Se mantienen los temas claro y oscuro.

La card de deuda se centraliza en `src/components/DebtCard.tsx`
(`TarjetaDeuda`), con estilos propios en `src/styles/DebtCardStyles.ts`.
Recibe deuda, nombre de la persona, tema y acción, sin consultar el contexto
social. Social y el historial usan el mismo diseño compacto por defecto.
Eliminar deuda y Registrar pago reutilizan su modo de solo lectura con tamaño
anterior, sin flecha ni acción. No se mantiene una segunda card de resumen.

Debajo aparecen hasta cinco deudas pendientes recientes y hasta tres salas
abiertas. Ver todas las deudas y Ver todas las salas conservan sus flechas.
Sin pendientes se muestran cero y el estado al día; sin salas abiertas se indica
su ausencia. Ya no se utiliza el parámetro de demostración sinDeudas.

El historial de deudas busca por nombre, apellido, apodo, descripción y origen.
Combina Todas/Pendientes/Saldadas y agrupa por mes expandible, con X de Y saldadas.
El buscador y el acceso de alta tienen 44 puntos de altura, borde neutro y foco
verde al escribir. Los filtros reutilizan los estilos de Movimientos y
Estadísticas: 38 puntos de alto, radio de 5 puntos y selección por relleno sin
cambiar tamaño. El contador ocupa una línea compacta, sin botón «Limpiar»,
con 8 puntos de separación respecto de los filtros y el listado. Los estilos locales están en `DebtHistoryStyles.ts`.
El encabezado mensual usa `src/components/CollapsibleSectionHeader.tsx`
(`EncabezadoSeccionPlegable`), compartido con Sincronización y disponible para
otras listas. Recibe título, resumen opcional, estado expandido y acción para
alternarlo; sus estilos están en `src/styles/CollapsibleSectionHeaderStyles.ts`.
Social conserva sus meses abiertos inicialmente y los reinicia al buscar o filtrar.
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

El perfil conserva avatar, nombre y apodo, icono de edición, resumen de
ambas direcciones y Registrar deuda. La cabecera permite leer nombres largos;
las cards del listado mantienen su truncado. Sus tarjetas muestran pendientes y saldadas.
Desde edición se puede Eliminar persona con confirmación o reactivar una ficha
inactiva. Eliminar desactiva, sin borrar filas ni cancelar deudas. Una ficha
inactiva conserva sus obligaciones anteriores y permite registrar sus pagos;
no admite nuevas deudas o selecciones hasta reactivarla.
Eliminar desde el perfil cierra el modal y vuelve a la agenda de Personas;
guardar datos o reactivar conserva la navegación actual.

En alta se conserva Cancelar; en edición se vuelve con X, fondo o Atrás. La
confirmación de baja utiliza el componente compartido de confirmaciones.

## Creación y detalle de sala

En Agregar gasto, Un ítem/Registrar lista reutiliza `SegmentedSelector.tsx`.
También lo hace Iguales/Manual en «Cómo se reparte», tanto en el formulario
individual y la edición de ítems como en las opciones rápidas de la lista.
Mantienen el estilo de las secciones de sala y la transición de 200 ms del
indicador, respetando reducir movimiento. Cambiar de opción conserva los
borradores y los valores del reparto.

«Pagó» y «Participan» usan la variante `desplegable` de `PeopleSelector`, con
controles de 38 puntos y listas compactas ancladas al campo sobre el contenido.
Las listas se anclan debajo del selector, midiendo campo y capa flotante en el
mismo sistema de coordenadas para no superponerlos. La ventana flotante
conserva el mismo tratamiento de la barra de estado que la ventana de origen
y se vuelve a medir cuando termina de abrir. Al abrir se oculta el teclado
y se recalcula la posición. Tienen scroll, borde del tema, esquinas recortadas y selección por
relleno, sin la tarjeta de diálogo centrada. Pagó se cierra al elegir; Participan
permite marcar varias personas y confirmar con Listo. Las otras selecciones de
personas conservan su presentación anterior.

El reparto en partes iguales muestra la parte exacta de cada persona usando el
mismo cálculo en centavos que el guardado. Los redondeos se distribuyen en el
orden de las personas seleccionadas. El reparto manual presenta los nombres y
entradas de monto de 38 puntos en filas compactas sin líneas de separación entre
personas, el total asignado y cuánto
falta o excede el importe. El resumen manual reduce su relleno a 8 puntos.
Solo indica que el reparto coincide cuando todas las partes son positivas y
suman el total. Cambiar entre Iguales y Manual conserva los importes escritos;
la vista previa no registra movimientos ni guarda gastos por su cuenta.

Crear sala guarda nombre, descripción opcional, categoría de egreso, icono,
color y personas. La fecha de la ocasión sigue siendo el último campo y comienza
con el día actual. Se conserva separada de la fecha de creación. Vos se incluye
automáticamente y se aplica un máximo real de tres salas abiertas por usuario.

El detalle conserva su resumen con total gastado y las opciones Balances,
Gastos y Personas reunidas en `SegmentedSelector.tsx`, el mismo selector de
Estadísticas, con tres segmentos del mismo ancho y texto en una línea. El
indicador se desliza en 200 ms al cambiar de sección y respeta reducir movimiento.
No hay animación de carga inicial. Agregar gasto
permanece dentro del resumen. Cada gasto es un ítem independiente, con pagador,
importe, personas, reparto y pagos propios.
El resumen, los balances y las tarjetas de gastos usan rellenos de 8–12 puntos,
radios de 5–10 puntos y tipografía de 12–16 puntos, con el nombre de sala a 18 y
los totales a 24. Las personas usan filas de 52 puntos, avatares de 32 y
buscador/alta de 44. Se conserva la distribución y el comportamiento de las
acciones, incluidas las salas cerradas. Estos ajustes son locales a las salas
y mantienen ambos temas.
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
por ítem en un panel inferior con título y número del ítem, cierre accesible,
contenido desplazable y acción Aplicar al ítem fija fuera del scroll.
Se adapta al teclado. La X y tocar fuera descartan los cambios de esa edición. El reparto y depósito comunes se aplican a las filas sin
ajustes propios. Las filas compactas alinean nombre y precio, muestran pagador,
reparto, personas y depósito en un resumen de hasta dos líneas, y tienen iconos de editar
en verde y borrar en rojo arriba, cada uno sobre su propio fondo.
Nombre e importe usan borde gris fino en reposo y verde al recibir el foco.
Agregar, Opciones y Escanear quedan juntos en una barra compacta encima de las
filas. No se repite Escanear debajo del selector cuando se está en modo lista.
La barra usa botones de 44 puntos con ícono y texto en una fila. Las tarjetas
tienen radio de 10 puntos, campos de 38 puntos y separación de 8 puntos entre
ítems. Encima de las filas se muestra la cantidad de ítems y el total actualizado
en centavos. Un ítem y Registrar lista omiten la nota de guardado local debajo
del botón de guardar.
Opciones rápidas abre un panel inferior con la misma animación y gesto de
arrastre de los filtros de Movimientos: entrada desde abajo, fondo progresivo
y cierre al arrastrar la manija, tocar fuera, pulsar Atrás o la X. Al aplicar,
primero termina el cierre y luego se actualiza la lista. El movimiento se
reutiliza mediante `src/utils/useBottomSheet.ts`; no modifica el selector
Un ítem/Registrar lista ni la apertura de la edición individual.
El panel tiene los controles visibles de pagador,
personas, reparto, depósito y pagos. Cambiar un valor activa automáticamente
su campo; el encabezado permite incluirlo o excluirlo sin ocultar el control.
Cada sección distingue «Sin cambios» de «Se aplicará». El pie fijo resume los
campos elegidos y muestra Aplicar a todos. No se repite el botón Cancelar. Aplicar a todos modifica
únicamente esos campos, conservando los demás ajustes de cada
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
superior y debajo quedan pendiente y Pagaste/Recibiste lado a lado,
seguidos por fecha y origen. Conserva las acciones de pago/eliminación.
Ver persona y Ver sala de origen quedan fuera del resumen como accesos
secundarios de superficie neutra, con ícono y flecha en ambos temas. El acceso a la sala también
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

La migración a TypeScript del PR #65 amplió el conjunto a 110 pruebas aprobadas,
incluida la consulta de los gastos y participantes precargados en claro y oscuro.
El APK interno de esa migración se compiló en EAS y el líder confirmó su
funcionamiento en dispositivo. La confirmación manual es general; el registro
de la build está en la [guía de TypeScript](../configuracion/typescript.md#build-android-y-validación-en-dispositivo).

Los recorridos de revisión visual incluyen navegación Atrás, teclado, texto
ampliado, creación de depósito y regreso, reinicio, cambio de cuenta, modo avión
y diálogos nativos. La lectura real requiere ML Kit, incluido en el APK y no
disponible en Expo Go.

El modal Agregar personas usa una búsqueda compacta con foco verde, filas
resaltadas al seleccionarlas y un pie fijo con Crear persona y Agregar uno
al lado del otro. Agregar indica la cantidad elegida y permanece deshabilitado
sin selección o mientras guarda. Los botones conservan sus acciones anteriores.

La confirmación de movimiento presenta descripción e importe en un resumen,
fecha y hora en filas separadas y confirmación fija al pie. Crear movimiento/Ya
registrado reutiliza `SegmentedSelector.tsx`, con el mismo deslizamiento de las
otras secciones. Las opciones existentes distinguen la selección por relleno
y borde, manteniendo el importe y las reglas de vinculación. Social elimina
las notas repetidas de guardado local de sus formularios y de Personas; el
estado de sincronización conserva los avisos de conexión sin repetir esa nota.

El detalle de deuda conserva la distribución anterior: persona, descripción y
estado, Original arriba y los importes pendiente y pagado/recibido debajo,
seguidos de fecha, origen y acciones. Solo reduce rellenos y tipografía usando
estilos locales en `DebtDetailsStyles.ts`. No incorpora una barra de progreso.
El perfil de persona conserva su rediseño en `SocialDetailStyles.ts`, con
resumen compacto y la card de deuda compartida.
