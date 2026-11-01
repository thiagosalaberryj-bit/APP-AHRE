# Interfaces de movimientos de AHRE

## Alcance

Este documento registra los formularios de egreso e ingreso. Ambos reutilizan
el mismo formulario y sus componentes; consultan depósitos y categorías
locales, validan y persisten el movimiento junto con su impacto en el saldo.
La ejecución automática de recurrencias y la actualización de estadísticas
quedan fuera de este alcance.

## Estructura del formulario de egreso

`src/screens/ExpenseScreen.tsx` presenta «Nuevo egreso» con
`EncabezadoSeccion` y un formulario desplazable compatible con el teclado:

```text
Nuevo egreso
│
├── Monto
├── Descripción *
├── Depósito
├── Categoría
│   ├── cuatro accesos directos
│   └── Más → modal con categorías adicionales
├── Información adicional
│   ├── Fecha
│   ├── Hora
│   ├── Recurrente
│   └── Aclaración: los movimientos anteriores a la creación del depósito no afectan el saldo actual
│
└── Guardar egreso
```

El formulario se abre desde `Dashboard → Egreso` o `Nuevo → Egreso`. Consulta
SQLite para obtener los depósitos activos del usuario y las categorías de
egreso del catálogo local. La flecha del encabezado permite volver; al pie
queda únicamente la acción «Guardar egreso».

Si no hay depósitos activos, muestra el estado para crear uno y oculta el
formulario. Al regresar de Nuevo depósito, vuelve a consultar los datos locales.

## Estructura del formulario de ingreso

`src/screens/IncomeScreen.tsx` contiene el formulario compartido, configurado
como «Nuevo ingreso» desde su ruta existente:

```text
Nuevo ingreso
│
├── Monto
├── Descripción *
├── Depósito
├── Categoría
├── Información adicional
│   ├── Fecha
│   ├── Hora
│   ├── Recurrente
│   └── Aclaración: los movimientos anteriores a la creación del depósito no afectan el saldo actual
│
└── Guardar ingreso
```

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
«Más» abre un modal con las categorías adicionales. El servicio de categorías
entrega el catálogo local de ingreso o egreso definido en
`src/constants/movimientos.ts`.

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
la ejecución automática de recurrencias queda pendiente.

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
abre teclado numérico. El contenido limita su ancho a 480 puntos y conserva
márgenes en pantallas pequeñas. Las cinco tarjetas de categoría se distribuyen
en el ancho disponible sin scroll horizontal. Lee el modo claro u oscuro del
sistema y aplica `TEMAS.claro` u `TEMAS.oscuro` a fondos, textos, bordes,
botones y modales.

## Historial y detalle de movimientos

`src/screens/MovementsScreen.tsx` es pestaña con `MainHeader` («Movimientos») y
consulta SQLite para el usuario de la sesión y agrupa los movimientos vigentes
por día. Solo presenta `ingreso` y `egreso`; el tipo se lee desde el campo
`tipo`, no se deduce del monto. Los encabezados muestran «Hoy», «Ayer» o la
fecha para los días anteriores. Cada tarjeta usa un ícono de categoría y
presenta `categoría · descripción`, `hora · depósito`, «Ingreso» o «Egreso» y
el monto con signo. La descripción se recorta cuando no entra; el tipo también
se indica con texto, no solo con color. Los estilos locales están en
`src/styles/MovementsScreenStyles.ts`.

Las filas reutilizan `TarjetaMovimiento` (`src/components/MovementCard.tsx`) y
reciben el nombre real del depósito relacionado. SQLite ordena por
`fecha_hora DESC, id DESC`. La pantalla carga 50 filas por página; «Cargar más
movimientos» solicita la siguiente página usando la fecha, hora e ID de la
última fila como cursor.

### Buscador

El buscador comparte la fila con el botón «Filtros». Tiene lupa,
`placeholder` «Buscar» y botón `X` para limpiar. Su borde es fino y neutro en
reposo; solo toma el color de foco mientras el campo está enfocado. La búsqueda
se realiza en SQLite, ignora mayúsculas y minúsculas y consulta la descripción.
Se aplica junto con los filtros. Debajo aparecen los criterios activos como
chips horizontales; cada chip se puede quitar y «Limpiar todo» restablece la
búsqueda y los filtros. Si no hay coincidencias, se muestra `Sin resultados
para “…”` o un mensaje para los filtros seleccionados.

### Filtros

El botón «Filtros», de la misma altura que el buscador, abre una hoja modal
sobre un overlay. El panel tiene un encabezado fijo y una manija que permite
cerrarlo al deslizar hacia abajo. Las secciones se expanden dentro del panel y
resumen su selección cuando están cerradas. El orden es Tipo, Fecha, Categorías,
Depósitos y Monto.

- **Tipo:** Todos, Ingresos o Egresos, repartidos por igual en la fila. Al
  elegir un tipo, Categorías muestra solo las opciones de ese tipo y quita las
  selecciones incompatibles.
- **Fecha:** Todo, Día, Semana, Mes o Personalizado, en una fila desplazable de
  opciones de ancho uniforme. Un degradado suave en el borde indica si hay
  opciones fuera del área visible; sigue el desplazamiento y desaparece en el
  extremo correspondiente. Día usa un calendario inline; Semana toma una fecha
  y usa la semana de lunes a domingo; Mes permite elegir mes y año;
  Personalizado permite elegir inicio y fin e incluye ambas fechas.
- **Depósitos:** aparecen todos seleccionados inicialmente. Si están todos
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

### Estados vacíos

- **Cargando:** skeleton mientras SQLite devuelve la página solicitada.
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
