# Interfaces de movimientos de AHRE

## Alcance

Este documento registra los formularios de egreso e ingreso. Ambos reutilizan
el mismo formulario y sus componentes; consultan depósitos y categorías
locales, validan y persisten el movimiento junto con su impacto en el saldo.
La ejecución automática utiliza el motor local y WorkManager en Android. La eliminación lógica conserva el historial y excluye el registro de saldos y estadísticas.

## Estructura del formulario de egreso

`src/screens/ExpenseScreen.tsx` presenta «Nuevo egreso» con
`EncabezadoSeccion` y un formulario desplazable compatible con el teclado:

Nuevo egreso presenta monto, descripción obligatoria, depósito y categoría. Categoría ofrece cuatro accesos directos y un modal con opciones adicionales. Información adicional reúne fecha, hora, recurrencia y la aclaración sobre movimientos anteriores a la creación del depósito. El formulario termina con Guardar egreso.

El formulario se abre desde `Dashboard → Egreso` o `Nuevo → Egreso`. Consulta
SQLite para obtener los depósitos activos del usuario y las categorías de
egreso del catálogo local. La flecha del encabezado permite volver; al pie
queda únicamente la acción «Guardar egreso».

Si no hay depósitos activos, muestra el estado para crear uno y oculta el
formulario. Al regresar de Nuevo depósito, vuelve a consultar los datos locales.

## Estructura del formulario de ingreso

`src/screens/IncomeScreen.tsx` contiene el formulario compartido, configurado
como «Nuevo ingreso» desde su ruta existente:

Nuevo ingreso presenta monto, descripción obligatoria, depósito y categoría. Información adicional reúne fecha, hora, recurrencia y la aclaración sobre movimientos anteriores a la creación del depósito. El formulario termina con Guardar ingreso.

El formulario se abre desde `Dashboard → Ingreso` o `Nuevo → Ingreso`.
La descripción es obligatoria y se marca con `*`. El monto usa teclado
numérico con prefijo `$` y formato visual. El depósito y la categoría usan
los selectores compartidos con los catálogos locales de ingreso o egreso. La
fecha y la hora usan los modales compartidos; la recurrencia usa el
`Conmutador` con las frecuencias definidas en el modelo. «Guardar ingreso»
valida los campos, comprueba el depósito y la categoría y guarda el movimiento
local; si se activa la recurrencia, también guarda su configuración. El pie no
incluye una acción para cancelar; la flecha del encabezado permite regresar al
flujo anterior.

## Diferencias visuales entre los formularios

- Cada formulario presenta su título y descripción: «Nuevo ingreso» / «Registra
  el dinero que recibes» y «Nuevo egreso» / «Registra el dinero que gastas».
- La descripción es obligatoria y se marca con `*` en ambos formularios.
- El selector compartido presenta catálogos distintos para ingresos y egresos.
- Ambos formularios incluyen monto, depósito, categoría, fecha, hora y
  recurrencia. El color de egreso (`#E7B0B0`) queda reservado para futuros
  listados; las categorías tienen acentos de color propios.

## Campos

### Monto

`EntradaMonto` (`src/components/MoneyInput.tsx`) con teclado numérico,
prefijo `$`, formato visual `12.500` y un campo destacado de `76` puntos con
tipografía de `32` puntos. Incluye estado enfocado con `tema.foco`, estado
inválido con `campoError` y botón `X` para limpiar. El contador y la limpieza
son solo visuales.

### Descripción obligatoria

Campo de texto con ícono, `placeholder` con ejemplos, contador `0/500` y
mensaje «La descripción es obligatoria» cuando se intenta guardar vacío. El
servicio recorta los espacios externos, valida el contenido y guarda la
descripción con el movimiento.

### Depósito

`SelectorDeposito` (`src/components/DepositSelector.tsx`) con tarjeta
desplegable. Ambos formularios reciben desde SQLite los depósitos activos del
usuario y guardan el identificador, no solo el nombre visible:

```text
Efectivo
Mercado Pago
Cuenta bancaria
```

Muestra nombre y saldo como texto. La lista se abre en un `Modal` transparente
superpuesto para no desplazar el formulario; la selección se identifica con
borde de foco y radio activo.

### Categoría

`SelectorCategoria` (`src/components/CategorySelector.tsx`) muestra cuatro
tarjetas compactas y una quinta tarjeta «Más», sin desplazamiento horizontal.
«Más» abre un modal con todas las categorías, también las cuatro principales,
tanto en ingreso como en egreso y en los demás usos del selector compartido.
Las grillas y los modales se ordenan por familia de color y, dentro de cada
familia, del tono más intenso al más claro. En selección individual,
elegir una categoría del modal reemplaza esa quinta tarjeta por el ícono,
nombre y color de la categoría elegida; tocarla vuelve a abrir el selector.
Al elegir una de las cuatro principales, reaparece «Más». El servicio de categorías
entrega el catálogo local de ingreso o egreso definido en
`src/constants/movimientos.ts`.

En el formulario de egreso las cuatro opciones principales son Alimentación,
Compras, Hogar y Servicios. Ingreso conserva Sueldo, Trabajo independiente,
Ventas y Transferencias recibidas como accesos iniciales. Los formularios usan
el tono completo de la categoría como relleno de las tarjetas y del modal,
con texto oscuro legible y el borde fino de las filas de entrada del formulario
(`tema.borde`, 1 punto), sin heredar el borde fuerte del campo global. Respeta
el tema activo, sin cambiar la paleta
de los gráficos claros. El estado seleccionado cambia el relleno y el color del
texto para conservar legibilidad; el borde mantiene su grosor y color del tema.
Debajo del selector de selección individual aparece siempre «Categoría
seleccionada: Ninguna» o el nombre completo elegido, tanto para opciones
principales como para las elegidas desde el modal.

Categorías de egreso:

```text
Alimentación
Transporte
Hogar
Servicios
Suscripciones
Salud
Educación
Entretenimiento
Compras
Trabajo
Deudas
Transferencias
Impuestos
Viajes
Regalos
Mascotas
Otros gastos
```

Cada categoría usa un color de acento en el ícono y un fondo suave. La
seleccionada destaca su borde con ese color. Si se elige una categoría desde el
modal, su nombre también se muestra debajo de las tarjetas.

La pantalla de ingreso usa el mismo selector con este catálogo:

```text
Sueldo
Trabajo independiente
Ventas
Transferencias recibidas
Devoluciones
Inversiones
Préstamos recibidos
Regalos
Becas / ayudas
Otros ingresos
```

Cada formulario conserva la selección mientras está abierto y valida el
identificador contra el catálogo correspondiente antes de guardar.

### Fecha

`SelectorFecha` (`src/components/DateSelector.tsx`): muestra la fecha actual o
la fecha elegida. Al presionarla abre un calendario mensual en un modal, permite
navegar entre meses y seleccionar un día o volver a hoy. La fecha elegida se
combina con la hora y se guarda en el movimiento.

### Hora

`SelectorHora` (`src/components/TimeSelector.tsx`): muestra la hora actual o la
elegida. El modal permite ajustar horas y minutos en formato de 24 horas y
confirmar la selección. La hora elegida se guarda junto con la fecha en
`fecha_hora` usando el formato ISO 8601 definido para los movimientos.

### Recurrencia

`ControlRecurrencia` (`src/components/RecurrenceControl.tsx`): fila con
`Conmutador` (`src/components/Toggle.tsx`) reutilizado del patrón visual de
Inicio de Sesión, con transición animada, tamaño `56 × 32` y valor `No/Sí`. Al
activarlo, permite seleccionar una frecuencia diaria, semanal, mensual o anual.
Las opciones ocupan todo el ancho de la tarjeta y aparecen sin animación de
expansión. Al guardar un movimiento recurrente se crea su configuración local;
la ejecución automática utiliza el motor local y WorkManager en Android.

## Formulario y componentes compartidos

`ExpenseScreen.tsx` configura como egreso el `FormularioMovimiento` definido en
`IncomeScreen.tsx`. Ambos usan la misma validación, servicio local y componentes:

```text
MoneyInput
DepositSelector
CategorySelector
DateSelector
TimeSelector
RecurrenceControl
Toggle
```

Los contenedores locales usan borde sutil por defecto y borde verde de foco
solo en enfocado o seleccionado; las categorías usan sus propios acentos de
color. En móvil no hay `hover`. Además se reutilizan `SectionHeader`,
`PrimaryButton` y `ContextoAvisos` sin modificar sus implementaciones. Los
estilos locales están en
`src/styles/expenseStyles.ts` y consumen tokens de `colors.ts` y
`globalStyles.ts`. Los catálogos están definidos localmente en
`src/constants/movimientos.ts` y se consultan por medio de
`categoriasRepositorio`.

## Estados visuales

- **Normal:** bordes y superficies del tema global.
- **Monto inválido:** borde y mensaje de error junto al campo.
- **Descripción faltante:** borde y mensaje «La descripción es
  obligatoria».
- **Depósito faltante:** borde y mensaje junto al selector.
- **Categoría faltante:** mensaje junto a las tarjetas.
- **Guardando:** `BotonPrincipal` con indicador y «Procesando…» mientras se
  guarda el movimiento; la pantalla bloquea los controles y evita envíos
  repetidos.
- **Fecha y hora:** los modales reflejan la selección vigente; elegir un día o
  confirmar la hora actualiza el formulario.
- **Frecuencia recurrente:** las cuatro opciones muestran la frecuencia activa
  cuando el conmutador está habilitado.
- **Error general:** un toast indica que se revisen los campos marcados y los
  errores específicos permanecen junto a los campos; no se muestra un mensaje
  general al pie del formulario.

Los avisos aparecen al presionar «Guardar ingreso» o «Guardar egreso». Ambos
formularios comprueban monto, descripción, depósito, categoría, fecha, hora y
frecuencia cuando corresponde; persisten el movimiento y actualizan el saldo
dentro de una transacción. El egreso guarda un monto positivo con tipo
`egreso`, que resta el monto del saldo del depósito asociado.

## Teclado, scroll y temas

El formulario combina `KeyboardAvoidingView` con `ScrollView`,
`keyboardShouldPersistTaps="handled"` y espacio inferior según el área segura
del dispositivo para que el botón de guardado pueda verse completo. El monto
abre teclado numérico. El contenido utiliza el ancho disponible con un margen
compartido de 12 puntos por lado, igual que Inicio. Las cinco tarjetas de categoría se distribuyen
en el ancho disponible sin scroll horizontal. Lee el modo claro u oscuro del
sistema y aplica `TEMAS.claro` u `TEMAS.oscuro` a fondos, textos, bordes,
botones y modales.

## Historial y detalle de movimientos

Movimientos y Detalle de depósito reutilizan `MovementQuickFilters.tsx` para
los accesos rápidos y `MovementFilterSections.tsx` para las secciones Tipo,
Fecha, Categorías y Monto. Las opciones comunes están en
`src/constants/movementFilters.ts`. Cada pantalla conserva sus estilos,
catálogos, resúmenes, validaciones y aplicación de los filtros; solo Movimientos
incluye la sección Depósitos. El selector de semana del historial y el manejo
de rangos personalizados conservan las diferencias existentes entre pantallas.

`src/screens/MovementsScreen.tsx` es pestaña con `MainHeader` («Movimientos») y
consulta SQLite para el usuario de la sesión y agrupa los movimientos vigentes
por mes y año, con el primer mes abierto inicialmente y los demás plegados, usando el encabezado compartido
`EncabezadoSeccionPlegable` (`src/components/CollapsibleSectionHeader.tsx`). Cada
mes se abre o cierra de forma independiente y muestra una lista continua
en su interior, sin encabezados diarios. Solo presenta `ingreso` y `egreso`; el tipo se lee desde el campo
`tipo`, no se deduce del monto. Cada tarjeta muestra «Hoy», «Ayer» o día y mes para otras fechas. Cada tarjeta usa un ícono de categoría y
presenta dos renglones: descripción, día y tipo en el primero; categoría, depósito,
hora e importe con signo en el segundo. El tipo y el importe ocupan una franja
de fondo suave a la derecha, similar a las tarjetas de deudas. La franja tiene
un ancho fijo de 112 puntos, con el tipo y la
flecha arriba y el importe debajo, limitado a una línea con puntos suspensivos.
La tarjeta usa un radio de 10 puntos y sus contenedores internos, de 5 puntos.
El importe completo se conserva en la etiqueta accesible y en el detalle.
El día dentro de la tarjeta muestra «Hoy», «Ayer» o día y mes abreviado para
cualquier otra fecha, según el calendario local del teléfono. La hora se
mantiene en el segundo renglón.
La franja reserva 8 puntos de relleno lateral y 4 vertical para separar texto y
flecha del borde; descripción e importe usan texto de 16 puntos. Su fondo usa
`tema.fondo` en ambos temas.
La descripción se recorta
cuando no entra; el tipo también
se indica con texto, no solo con color. Los estilos locales están en
`src/styles/MovementsScreenStyles.ts`; los estilos de la tarjeta compartida con
Inicio están en `src/styles/MovementCardStyles.ts`. Detalle de depósito y Detalle
de categoría también reutilizan la misma tarjeta. La hora queda separada del
texto recortable; la etiqueta accesible conserva toda la información.

La consulta inicial no muestra esqueletos de carga. Al volver a la pestaña se
conserva el historial visible mientras se actualiza; cada mes puede abrirse o
cerrarse manualmente sin perder esa elección al cargar otra página.

Las filas reutilizan `TarjetaMovimiento` (`src/components/MovementCard.tsx`) y
reciben el nombre real del depósito relacionado. SQLite ordena por
`fecha_hora DESC, id DESC`. La pantalla carga 50 filas por página; «Cargar más
movimientos» solicita la siguiente página usando la fecha, hora e ID de la
última fila como cursor.

La lista usa `MovementMonthList.tsx`, `MovementMonthListStyles.ts` y
`useMonthlyMovements.ts`, compartidos con Detalle de depósito. Comienza sin
filtros y consulta los encabezados de todos los meses con resultados, sin traer
sus movimientos. Solo el mes actual comienza abierto, si existe; los demás
permanecen plegados hasta que se abren. Cada mes tiene sus propias páginas de
50 filas y conserva lo cargado al plegarlo. Las tarjetas ya mostradas se
memorizan para no renderizarlas de nuevo al agregar otra página.
El botón muestra un indicador animado mientras carga. Además de tocarlo, se
puede llegar a él desplazándose hacia abajo: solo carga automáticamente si
está visible y el movimiento proviene de un arrastre o su inercia. No carga
por aparecer, subir, permanecer quieto ni mostrar un error; tampoco descarga
filas de meses plegados. Las mediciones pendientes se invalidan al detener
el gesto o cambiar filtros. Los errores conservan los datos y permiten reintento manual.

### Buscador

El buscador ocupa una fila completa; debajo aparece una fila horizontal con
«Filtros» y accesos a Todos, Ingresos y Egresos. Se comparte el componente
`MovementSearchFilters.tsx` con Estadísticas, que usa la variante sin buscador. Tiene lupa,
`placeholder` «Buscar movimientos» y botón `X` para limpiar. Su borde es fino y neutro en
reposo; solo toma el color de foco mientras el campo está enfocado. La búsqueda
en modo oscuro también usa el borde neutro, sin heredar el verde de `bordeFuerte`.
La búsqueda
se realiza en SQLite, ignora mayúsculas y minúsculas y consulta la descripción.
Se aplica junto con los filtros. Debajo aparecen los criterios activos como
chips en una línea independiente debajo de los accesos rápidos;
cada chip se puede quitar y «Limpiar» restablece la
búsqueda y los filtros. Si no hay coincidencias, se muestra `Sin resultados
para “…”` o un mensaje para los filtros seleccionados.

La fila incluye los mismos preajustes de categorías e importe de Estadísticas:
Día a día, Servicios y obligaciones, Bienestar y formación, Movilidad y salidas,
Finanzas y trabajo, y los grupos propios de ingreso. Al elegir un grupo se
seleccionan su tipo y las categorías presentes en el historial. Los grupos del
mismo tipo se acumulan; tocar uno activo quita solo sus categorías. Cambiar a
un grupo del otro tipo inicia una selección de ese tipo. Un grupo sin
movimientos queda deshabilitado. Los rangos completan los límites monetarios
del panel y se combinan con fecha, depósitos y búsqueda. Los criterios activos
siguen pudiendo quitarse individualmente. Cada grupo seleccionado se muestra
por su nombre, sin desglosar sus categorías en chips separados. «Limpiar» queda fijo a la derecha de
la línea inferior y no se desplaza junto con los chips. La línea mantiene su
altura y muestra «Sin filtros seleccionados» cuando está vacía. Todos usan altura mínima
de 38 puntos y tipografía secundaria compartida, conservando los anchos previos.

### Filtros

El botón «Filtros» indica la cantidad de criterios activos y abre una hoja modal
sobre un overlay. El panel tiene un encabezado fijo y una manija que permite
cerrarlo al deslizar hacia abajo. Las secciones se expanden dentro del panel y
resumen su selección cuando están cerradas. El orden es Tipo, Fecha, Categorías,
Depósitos y Monto. La presentación y las secciones plegables se extraen a
`MovementFiltersPanel.tsx`, reutilizado por Estadísticas con sus categorías,
depósitos y límites monetarios; Movimientos conserva sus fechas y tipos existentes.

- **Tipo:** Todos, Ingresos o Egresos, repartidos por igual en la fila. Al
  elegir un tipo, Categorías muestra solo las opciones de ese tipo y quita las
  selecciones incompatibles.
- **Fecha:** Todo, Día, Semana, Mes o Personalizado, en una fila desplazable de
  opciones de ancho uniforme. Un degradado suave en el borde indica si hay
  opciones fuera del área visible; sigue el desplazamiento y desaparece en el
  extremo correspondiente. Día usa un calendario inline; Semana toma una fecha
  y usa la semana de lunes a domingo; Mes permite elegir mes y año;
  Personalizado permite elegir inicio y fin e incluye ambas fechas.
- **Depósitos:** el selector compartido abre una lista flotante con íconos y
  colores reales, selección múltiple y acción Listo. Aparecen todos seleccionados inicialmente. Si están todos
  seleccionados no se restringen los resultados; al desmarcar alguno, se
  filtran por los que continúan marcados. No se puede quitar el último depósito
  hasta marcar otro. «Todos» vuelve a seleccionar cada depósito. Las opciones
  son depósitos reales con movimientos del usuario actual.
- **Categorías:** selección múltiple en una grilla adaptable de tres o cuatro
  columnas, sin desplazamiento horizontal. Los fondos usan el color de acento
  de cada categoría (pastel en claro y más saturado en oscuro); solo aparecen
  categorías presentes en el historial del usuario y la selección no cierra el
  panel.
- **Monto:** campos numéricos separados y espaciados para mínimo y máximo, con
  etiquetas e íconos que identifican cada límite.

Los íconos de depósito usan la misma paleta, fondos e íconos del Dashboard.
Cada criterio aplicado aparece como un chip que puede quitarse. Si solo queda
un depósito seleccionado, su chip muestra el bloqueo hasta que se elija otro.
«Limpiar filtros» aparece en un pie fijo del panel cuando hay criterios activos
y restablece los criterios, incluidos todos los depósitos seleccionados. El
tipo, la fecha, el monto, la categoría, el depósito y la búsqueda se envían como
condiciones combinadas a SQLite. Se aprovechan los índices de depósito, fecha,
tipo y categoría del esquema inicial.

### Detalle

Al presionar una tarjeta se navega a `DETALLE_MOVIMIENTO`
(`src/screens/MovementDetailScreen.tsx`, ya registrado) con solo
`{movimientoId}`. El detalle vuelve a consultar el movimiento y sus relaciones
por ID y usuario activo. Muestra tipo, monto con signo, descripción, categoría,
depósito, fecha y hora, estado y la fila `Recurrente: Sí · Frecuencia` solo
cuando existe recurrencia. Si el registro dejó de estar disponible, muestra un
error controlado y permite volver; si falla la lectura, ofrece reintentar. Al
volver, los filtros se conservan y el historial se consulta nuevamente al
recuperar el foco.

El detalle reúne toda la información en una tarjeta compacta. Tipo y categoría
comparten una cabecera de superficie neutra con el importe destacado sobre un
fondo suave, como en las tarjetas de movimientos. Categoría e importe conservan
dos columnas flexibles; la categoría admite varias líneas sin acortarse y el
importe ajusta el texto dentro de su columna sin pasar debajo por su longitud.
El contenido se separa 24 puntos del encabezado de la pantalla.
Las etiquetas usan 14 puntos y los valores, 16, con un icono de categoría de 56 puntos.
La descripción
completa aparece debajo; solo se muestra estado si el registro recibido está
anulado. «Vigente» se omite porque la consulta habitual ya exige `anulado = 0`.
Fecha y hora, depósito y recurrencia cuando corresponde
se presentan como filas compactas de etiqueta y valor con separadores finos.
Se conservan los márgenes laterales de 12 puntos, ambos temas y los estados reales
de carga, error y registro no disponible. La descripción puede seleccionarse y
ocupar varias líneas. El importe se mantiene en una línea: si el texto formateado
supera 12 caracteres, muestra elipsis e icono de ampliación; tocar su contenedor
abre un modal de AHRE con el importe completo seleccionable y Cerrar. El modal
respeta ambos temas, permite desplazamiento horizontal para valores muy largos
y se cierra con X, Cerrar, Atrás o tocando el fondo. La etiqueta accesible
también conserva el valor completo. Los importes cortos y los valores de los datos
usan tamaño de texto adaptable. Fecha y hora usan el formato compacto
`dd/mm/aaaa · hh:mm`, sin saltos de línea.

### Estados vacíos

- **Cargando:** espera la consulta de SQLite sin esqueletos; conserva las filas
  disponibles durante la actualización.
- **Sin movimientos:** tarjeta vacía cuando la cuenta no tiene ingresos ni
  egresos vigentes.
- **Sin resultados:** mensaje para la búsqueda o los filtros, con acción para
  limpiar.
- **Error:** aviso controlado y acción de reintento. Un error al pedir una
  página posterior conserva las filas ya cargadas.

## Funcionamiento sin conexión

La pantalla consulta sesión, movimientos, depósitos, categorías y recurrencias
locales. Búsqueda, filtros, detalle y paginación no requieren Internet ni
invocan servicios externos.

## Edición y corrección desde el detalle

Editar abre el formulario existente de ingreso o egreso con importe, descripción,
categoría, depósito, fecha y hora precargados. Guardar corrección conserva el
original como eliminado, registra su inversa y crea el movimiento actualizado
en una sola transacción: pasar de 100 a 150 descuenta solo 50 adicionales.
Los reintentos no duplican la operación y corregir una ocurrencia no cambia
la programación futura. Eliminar tiene ícono de papelera, fondo rojo y confirmación
con acción secundaria de cancelar. Una ocurrencia permite desactivar su recurrencia.
El original se muestra como eliminado, con texto e importe tachados, y se registra
una corrección vinculada identificada como tal. No se cuentan en las estadísticas.

El reemplazo mantiene la categoría precargada salvo que se elija otra. La inversa
usa Otros ingresos u Otros gastos porque su tipo es opuesto; su finalidad es
neutralizar el original y no representa una nueva fuente de ingreso o consumo.
El botón para consultar el original queda separado del resumen del detalle.
