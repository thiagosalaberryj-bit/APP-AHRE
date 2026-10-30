# Social: salas, personas y deudas

## Alcance del Issue #18

La maqueta representa un registro personal offline. Los importes, repartos, pagos y
balances están escritos a mano; no se calculan ni se guardan. No hay invitaciones,
códigos, sincronización ni comunicación entre dispositivos.

Las vistas existentes están separadas en archivos de pantalla propios. Esta
organización no agrega recorridos ni cambia su presentación. Cada pantalla
compone su contenido con componentes independientes de src/components/social/;
las rutas y sus parámetros se conservan.

## Organización del código

- src/screens/SocialScreen.js: panel de Social.
- src/screens/SocialRoomsScreen.js y SocialRoomScreen.js: listado y detalle de sala.
- src/screens/SocialPeopleScreen.js y SocialPersonScreen.js: agenda y perfil.
- src/screens/SocialDebtsScreen.js y SocialDebtScreen.js: historial y detalle de deuda.
- src/screens/SocialExpenseScreen.js: detalle de un ítem.
- src/screens/SocialCreateRoomScreen.js: creación de sala.
- src/screens/SocialRegisterDebtScreen.js y SocialRegisterPaymentScreen.js: registros de deuda y pago.
- src/screens/SocialRegisterExpenseScreen.js: alta y edición de un ítem.
- src/screens/SocialDeleteDebtScreen.js y SocialCloseRoomScreen.js: confirmaciones.
- src/screens/SocialInvalidRecordScreen.js: registro no disponible.
- src/components/social/: contenido, tarjetas, formularios, modales, selectores y controles reutilizables, cada uno en su archivo. SocialFormActions.js reúne confirmación simulada y aviso; SocialRecordUnavailable.js comparte el estado de registro no disponible.
- src/styles/social/: estilos propios de los componentes y del marco de pantalla; SharedStyles.js contiene las reglas utilizadas por varios consumidores, sin duplicarlas.
- src/social/socialMockData.js: datos y opciones simulados; socialHelpers.js: nombres y búsquedas.
- src/social/useSocialScreen.js: apariencia, contexto de la ruta y acciones de navegación comunes.
- src/navigation/socialRoutes.js: adapta las rutas existentes a sus pantallas según los identificadores y el tipo de registro.

SocialScreenFrame es el único marco compartido para encabezados, teclado,
desplazamiento, carga y registro no disponible. No selecciona el contenido de
las vistas. AppNavigator enlaza las pantallas de perfil y gasto directamente
y los adaptadores de salas, personas y registros, manteniendo los mismos nombres
de ruta y la ausencia de barra inferior en las vistas secundarias.

## Panel principal

Arriba aparece una tarjeta principal con Tus pendientes: los totales Te deben y
Debés, seguidos de Nueva deuda, Personas y Nueva sala dentro del mismo contenedor.
Los importes se destacan a 28 puntos y las etiquetas a 14, en dos bloques de fondo
suave y esquinas redondeadas. Te deben y Debés llevan flechas pequeñas hacia arriba
y abajo, respectivamente, con los colores de foco y error del tema. Las acciones
usan el fondo verde claro, iconos y texto verde oscuro de los accesos rápidos de
Inicio. Debajo aparecen Deudas recientes primero y Salas después, con separación
entre secciones y filas. Los encabezados incluyen los textos Ver todas las salas /
Ver todas las deudas junto a su flecha. Salas muestra hasta tres activas. Nueva sala
se integra a los accesos superiores y muestra el cupo de activas; se deshabilita al
alcanzar tres. Los totales quedan en la tarjeta superior. Deudas muestra las cinco
obligaciones pendientes más recientes por fecha, de nueva a antigua. Cada fila
indica persona, descripción, dirección, pendiente y fecha; abre el detalle de esa
deuda. Reutiliza la misma tarjeta compacta del historial. No es una lista alfabética
de personas ni incluye pagos saldados. Las acciones de registro quedan arriba del
contenido, sin botones repetidos al final de las listas.

Las salas del panel usan el mismo contorno, relleno y distribución compacta de las
tarjetas de deudas: icono pequeño a la izquierda y nombre con elipsis. La categoría
no aparece en las tarjetas; se conserva dentro del registro. Debajo aparecen
cantidad de personas y fecha de creación fija a la derecha. El bloque suave de
Gastado, con importe y flecha, permanece a la derecha. Mantienen el icono y color
elegidos para cada sala, sin sombras ni nuevos efectos de borde al presionar. La
sala nueva muestra $0. La creación tiene un campo de ejemplo creadaEl independiente
de la fecha de la ocasión; el panel muestra primero las salas creadas más
recientemente.

Ver todas las salas abre el listado completo con el mismo componente de tarjeta, sin
tarjetas grandes con otra distribución. El buscador consulta nombre de sala,
categoría, nombre/apellido/apodo de sus personas y fecha de creación, ignorando
mayúsculas y tildes. Se combina con Todas, Activas y Cerradas. Los resultados se
agrupan por estado y se ordenan por creación descendente dentro de cada grupo;
Cerradas indica Solo lectura. Se muestran cantidad de resultados, cupo de activas,
limpieza de búsqueda y filtros y estado sin coincidencias. Crear sala aparece como +
junto al buscador y respeta el límite de tres aunque se filtre una lista vacía.

El estado vacío muestra ambos totales en cero, un icono de confirmación y No tenés
deudas pendientes. Mantiene los enlaces y las acciones. Puede revisarse en la
maqueta abriendo Social con el parámetro sinDeudas: true, sin agregar controles de
prueba al panel. El parámetro solo representa el estado visual de este panel; las
vistas secundarias mantienen sus ejemplos independientes.

## Agenda y deudas: presentaciones diferentes

Personas muestra Personas registradas arriba y un buscador por nombre, apellido o
apodo. Junto al buscador, el botón + abre Agregar persona en un modal. La agenda
mantiene el orden alfabético sin encabezados por inicial que separen en exceso cada
contacto. Usa tarjetas compactas individuales con avatar en fondo suave, nombre
destacado, apodo debajo y acceso al perfil a la derecha, sin importes ni datos que
repitan Deudas. Nombre y apodo usan elipsis; las tarjetas conservan el borde y la
respuesta de opacidad de las otras listas. Los ejemplos incluyen apellidos y apodos
ficticios. El detalle de una persona muestra sus datos en una tarjeta superior y un
icono de edición en la esquina, que abre el mismo modal con los valores precargados.
La comparación de duplicados excluye la propia ficha al editar, pero revisa
coincidencias con las demás. Guardar cambios solo muestra el aviso de maqueta;
cancelar descarta el borrador sin alterar la ficha ni sus deudas.

El modal tiene Nombre, Apellido y Apodo obligatorios. Apodo tiene un máximo de 20
caracteres y un contador visible, tanto en alta como en edición. El buscador mide 52
puntos de alto, igual que el botón +, cuyo tamaño no se incrementa. Usa scroll y
adaptación al teclado. En alta se conserva Cancelar; en edición se utilizan
la X, el fondo o Atrás, sin botón Cancelar. Esas acciones cierran el formulario y
descartan su borrador. Al reabrir el alta, los campos están vacíos; al reabrir la
edición, se recuperan los datos originales de la persona. El acceso
Registrar persona desde los selectores abre esta misma agenda con el modal visible.
Es la excepción al resto de registros secundarios: el alta de persona se presenta en
modal por indicación del líder.

La comprobación visual de duplicados compara nombre y apellido juntos, o un apodo no
vacío ya utilizado, contra todo el listado simulado. Ignora mayúsculas, tildes y
espacios exteriores/repetidos. Una coincidencia deshabilita Registrar persona y
ofrece Ver persona existente; abrir esa ficha cierra antes el modal. Un mismo nombre
con otro apellido puede registrarse si no repite apodo. Esta comprobación es una
ayuda visual sobre datos ficticios, no una verificación de identidad ni una
restricción de base de datos. Confirmar solo muestra un aviso, sin guardar ni
agregar personas reales.

## Historial de deudas

Ver todas las deudas abre Historial de deudas, con todas las obligaciones simuladas,
incluidas las saldadas. Se ordenan de más reciente a más antigua y se agrupan por
mes y año, con una flecha para expandir o cerrar cada mes y un resumen «X de Y
deudas saldadas» sobre los resultados del mes. Los meses comienzan abiertos; cambiar
la búsqueda o el estado vuelve a abrir los grupos para mostrar las coincidencias.
Las fechas de los ejemplos están escritas a mano y aparecen dentro de cada tarjeta.

El buscador permite encontrar persona por nombre, apellido o apodo, y también
consulta la descripción y el origen de la deuda. Ignora mayúsculas y tildes. Se
combina con Todas / Pendientes / Saldadas. Pendientes incluye pagos parciales. Se
indica la cantidad de resultados, se puede limpiar el texto y restablecer búsqueda y
filtros; sin coincidencias hay un estado explícito. El + junto al buscador abre
Registrar deuda.

Las tarjetas usan dos columnas compactas: descripción con icono y persona a la
izquierda, con nombre y fecha en una misma fila debajo; una franja de fondo suave
con estado e importe a la derecha, alineada en la parte superior del contenido. El
icono es pequeño, de tamaño fijo, y queda centrado verticalmente a la izquierda.
Título y nombre quedan juntos en el bloque interior; el nombre usa elipsis y la
fecha queda fija a la derecha, sin encogerse ni desplazarse por nombres largos. El
título y el estado parten de arriba con el mismo margen interior; el estado y la
flecha no se apilan. La tarjeta conserva el mismo padding arriba y abajo. Conservan
los colores del texto y del icono. Se retiran sombra, acento lateral y cambios de
borde/escala al presionar; queda una respuesta suave de opacidad.

Saldadas y pendientes mantienen la misma estructura, con altura determinada por el
contenido, sin altura mínima que añada espacio sobrante abajo ni reducción de
fuentes. Descripción y persona usan una línea con elipsis. La franja de importe
tiene ancho constante y no ocupa una fila inferior adicional. La fecha completa se
muestra dentro de cada tarjeta, tanto en el historial como en las deudas recientes
del panel.

El historial omite origen, importe original y explicaciones de pagos parciales.
Tocar una tarjeta abre Detalle de deuda para su identificador, reutilizando
RegistroSocial con tipo detalleDeuda. Allí se muestran persona, apodo, fecha,
descripción completa, origen, importe original, pendiente y estado, incluidos los
pagos parciales. Conserva Registrar pago, Eliminar deuda, Ver sala de origen y Ver
persona cuando corresponden. No hay un botón genérico de guardar en esta vista de
consulta. Un ID inexistente muestra Deuda no disponible.

Búsqueda y filtros solo operan sobre los ejemplos de la maqueta. No hay consultas de
persistencia, cálculos de deuda ni registros reales.

## Detalle de una persona

La tarjeta principal reúne iniciales, nombre completo, apodo, icono de edición,
resumen Te debe / Le debés y Registrar deuda. Nombre y apodo usan una sola línea con
elipsis al final para no desplazar el icono. Los textos completos siguen expuestos a
accesibilidad y se consultan en edición. El botón de edición es solo un icono con
etiqueta accesible, sin la fila anterior Editar datos.

El resumen usa dos columnas compactas, sin tarjeta interna grande: flecha hacia
arriba para Te debe y hacia abajo para Le debés, con etiquetas textuales. El
contenedor del perfil reduce relleno y separaciones. Las tarjetas de deudas
individuales también se compactan: descripción e importe en una fila, con los
tamaños originales de texto (descripción 18, monto 24, cuerpo 16 y texto secundario
14 puntos). Se mantiene la reducción de relleno, sin achicar la tipografía. Las
flechas direccionales quedan solo en el resumen del perfil, sin repetirse en cada
deuda. Conservan importe original, pagos parciales y saldados.

Cada deuda pendiente ofrece dos botones con superficie y etiqueta: Registrar pago
con tick y Eliminar deuda con papelera. En pantallas estrechas pueden acomodarse en
varias filas conservando la fuente y un área táctil mínima de 48 puntos. Las deudas
saldadas no ofrecen registrar otro pago, pero conservan el acceso a la confirmación
de eliminación. Ver sala de origen queda como acción textual sin icono adicional.

Eliminar deuda abre una confirmación secundaria para el identificador elegido.
La flecha del encabezado vuelve al detalle; confirmar solo muestra el aviso de maqueta. No se
eliminan ni se cancelan deudas reales, pagos, movimientos ni datos de salas.

Los importes del resumen son ejemplos fijos por persona y conservan ambas
direcciones sin compensarlas. Registrar deuda queda dentro de esa misma tarjeta y
abre el registro con la persona elegida. Las secciones inferiores mantienen Lo que
te debe, Lo que le debés y los pagos saldados cuando corresponda. Los pendientes de
salas cerradas siguen activos y permiten consultar su origen.

## Nueva deuda, registro de pago y eliminación

Nueva deuda agrupa persona y dirección en una tarjeta de resumen. Me debe y
Le debo comparten el ancho y la selección actual se explica con el nombre
completo de la persona. Se reutilizan PeopleSelector, SocialChoiceGroup,
SocialAmountInput y SocialTextField; después aparecen monto y descripción.

Registrar pago comienza con la dirección del dinero (Le pagás a / Recibís de)
y la tarjeta de deuda en solo lectura, sin flecha ni navegación. Conserva
origen, importe original y estado de pago parcial. Saldar todo carga el monto
pendiente; Otro importe permite editarlo. La maqueta distingue la intención
de saldar del registro de otro importe, pero no calcula el saldo restante.
El botón indica Registrar pago recibido o realizado y no se habilita con un
campo vacío. Una deuda ya saldada no permite registrar otro pago.

Eliminar deuda reutiliza la misma tarjeta de consulta y explica que eliminar
no equivale a pagar: se conservarían persona, pagos registrados e ítem de
origen. La acción utiliza la variante roja de SocialButton. Para volver sin
eliminar se usa la flecha del encabezado; no se muestra un botón Cancelar.
SocialFormActions comparte el aviso y la confirmación simulada. Eliminar deuda
solicita una segunda confirmación en SocialConfirmationModal.js, con descripción,
persona y pendiente. Cerrar el modal no ejecuta ninguna acción; Sí, eliminar deuda
muestra el aviso de maqueta. No se borran deudas reales, no se registran pagos ni
se modifica persistencia.

## Registros en vistas secundarias

Crear sala, Registrar deuda, Agregar/Editar gasto, Registrar pago, Eliminar deuda y
Cerrar sala reutilizan vistas del Stack principal. La flecha vuelve al lugar
anterior. El alta y edición de personas se presentan en modal desde la agenda o el
perfil. El acceso Registrar persona desde un selector abre la vista de registro con
la agenda y su modal de alta visible. Confirmar muestra un aviso de maqueta; no
modifica datos ni cierra salas reales.

Los formularios reutilizan `MoneyInput.js` y los estilos existentes de
`expenseStyles.js`: monto destacado con prefijo $, campos con icono, selectores en
tarjeta, contenido de ancho limitado y desplazamiento compatible con el teclado. No
se modifica Ingreso, Egreso ni sus componentes compartidos.

La selección de personas es un campo desplegable, no una fila de chips. En las
selecciones simples se elige una persona y se cierra la lista; en las múltiples se
marcan varias y se confirma con Listo. El selector muestra los nombres actuales.
Cuando corresponde ofrece Registrar una persona, que cierra el selector y abre una
vista secundaria. Al volver se conserva el borrador de la vista anterior. El alta
simulada no agrega una persona al listado.

Crear sala solicita nombre de la ocasión, fecha, descripción opcional y
participantes. Vos ya estás incluido. El modal para agregar personas a una sala
ofrece solo quienes todavía no pertenecen a ella. Registrar deuda muestra monto,
descripción, selector de persona y dirección Me debe / Le debo.

Crear sala también permite elegir Categoría, Icono de la sala y Color de la sala.
Reutiliza el catálogo CATEGORIAS_EGRESO y el selector de los movimientos, sin
consultar ni modificar la base de datos. El icono se elige en un modal y el color en
una paleta de los tokens existentes; ambas elecciones son independientes de la
categoría. El campo de icono muestra el resultado en el color elegido. Confirmar
sigue sin guardar ni crear una sala real. Los ejemplos tienen categoría, icono y
color propios. El icono y color se muestran en panel, listado y detalle. La
categoría se consulta en el detalle y se elige en el formulario; no se muestra en
las tarjetas de las listas, aunque puede usarse para buscar salas.

La fecha es el último campo de Crear sala, después de participantes. Comienza con el
día actual del dispositivo al abrir el formulario. Reutiliza el selector de
calendario de los movimientos, sin ingreso manual de texto. Elegir otra fecha solo
actualiza el borrador de la maqueta.

## Sala, gastos y pagador

El detalle conserva sus secciones Balances, Gastos y Personas, con Balances
seleccionado al abrir. Las tres opciones ocupan todo el ancho en columnas iguales,
con un icono al lado del texto y espacio uniforme, sin scroll horizontal. La tarjeta
principal muestra total gastado y cantidad de gastos; los totales son ejemplos fijos
e incluyen todos los gastos de la ocasión, independientemente de sus pagos. Agregar
gasto se integra en ese resumen con un icono, sin botón suelto entre la tarjeta y
las secciones. Las salas cerradas también muestran el total y no ofrecen agregar
gastos. Las tarjetas de gastos tienen icono de ticket y flecha de acceso,
descripción, importe, pagador, fecha y reparto. Cada tarjeta es un ítem
independiente de la sala: Pizzas, Bebidas o Taxi, sin un gasto intermedio que los
agrupe.

El detalle usa el mismo lenguaje visual del perfil: nombre y fecha en la cabecera,
icono de edición, e Importe y Pagó en dos columnas dentro del resumen principal.
Debajo aparecen el reparto y las partes y pagos en filas compactas. La edición solo
está disponible mientras la sala esté abierta y reutiliza el formulario con gastoId
y sus datos precargados. Guardar cambios solo muestra el aviso de maqueta, sin
modificar los ejemplos.

Balances presenta Tu balance en esta sala con dos importes destacados, por cobrar y
por pagar. En salas abiertas se indican como provisionales al cierre, sin compensar
las direcciones. Debajo, Quién le debe a quién usa filas compactas con persona, ítem
de origen, dirección e importe, del mismo estilo que el historial de deudas. También
muestra los pendientes entre otras personas, con ambos nombres. Tocar una fila abre
el ítem para revisar sus pagos. Usa el mismo icono swap-horizontal-outline y los
mismos colores de Deudas: foco para importes por recibir y pendientes entre otras
personas, error para lo que pagarías vos. Conserva los estados provisionales hasta
cerrar la sala. Los pagos parciales muestran solo lo pendiente: en el cine son
$4.000, no los $8.000 originales. Los totales siguen siendo ejemplos escritos a
mano. Las salas sin gastos o con todo pagado conservan sus estados vacíos.

Personas muestra un buscador por nombre, apellido o apodo con el botón + a su lado,
del mismo alto y estilo que la agenda, sin repetir el título de sección. Agregar
abre un modal con su propio buscador y selección múltiple de personas registradas
que aún no pertenecen a la sala. Las selecciones se conservan al cambiar la
búsqueda. Agregar seleccionadas se habilita al elegir al menos una y confirma la
lista temporal de la maqueta. X, el fondo y Atrás descartan la selección sin cambiar
la lista ni la búsqueda de la pantalla. Reabrir comienza sin selecciones. Crear una
persona cierra el modal y abre el formulario existente.

Cada integrante ofrece quitar con confirmación; cancelar no cambia el listado.
Confirmar solo quita a la persona de la selección temporal, conservando su agenda,
gastos y pagos de ejemplo. Vos permanece incluido. Las salas cerradas permiten
buscar y consultar sin agregar ni quitar personas.

La confirmación sigue el estilo de eliminar depósito: papelera sobre fondo rojo
suave, ficha de la persona, aviso contextual y botones Cancelar y Quitar de la sala,
este último rojo. Distingue entre no tener ítems vinculados, tenerlos todos pagados
o mantener partes pendientes de pagar/cobrar. Quitar no borra el historial, no
cancela pendientes y no recalcula ningún reparto; las partes pendientes se conservan
para el cierre. La agenda permite volver a agregarla. Tras confirmar se muestra el
resultado temporal en la lista.

Para nuevos ítems se pasan los identificadores de las personas seleccionadas en la
sala, excluyendo a quienes se quitaron. Los ítems anteriores conservan sus
participantes originales y siguen mostrando sus nombres y pagos.

Estos cambios de integrantes son temporales en memoria, únicamente para probar la
maqueta; no guardan datos ni modifican gastos o deudas de ejemplo.

**Agregar gasto** registra un único ítem: qué se pagó, importe, quién pagó, personas
involucradas y cómo se reparte. El pagador y el reparto pertenecen a cada ítem: las
pizzas pueden pagarlas vos y las bebidas, Lucía. Las personas involucradas se
seleccionan por separado para cada cosa pagada.

### Distribución compacta del gasto

El importe se destaca arriba y el nombre aparece en Qué se pagó. Los selectores
**Pagó** y **Participan** comparten una fila. **¿Cómo se reparte?** ofrece
**Iguales** y **Manual**, del mismo ancho y uno al lado del otro. No hay reparto Por
productos ni una lista de subgastos dentro del ítem. Los importes manuales se
presentan en filas de persona e importe, y su borrador se conserva al alternar el
método. No se calculan sumas ni divisiones.

**Pagos y pendientes** comienza plegado, con cantidad de partes pagadas y quién
cobra. Al abrirlo se marcan pagos individuales o Todos ya pagaron su parte. Repartir
un ítem por igual no obliga a generar una deuda pendiente.

### Ticket de ejemplo para OCR

**Escanear ticket** se identifica como **OCR · Ticket de ejemplo**. No abre cámara,
no ejecuta ML Kit y no crea egresos. Muestra pizzas por $32.000 y bebidas por
$16.000 como líneas independientes. Elegir una línea carga solo ese nombre e importe
en el borrador para configurar su propio pago y reparto. No crea un gasto que
contenga todo el ticket ni agrega automáticamente ítems.

Antes de elegir se explica que se reemplazará el nombre e importe y se reiniciarán
el reparto y los pagos. El pagador y las personas seleccionadas se conservan para
revisarlos. Cancelar deja el borrador intacto. Cada ítem mantiene su importe
editable y confirmar sigue siendo simulado, sin guardado. La conexión al OCR real y
la creación de registros quedan para otra etapa.

### Quién ya entregó su parte

El pagador figura con su parte pagada si participa del reparto. Las demás personas
pueden representarse con su parte pendiente o ya entregada al pagador. Si paga
Lucía, el usuario puede indicar que **le debe su parte a Lucía** o que **ya se la
dio**. Si paga el usuario, los textos indican quién todavía le debe y quién ya le
entregó su parte. Cambiar de pagador restablece las marcas del borrador para no
atribuirle pagos seleccionados para otra persona.

Todos ya pagaron su parte muestra Sin deudas pendientes. Repartir un gasto en partes
iguales no exige generar deuda: todos pueden haber pagado en el momento. Esto
también se representa con el reparto manual.

| Sala | Ejemplo |
| --- | --- |
| Cena del viernes | Tres ítems independientes, total $54.000: Pizzas ($32.000, pagaste vos; Tomás tiene $16.000 pendientes), Bebidas ($16.000, pagó Lucía; Joaquín tiene $8.000 pendientes) y Taxi ($6.000, pagó Lucía; tu parte de $2.000 está pendiente y Tomás ya pagó). El reparto es provisional hasta cerrar la sala. |
| Merienda de hoy | Sala recién creada, con personas seleccionadas, total $0, sin gastos ni deudas. Hay dos activas de un máximo de tres para mantener Crear sala disponible. |
| Picada del sábado | $36.000 en partes iguales entre tres personas, todas pagadas; sin deuda pendiente. |
| Salida al cine | Cerrada, con reparto manual y $4.000 de Tomás todavía pendientes. |

Los totales del panel son ejemplos fijos: Te deben $7.500 y Debés $9.000; en el
estado sin deudas ambos muestran cero. Incluyen deudas personales y de salas
cerradas. El reparto provisional de una sala abierta no se muestra todavía como
deuda registrada en panel o historial.

## Cierre e historial

Cerrar sala aparece al final como botón secundario con icono de candado y un texto
breve que explica el paso al historial. Abre la revisión antes de confirmar. El
cierre confirma el reparto y representa las partes sin pagar como deudas,
conservando el historial de los pagos ya realizados. La sala queda en solo lectura.
Confirmar sigue sin ejecutar un cierre ni crear deudas reales en esta etapa de
maquetado.

La revisión de cierre (`CloseRoomForm.js`) muestra nombre, fecha, total
gastado, cantidad de ítems y personas, y partes pagadas y pendientes. Lista
cada parte pendiente con quien paga, quien recibe, ítem e importe restante;
los pagos parciales conservan solo lo pendiente. Si la sala está vacía o todo
está pagado, indica que no generará deudas. Explica que la sala pasará al
historial en solo lectura y que los pagos anteriores no volverán a cobrarse.
Ofrece Confirmar cierre y la flecha del encabezado para volver, con estilos propios en
`src/styles/social/CloseRoomFormStyles.js`. Confirmar solo muestra el aviso
de maqueta; volver regresa sin alterar los ejemplos.

Las salas cerradas permiten consultar participantes, balances y detalles de gastos;
no ofrecen agregar, editar ni cerrar otra vez. Tampoco se muestra un registro de
gasto o participantes si se intenta abrirlo con una sala cerrada. Los pagos
pendientes se consultan y se representarán desde la persona.

## Navegación

Las rutas secundarias conservan sus identificadores y se registran sin barra
inferior. Cada destino utiliza su pantalla independiente:

| Ruta | Datos de navegación | Vista |
| --- | --- | --- |
| Social | sinDeudas opcional, solo para revisar el estado vacío | Panel |
| SalaSocial | salaId opcional | Lista de salas; con ID, detalle de sala |
| PersonaSocial | personaId | Persona y deudas |
| PersonasSocial | todas: true para agenda; sin esa opción para deudas | Agenda o historial de deudas |
| RegistroSocial | tipo y, según el registro, salaId, personaId, gastoId, deudaId o personasIds | Registro, detalle de deuda o confirmación |
| GastoSocial | salaId y gastoId | Reparto y pagos de un gasto |

Las rutas reciben identificadores y opciones simples, sin funciones ni datos
financieros mutables. Las vistas secundarias se apilan para que Atrás vuelva al
detalle, lista o borrador del que se abrió cada una.

## Estados, temas y verificación

Se conservan carga breve, errores de registros no disponibles, ausencia de salas
activas, sin gastos y sin balances pendientes. Los estilos exclusivos viven en
`src/styles/social/`, usan tokens globales y conservan ambos temas, áreas
seguras, texto adaptable y contenido desplazable. Los selectores exponen su estado
expandido y las opciones su selección accesible.

Verificar manualmente en ambos temas, pantalla angosta, texto ampliado y teclado:

1. Panel con bloques Te deben/Debés, iconos y acciones; después deudas recientes
   y salas. Los enlaces Ver todas abren sus listas. El ejemplo sinDeudas muestra
   cero y el estado al día sin ocultar acciones.
2. Deudas ordenadas por fecha y agrupadas por mes expandible, con X de Y
   saldadas. Combinar búsqueda y estado, cerrar grupos y limpiar filtros. Cada
   tarjeta abre la deuda elegida; el acceso Ver persona abre su perfil.
3. Agenda alfabética con tarjetas de nombre/apodo, buscador y +. Revisar alta y
   edición en modal, campos obligatorios, apodo de 20 caracteres, coincidencias
   de nombre/apellido o apodo y descarte del borrador al cancelar.
4. Salas con las mismas tarjetas en panel y listado, sin categoría visible,
   fecha de creación diferenciada de la ocasión y total gastado. Combinar
   búsqueda por sala/categoría/persona/fecha con Todas, Activas y Cerradas.
   Revisar orden por creación, estado sin coincidencias y límite visual de tres.
5. Crear sala con categoría del catálogo de egresos, icono y color independientes.
   La fecha es el último campo y comienza con el día actual del dispositivo.
6. Balances con resumen y pendientes por ítem, incluidos pagos entre otras
   personas. El cine muestra $4.000 pendientes, no $8.000 originales. Abrir la
   fila lleva al ítem correspondiente.
7. Personas de la sala: + junto al buscador abre un modal. Seleccionar varias,
   buscar, cancelar y confirmar. Quitar pide confirmación roja y conserva gastos
   y pagos; revisar personas sin ítems, con todo pagado y con partes pendientes.
   Los nuevos ítems usan solo participantes actuales; los anteriores conservan
   los originales. Las salas cerradas no permiten cambiar integrantes.
8. Ítems independientes con pagadores y personas diferentes, reparto Iguales o
   Manual y edición precargada mientras la sala esté abierta. Cambiar de método
   conserva importes manuales. Revisar partes pendientes y todos pagados, y el
   pago parcial fijo del ejemplo cerrado de cine.
9. Cancelar el ticket OCR de ejemplo conserva el borrador. Elegir Pizzas o
   Bebidas carga una sola línea, mantiene pagador/personas y reinicia reparto
   y pagos, sin cámara, OCR real, egresos ni registros nuevos.
10. Registro de deuda/pago y eliminación con sus ejemplos. Cerrar sala explica
    que confirmaría el reparto y dejaría los pendientes como deudas; el historial
    de salas cerradas es de solo lectura. Confirmar estos registros solo muestra
    el aviso de maqueta. Cambiar integrantes solo afecta la selección temporal.

Las comprobaciones de interacción en claro/oscuro y la exportación Android se
realizaron durante el trabajo. No sustituyen la revisión visual manual en un
dispositivo, que sigue pendiente. No se validó persistencia porque Social no la
implementa en este Issue.

La persistencia, cálculos, validaciones de importes, límite funcional, pagos y
cierres reales quedan para otro Issue. La futura lógica deberá admitir otro pagador,
partes ya pagadas y deudas activas después del cierre de una sala.

La separación en módulos se contrastó contra la versión anterior: 100 vistas
simuladas en claro/oscuro conservaron estructura, textos y estilos efectivos.
Las comprobaciones de interacción también se repitieron tras la reorganización.

La auditoría posterior a la separación revisó accesibilidad desde navegación,
imports, propiedades y estilos sin consumidores. Las acciones comunes de los
formularios y las reglas visuales idénticas se centralizaron sin duplicarlas.
Se mantuvo la equivalencia de las 100 vistas y sus interacciones; esta
verificación no sustituye las comprobaciones visuales en un dispositivo.
