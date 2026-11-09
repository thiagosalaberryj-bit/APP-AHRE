# Interfaces de Social

## Personas, solicitudes y permisos de la sala

Personas separa Integrantes e Ingresos. Integrantes reutiliza la búsqueda, los
avatares y las filas de la sala local; el botón + agrega desde la agenda.
Cada fila muestra un contador de solicitudes y navega al detalle del integrante
en `SocialRoomPersonScreen.tsx`, parametrizado por sala y persona. El listado
original conserva su estado al volver. El detalle reutiliza los controles de
solicitudes y permisos, sin crear una pantalla distinta por cada integrante.
Ingresos contiene tarjetas compactas, sin formularios ni decisiones
incrustados. Tocar una abre la revisión: elegir una ficha de agenda o crear una
persona, y luego Admitir o Rechazar. Las fichas vinculadas a otra cuenta no se
ofrecen; reemplazar un acceso invitado anterior exige una acción explícita.

El creador puede permitir o quitar el registro y edición de gastos a una persona
desde su fila. Este permiso habilita únicamente gastos en la app: no concede
administración de integrantes, invitaciones, permisos ni cierre. El servidor
comprueba el permiso al recibir cada comando, incluso si la app conserva una
copia anterior a su revocación.

Los invitados web pueden enviar Ya pagué mi parte sobre un gasto de una sala
abierta. El administrador acepta o rechaza ese aviso desde la fila de la persona.
Aceptar modifica la marca de parte pagada de la sala; no crea movimientos ni un
pago de deuda automáticamente. Si cambia el importe, pagador o reparto, o la
sala cierra antes de la revisión, el aviso debe revisarse y enviarse nuevamente.
Aceptar otro aviso del mismo gasto no lo invalida. La deuda pendiente de
una identidad invitada se conserva al registrarse. La web no ofrece registro de
pagos financieros; el invitado sin cuenta tampoco puede hacerlo mediante API.

La web reutiliza los colores de ambos temas y la presentación de tarjetas,
resumen y pestañas del móvil: Gastos, Personas y Mis solicitudes. Cada gasto
permite desplegar el reparto y consultar el estado del aviso.

El enlace de invitación se presenta en una entrada de solo lectura de una línea;
se recorta visualmente según el ancho sin afectar el enlace completo que se copia.
La sección Personas muestra los pedidos agrupados y su contador de pendientes,
su estado y las acciones Marcar resuelta y Rechazar solicitud para el administrador.
Si no hay pedidos, lo indica explícitamente. No envía una notificación push;
la actualización se muestra dentro de la sala.

## Compartir y entrar a una sala

Los modales de invitación comparten un encabezado compacto, cierre, contenido
desplazable y acción al pie, con área segura y adaptación al teclado. Unirme
separa Pegar enlace y Escanear QR; cerrar el modal desmonta la cámara. Aceptar
abre directamente la sala. Personas reúne las invitaciones y los pedidos;
el enlace personal se muestra en un campo y Compartir por una app abre el menú
nativo del teléfono. Agregar personas usa filas con avatar y selección visible.

El campo del enlace incluye un ícono de copiar con un área táctil de 48 puntos.
Copia el enlace completo aunque se vea abreviado, cambia a una marca de
confirmación y anuncia Enlace copiado. Ante un fallo permite reintentar
o usar Compartir por una app. Copiar y compartir son acciones separadas.

El cupo de tres salas abiertas corresponde a las administradas por la cuenta;
participar en las salas de otras personas no bloquea crear una propia.

El botón Salas del inicio abre un menú con Crear sala y Unirme a sala.
Crear abre el formulario existente; Unirme abre el ingreso por enlace o QR.
Los acuerdos se gestionan en Deudas y las solicitudes de vínculo en Personas.
Compartir sala queda dentro del resumen de la sala y permite habilitar el enlace
global protegido con contraseña. El enlace y QR se reutilizan al volver a compartir.
El nombre identifica la ficha: AHRE no envía correo ni mensajes automáticamente.
El administrador utiliza Compartir enlace para enviarlo mediante otra app.

El QR contiene el enlace HTTPS: una cámara externa abre la web para invitados;
el escáner de Social acepta la invitación con la cuenta de la app. También se puede
pegar el enlace. La app rechaza otros orígenes y formatos inválidos. El enlace
global sigue vigente hasta que se renueve o deshabilite; los enlaces personales
anteriores conservan su vencimiento. La interfaz informa estas condiciones y
conserva las restricciones de conexión y permisos.

La landing de SERVER-AHRE enlaza a /invitacion/, donde se explica cómo entrar con
el enlace recibido. La web permite participar sin cuenta y luego registrarse o
ingresar conservando la participación. No hay un buscador público de salas.

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

El resumen principal comparte proporciones con el Balance de Inicio: acciones
de altura mínima de 74 puntos, etiquetas de 12 con seminegrita y recuadros de
totales con fondo del tema, radio de 10 y relleno de 12. Mantiene dos totales
independientes, «Te deben» y «Debés», mientras Inicio presenta el saldo general.

La card de deuda se centraliza en `src/components/DebtCard.tsx`
(`TarjetaDeuda`), con estilos propios en `src/styles/DebtCardStyles.ts` que
reutilizan la base de Movimientos en `FinancialRecordCardStyles.ts`.
Recibe deuda, nombre de la persona, tema y acción, sin consultar el contexto
social. Social y el historial usan el mismo diseño compacto por defecto.
Perdonar deuda y Registrar pago reutilizan el mismo tamaño en modo de solo
lectura, sin flecha ni acción. No se mantiene una segunda card de resumen.

Debajo aparecen hasta cinco deudas pendientes recientes y todas las salas
abiertas o con movimientos propios por registrar, sin límite de tarjetas.
Las salas cerradas muestran su estado y las tarjetas indican cuántos movimientos
faltan incorporar a los depósitos de esta cuenta. El contador descuenta las
incorporaciones locales sin esperar la sincronización. Una sala cerrada sale del
inicio al completar sus registros y sigue disponible en Ver todas las salas.
El límite de creación de salas administradas no cambia. Ver todas las deudas y
Ver todas las salas conservan sus flechas. Sin pendientes se muestran cero y el
estado al día; sin salas abiertas ni registros pendientes se indica su ausencia.
Ya no se utiliza el parámetro de demostración sinDeudas.

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

El perfil conserva avatar, nombre y apodo, menú de tres puntos, resumen de
ambas direcciones y Registrar deuda. La cabecera permite leer nombres largos;
las cards del listado mantienen su truncado. Sus tarjetas muestran pendientes y saldadas.
Desde los tres puntos del perfil se elige Editar persona, Vincular cuenta,
Eliminar persona o Reactivar persona si está inactiva. Eliminar requiere una confirmación aparte. Eliminar desactiva, sin borrar filas ni cancelar deudas. Una ficha
inactiva conserva sus obligaciones anteriores y permite registrar sus pagos;
no admite nuevas deudas o selecciones hasta reactivarla.
Eliminar desde el perfil vuelve a la agenda de Personas;
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

Crear sala guarda nombre, descripción opcional, icono,
color y personas. La fecha de la ocasión sigue siendo el último campo y comienza
con el día actual. Se conserva separada de la fecha de creación. Vos se incluye
automáticamente y se aplica un máximo real de tres salas abiertas por usuario.

Participantes aparece antes de Categoría y abre el mismo
`AddRoomPeopleModal.tsx` usado para agregar integrantes a una sala existente.
Incluye búsqueda por nombre, apellido o apodo, contador, selección previa y
botones Crear persona/Listo en una fila. Confirmar aplica la selección;
cancelar conserva la anterior. La categoría se elige en cada gasto; la sala admite categorías distintas.
Los colores reutilizan directamente `DepositScreenStyles.ts`: muestras de
34 puntos, nombres cortos en una línea, marca de selección y resumen del color.
El orden visual es Azul, Verde, Violeta, Rosa y Amarillo, como en depósitos;
no cambia el color inicial ni los valores persistidos de la sala.

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
a la vista anterior con Pago registrado. Una deuda saldada no ofrece Perdonar deuda
y la acción también queda bloqueada si se intenta abrir la ruta directamente.

SocialFormActions ejecuta los guardados, bloquea envíos repetidos y conserva
el formulario ante un error. El aviso de maqueta fue reemplazado por la nota de
guardado local y los resultados se comunican con el toast compartido.

Cuando guardar requiere dinero propio, SocialMovementModal permite seleccionar
un depósito para crear el movimiento o elegir uno ya registrado, con igual
importe y dirección. Reutiliza DepositSelector, DateSelector, TimeSelector y
los controles de Social. Si faltan depósitos ofrece crearlos y regresar al
borrador. Varias operaciones propias se revisan en pasos consecutivos, incluso
si utilizan depósitos distintos. Vincular un movimiento no cambia otra vez el saldo.

Perdonar deuda reutiliza el formulario de revisión y la segunda confirmación.
Registrar pago y Perdonar deuda aparecen en una fila dentro del mismo componente
de acciones, tanto en deudas locales como online. Solo quien cobra puede perdonar.
El perdón cierra el pendiente y conserva la deuda visible en Saldadas, separando
lo perdonado de lo cobrado. No modifica movimientos ni ofrece un botón Cancelar
al pie. Las eliminaciones históricas anteriores conservan su tratamiento.

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

El detalle de deuda muestra la persona como acceso al perfil y los tres
importes en una sola fila: Original, pendiente y pagado/recibido. Cada importe
se puede tocar para ver el valor completo. Fecha y origen/estado online quedan
en la misma fila. La propuesta online está fuera del resumen financiero.
El perfil de persona conserva su rediseño en `SocialDetailStyles.ts`, con
resumen compacto y la card de deuda compartida.


## Integración online y recurrencias

La [guía de la implementación](../arquitectura/social-online-recurrencias.md) define el contrato actual de categorías por gasto, identidades, conectividad, recurrencias y eliminación lógica.

El acceso principal «Salas» del inicio reúne «Crear sala» y «Unirme a sala»
en un selector modal. El cupo de salas propias bloquea solo la creación;
unirse sigue disponible. No se repite un botón de invitación bajo el listado.
El listado completo no repite «Mis salas» ni el acceso para unirse. Las tarjetas
de sala comparten componente y presentación compacta en ambos lugares.
El escáner se limita a un marco cuadrado de hasta 280 puntos con recorte interno.

Nueva deuda ofrece «Proponer deuda online» como opción desactivada inicialmente,
antes de guardar. Requiere una persona con cuenta vinculada y confirmada y una
sesión online. Primero se registra y sincroniza la deuda privada; después se
propone el acuerdo. Si el envío falla, el registro se conserva y se abre su
detalle para reintentar con el mismo identificador. El inicio ya no tiene el
acceso Compartir deuda ni su modal selector. Las deudas anteriores mantienen
la acción compacta de propuesta en su detalle.

En Deudas aparecen propuestas sin asociar, vínculos por confirmar e
incorporaciones pendientes. Los acuerdos asociados se administran desde su
detalle. La ficha de persona agrupa sus deudas bajo encabezados plegables:
«Lo que te debe», «Lo que le debés» y «Pagos saldados». Cada título muestra en
la misma fila su cantidad o «Sin deudas», sin líneas ni una tarjeta exterior.
Solo el icono lleva color: títulos, cantidades e importes son neutros. El resumen
de ambas direcciones reutiliza SocialAmountSummary, como el inicio de Social. Las tarjetas solo abren el detalle; registrar pagos,
eliminar y ver la sala de origen quedan dentro de ese detalle.


Desde los tres puntos del perfil, «Vincular cuenta» abre un modal para ingresar
el correo exacto de la cuenta AHRE. No hay un botón ni un formulario inline en
el perfil. Al lado del apodo se muestra siempre «Sin cuenta vinculada»,
«Vínculo pendiente», «Confirmación pendiente» o «Cuenta vinculada».
El apodo se recorta en una línea cuando falta espacio, dando prioridad al estado.
Para vínculos existentes el menú ofrece gestionar la solicitud o consultar la
cuenta. La cuenta destinataria acepta o rechaza desde Personas,
en «Solicitudes de vínculo». La solicitud enviada puede cancelarse desde el
perfil. No requiere una sala ni cambia nombres, apodos o deudas anteriores.
Aceptar habilita futuras propuestas, no comparte automáticamente ningún gasto
ni deuda. Los tres puntos del perfil reúnen editar, vincular y eliminar/reactivar,
sin botones repetidos al pie ni dentro del formulario de edición.
Notificaciones, contadores globales y push quedan para una etapa posterior.


Los menús de opciones de persona y salas reutilizan SocialOptionsMenu con la
presentación del menú de detalle de depósito: cabecera, iconos en recuadros,
filas con descripción, separador y cierre por X, fondo o Atrás. Elegir una
opción cierra el menú antes de abrir la edición, confirmación o invitación.


El listado conserva el selector de origen Todas/Locales/Online y ofrece una sola
fila desplazable de filtros: Todas, Saldadas, Me deben y Debo, con las mismas
pastillas que Movimientos. Me deben y Debo muestran solo deudas sin saldar.
En Online se agrega la pastilla «Invitaciones» con la cantidad pendiente, como
alternativa a los demás filtros. Las tarjetas de propuestas pendientes usan
fondo y textos neutros, icono de sobre, etiqueta «Invitación» y borde
del color de foco del tema. Al aceptar o rechazar dejan de llevar ese borde y
de aparecer en el filtro Invitaciones.
No hay un segundo selector de dirección ni una opción Pendientes redundante.
La búsqueda se combina con estos filtros. Las tarjetas se ordenan por la última
actividad (creación, pago, anulación o decisión online) en el inicio, listado y
perfil. Los grupos mensuales del listado siguen esa actividad; la fecha original
de la deuda se conserva en la tarjeta y en su detalle.
El detalle incluye el historial privado (adelantos, pagos y anulaciones) y los
registros online con sus fechas y estados. El importe original no se edita.
Una deuda online aceptada reutiliza el resumen, botón «Registrar pago» y formulario
de las deudas personales. Ya no agrega un segundo resumen «Acuerdo con esta
persona» ni un formulario de pago dentro del historial. Los registros online usan
la misma presentación del historial privado. Quien debe puede elegir saldar todo
u otro importe y su depósito; quien cobra selecciona un pago informado y su
depósito o movimiento existente para confirmar la recepción. El acreedor puede
registrar otro pago recibido por su cuenta, que queda confirmado; el deudor siempre
espera la confirmación del receptor. Informar un pago no reduce el pendiente hasta
su confirmación. Las deudas compartidas no ofrecen eliminación privada del acuerdo.
Las acciones online del detalle reutilizan los estilos globales de botones
principales y secundarios. No hay un botón «Actualizar acuerdos»: el controlador
recupera cambios por WebSocket y consulta cada 15 segundos como respaldo mientras
la app está activa. Las propuestas ofrecen «Aceptar» y «Rechazar» en una fila
con separación entre botones; rechazar conserva los registros privados anteriores
de ambas partes. Solo si hay deudas locales compatibles se ofrece seleccionarlas
para evitar duplicarlas; sin coincidencias, aceptar incorpora la deuda online.
Quien informa un pago online elige primero su depósito de salida. El receptor
elige su depósito de entrada antes de confirmar desde el registro del historial;
rechazar no requiere depósito ni crea un ingreso. Solo confirmar reduce la deuda.
Se conserva el identificador del envío hasta incorporar la operación financiera,
para que una respuesta perdida no duplique el movimiento. Las incorporaciones
que todavía faltan quedan accesibles en el detalle de la misma deuda.

## Rediseño online · build 10

Crear sala ofrece Compartir online con contraseña. La cabecera contiene Compartir
sala: el enlace global y QR se reutilizan desde el caché. Personas es una única
lista con contadores; tocar una fila abre el detalle de esa persona dentro de
la sala, con solicitudes, permisos y baja.
Las admisiones se asignan explícitamente a una ficha y no exponen la sala antes
de aprobarse. Las fichas vinculadas exigen la cuenta correspondiente.
El selector de admisiones omite las fichas con cuenta asignada, tanto por su
identidad dentro de la sala como por un vínculo confirmado en la agenda.

El detalle del gasto permite al administrador marcar partes pagadas y al
participante informar su pago. Mis movimientos abre un formulario de selección
propia de depósito o movimiento existente; se aplica al cierre. Una parte pagada
sin depósito es una incorporación pendiente, no otra deuda. Deudas ofrece
Todas/Locales/Online e Invitaciones. Las tarjetas abren el detalle e historial
con las decisiones y pagos; no se incrustan los formularios en el listado.
Ver [recorrido completo](../social-validation.md).

## Salas demo interactivas

En la cuenta de desarrollo local, las salas «Demo» muestran los mismos controles
según el rol de cada vista. Las solicitudes, gastos, partes pagadas, admisiones,
permisos, cierre y pagos se procesan en SQLite y actualizan la interfaz mediante
los observadores existentes. Elegir un depósito e incorporar o confirmar un pago
modifica únicamente los movimientos y saldos de esa cuenta ficticia. Los botones
de compartir abren sus modales con enlaces de demostración, sin acceso web real.
Los cambios persisten entre aperturas. Esta simulación exige `__DEV__`, el correo
de la cuenta de prueba y su autorización local vigente con generación cero.
No se usa el transporte HTTP ni se encolan comandos sociales para el servidor.

Los registros del historial tienen acceso al movimiento privado si existe. Los
avisos por confirmar y las incorporaciones pendientes llevan borde verde y abren
Registrar pago con el registro seleccionado. Confirmar, rechazar y asociar a un
depósito se resuelven allí; el detalle no incrusta formularios de depósitos. La
asociación permite crear un movimiento o adjuntar uno propio compatible sin
duplicar el saldo. Rechazar conserva el registro y no incorpora un ingreso.

### Invitación e historial de deuda

Una propuesta online pendiente o rechazada muestra `DebtInvitation.tsx` en lugar
 del historial. El componente tiene una cabecera compacta, estado de carga y las
acciones Aceptar/Rechazar en una fila. Vincular un registro anterior solo aparece
si hay deudas locales compatibles. Al aceptar, `DebtDetails.tsx` monta el historial
y coloca «Deuda registrada» dentro de su listado. Las deudas locales mantienen su
historial habitual.

La elección entre invitación e historial usa el estado de la deuda de la vista
social, sin esperar a una segunda lectura de caché. El historial nunca muestra
una interfaz de invitación como alternativa durante su carga. Se retiró
`OnlineFinancePanel.tsx`, con los formularios antiguos de pago e incorporación,
el bloque de vínculos inactivo y sus estados e importaciones sin consumidores.
Las operaciones financieras siguen en `RegisterPaymentForm.tsx`.

Registrar pago utiliza `SegmentedSelector` para Crear movimiento/Adjuntar
movimiento, igual que la confirmación común de movimientos. El título, el resumen y la acción principal distinguen Confirmar pago recibido,
Registrar nuevo pago recibido e Informar mi pago. El resumen de confirmación
muestra quién informó el importe y su fecha; una recepción nueva indica que se
registra por cuenta propia. Mientras se carga la información online se muestra
un estado de carga, sin adelantar un formulario de recepción nueva.

### Un formulario por escenario y perdón de deudas

El acceso Registrar pago abre exclusivamente un pago nuevo. Tocar un aviso
del historial abre ese pago informado para confirmar o rechazar; no permite
cambiarlo por uno nuevo ni editar su importe. Tocar una incorporación abre
solo la asociación a movimientos. Cada caso se identifica con una etiqueta
compacta (Cobro que recibiste, Dinero por confirmar, Pago que vas a enviar o
Registro en tu depósito), con explicación dentro del mismo contenedor;
se retiró el selector que mezclaba tipos de registro. Crear/Adjuntar movimiento
se conserva como elección financiera dentro del escenario.

Perdonar deuda está disponible para quien cobra una deuda local o una online
aceptada con saldo pendiente. Una confirmación explícita cierra todo el pendiente sin
generar movimientos privados. El historial registra Perdonaste o Te perdonaron y separa
el importe perdonado de lo realmente recibido o pagado. Los avisos sin confirmar
quedan rechazados, conservando su historial y los movimientos privados anteriores.
El comando comprueba el pendiente revisado y rechaza cambios concurrentes.

La cuenta de desarrollo incluye Demo · Pagos y perdón: original $1.000, un pago
confirmado de $200 pendiente de asociar, un aviso de $150 y $800 pendientes.
Permite recorrer las tres entradas y perdonar el resto. Se incorpora una sola vez,
sin restablecer ejemplos editados ni cambiar los saldos al generarlo.

Los ejemplos desde el deudor se agrupan en «Demo · Del lado de quien debe», una
sala cerrada administrada por Bruno. Sus cuatro deudas permiten consultar un
perdón recibido, un pago rechazado, un aviso esperando confirmación y un pago
confirmado. El historial dice «Te perdonaron» desde ese rol y aclara que no hubo
ingresos ni egresos. Un pago rechazado identifica quién lo rechazó y conserva el
pendiente; si falta asociar su movimiento privado, el formulario aclara que esa
asociación no modifica la deuda. Un aviso sin confirmar sigue esperando al
acreedor. Estos casos están disponibles en Todas/Online, incluidos los saldados,
sin crear movimientos ni alterar saldos al preparar los ejemplos.

La deuda «Demo · Compra compartida con Bruno» empieza sin pagos. Desde Registrar
pago se informa un importe y se elige el depósito propio. El botón «Simular
respuesta de Bruno» abre el diálogo existente para aceptar o rechazar cada pago
pendiente o perdonar el resto. Las respuestas actualizan el mismo historial,
resumen y sala; no crean movimientos de la otra persona ni duplican los propios.
Solo se ofrecen en la cuenta local de desarrollo autorizada, sin HTTP.

Todos los pagos online conservan el título «Pago» y muestran la decisión debajo:
En espera de la persona, Rechazado por la persona o Confirmado por la persona.
Un pago rechazado no ofrece asociar un depósito; si ya tiene movimiento privado,
la flecha permite consultarlo. Abrir una ruta anterior de asociación tampoco
habilita crear un movimiento desde ese pago. Los pagos confirmados sin registro
financiero conservan la opción de elegir dónde incorporarlos.

## Reutilización de la interfaz online

Se retiró `OnlineButton.tsx`: las acciones online utilizan `SocialButton.tsx`,
con los botones principales y secundarios rellenos de ambos temas. Las filas de
consulta usan tarjetas neutras con flecha; no se presentan como botones verdes.
`RoomFinanceSelection.tsx` reutiliza el selector Crear movimiento/Adjuntar
movimiento, DepositSelector y SocialChoiceGroup, como Registrar pago.

En los gastos, Partes y pagos reúne los estados y checks del administrador en
una sola tarjeta; Mis movimientos muestra una tarjeta por operación. Los avisos
también se consultan desde la persona, en su historial de solicitudes.
Los permisos siguen comprobándose en el servicio y en el servidor. Una solicitud
sobre una sala cerrada ya no presenta acciones de aceptación. Los fallos al
agregar integrantes se muestran dentro del modal, conservando la selección.

`useRoomOnline.ts` comparte únicamente lecturas simultáneas por cuenta/sala y
vuelve a leer si recibe novedades durante una consulta. No mantiene una copia
permanente que pueda quedar vieja. El detalle consulta solo la sala elegida y
sus comandos; el inicio y los totales conservan la consulta completa.

## Ajustes de presentación de salas

Partes y pagos contiene una sola lista con los checks del administrador en cada
fila; no se repite otro bloque de partes pagadas. Mis movimientos muestra el
título fuera de los contenedores y una tarjeta por operación. El listado y el
detalle del gasto usan el icono y la paleta de su categoría según el tema.
Quién le debe a quién expresa ambos nombres en una misma línea con truncado.

El icono de categoría del detalle usa un recuadro de 40 puntos con esquinas
redondeadas, como las tarjetas de movimientos. Cada parte muestra su estado a
la izquierda; junto al importe, el pagador original tiene un candado y las otras
partes muestran el check editable para el administrador mientras la sala está
abierta. El candado solo se muestra al administrador y no permite desmarcar al
pagador de la compra. El check ocupa los mismos 20 puntos que el candado, con
área táctil ampliada sin agregar espacio visual. Para participantes, el botón
de informar su parte queda fuera de la tarjeta, separado del contenido y sin
el contenedor adicional «Tu parte».

Los registros del historial de deuda y las tarjetas de solicitudes llevan el
borde normal del tema. Cada solicitud distingue pendiente con reloj neutro,
aceptada con check en color de éxito y rechazada con icono en color de error.

Las decisiones se muestran en filas de dos acciones, con textos breves. El acceso
Opciones de acceso reutiliza SocialButton; su modal incluye el mismo Toggle del
perfil para permitir ingresos y las acciones Guardar/Renovar enlace en una fila.
Cambiar el interruptor no guarda una contraseña que se esté escribiendo.

El modal Mis movimientos bloquea cierre por fondo, cruz y botón Atrás durante
el guardado, incluida la solicitud o marca de pago que se envía después de la
selección. Un error conserva el formulario y vuelve a habilitar sus controles.

Las tarjetas de invitación conservan la superficie habitual en tema claro,
distinguiéndose por el borde y su estado. El icono de perdón usa la tinta del
botón secundario. Se retiró la explicación genérica de solo lectura del resumen
de sala: los permisos se expresan mediante los controles disponibles y el estado.


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
