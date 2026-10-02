# Interfaces de movimientos de AHRE

## Alcance

Este documento registra los formularios de egreso e ingreso. Ingreso consulta
SQLite, valida y persiste el movimiento con su impacto en el saldo; Egreso
continúa siendo una maqueta sin guardado. El ingreso carga depósitos y
categorías locales, conserva fecha, hora y recurrencia, y muestra un aviso
general mediante toast cuando hay errores. La ejecución automática de
recurrencias y la actualización de estadísticas quedan fuera de este alcance.

## Estructura del formulario de egreso

`src/screens/ExpenseScreen.js` presenta «Nuevo egreso» con
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
│   └── Recurrente
│
└── Guardar egreso
```

El formulario se abre desde `Dashboard → Egreso` o `Nuevo → Egreso`. La flecha
del encabezado permite volver; al pie queda únicamente la acción «Guardar
egreso».

## Estructura del formulario de ingreso

`src/screens/IncomeScreen.js` presenta «Nuevo ingreso» con la misma
estructura y componentes compartidos que el egreso:

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
│   └── Recurrente
│
└── Guardar ingreso
```

El formulario se abre desde `Dashboard → Ingreso` o `Nuevo → Ingreso`.
La descripción es obligatoria y se marca con `*`. El monto usa teclado
numérico con prefijo `$` y formato visual. El depósito y la categoría usan
los mismos selectores compartidos con sus catálogos propios
(`CATEGORIAS_INGRESO`). La fecha y la hora usan los modales compartidos;
la recurrencia usa el `Conmutador` con frecuencias diaria, semanal, mensual
o anual. «Guardar ingreso» valida los campos, comprueba el depósito y la
categoría y guarda el movimiento local; si se activa la recurrencia, también
guarda su configuración. El pie no incluye una acción para cancelar; la flecha
del encabezado permite regresar al flujo anterior.

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

`EntradaMonto` (`src/components/MoneyInput.js`) con teclado numérico,
prefijo `$`, formato visual `12.500` y un campo destacado de `76` puntos con
tipografía de `32` puntos. Incluye estado enfocado con `tema.foco`, estado
inválido con `campoError` y botón `X` para limpiar. El contador y la limpieza
son solo visuales.

### Descripción obligatoria

Campo de texto con ícono, `placeholder` con ejemplos
(`Supermercado, Transporte, Cena`), contador `0/500` visual y mensaje
«La descripción es obligatoria» cuando se intenta guardar vacío. No valida
ni guarda datos.

### Depósito

`SelectorDeposito` (`src/components/DepositSelector.js`) con tarjeta
desplegable. Ingreso recibe los depósitos activos desde SQLite; Egreso continúa
usando los datos simulados de `src/constants/movimientos.js`:

```text
Efectivo
Mercado Pago
Cuenta bancaria
```

Muestra nombre y saldo como texto. La lista se abre en un `Modal` transparente
superpuesto para no desplazar el formulario; la selección se identifica con
borde de foco y radio activo.

### Categoría

`SelectorCategoria` (`src/components/CategorySelector.js`) muestra cuatro
tarjetas compactas y una quinta tarjeta «Más», sin desplazamiento horizontal.
«Más» abre un modal con las categorías adicionales. Todos los datos son
constantes locales de `src/constants/movimientos.js`.

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

El selector de ingreso conserva la selección mientras la pantalla está abierta;
la pantalla valida el identificador contra el catálogo local antes de guardar.

### Fecha

`SelectorFecha` (`src/components/DateSelector.js`): muestra la fecha actual o
la fecha elegida. Al presionarla abre un calendario mensual en un modal, permite
navegar entre meses y seleccionar un día o volver a hoy. No guarda la fecha.

### Hora

`SelectorHora` (`src/components/TimeSelector.js`): muestra la hora actual o la
elegida. El modal permite ajustar horas y minutos en formato de 24 horas y
confirmar la selección. No guarda la hora.

### Recurrencia

`ControlRecurrencia` (`src/components/RecurrenceControl.js`): fila con
`Conmutador` (`src/components/Toggle.js`) reutilizado del patrón visual de
Inicio de Sesión, con transición animada, tamaño `56 × 32` y valor `No/Sí`. Al
activarlo, permite seleccionar una frecuencia diaria, semanal, mensual o anual.
Las opciones ocupan todo el ancho de la tarjeta y aparecen sin animación de
expansión. La frecuencia solo se conserva en el estado de la pantalla; no
programa ni genera movimientos.

## Componentes compartidos con Ingreso

Los componentes se crearon como comunes para que Ingreso los reutilice sin
duplicar implementaciones idénticas:

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
`src/styles/expenseStyles.js` y consumen tokens de `colors.js` y
`globalStyles.js`. Los datos simulados están en
`src/constants/movimientos.js`.

## Estados visuales

- **Normal:** bordes y superficies del tema global.
- **Monto inválido:** borde y mensaje de error junto al campo.
- **Descripción faltante:** borde y mensaje «La descripción es
  obligatoria».
- **Depósito faltante:** borde y mensaje junto al selector.
- **Categoría faltante:** mensaje junto a las tarjetas.
- **Guardando:** `BotonPrincipal` con indicador y «Procesando…» mientras se
  guarda el ingreso; en Egreso el estado continúa simulado durante 1,5 segundos.
- **Fecha y hora:** los modales reflejan la selección vigente; elegir un día o
  confirmar la hora actualiza el formulario.
- **Frecuencia recurrente:** las cuatro opciones muestran la frecuencia activa
  cuando el conmutador está habilitado.
- **Error general:** un toast indica que se revisen los campos marcados y los
  errores específicos permanecen junto a los campos; no se muestra un mensaje
  general al pie del formulario.

Los avisos aparecen al presionar «Guardar ingreso» o «Guardar egreso». Ingreso
comprueba monto, descripción, depósito, categoría, fecha, hora y frecuencia
cuando corresponde; persiste el movimiento y actualiza el saldo dentro de una
transacción. Egreso solo comprueba los campos requeridos y no persiste datos.

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

`src/screens/MovementsScreen.js` es pestaña con `MainHeader` («Movimientos») y
agrupa los movimientos simulados por día. Los encabezados
muestran «Hoy», «Ayer» o la fecha para los días anteriores. Cada tarjeta usa
un ícono de categoría sobre el color del tipo y presenta `categoría ·
descripción`, `hora · depósito`, «Ingreso» o «Egreso» y el monto con signo.
La descripción se recorta cuando no entra; el tipo también se indica con texto,
no solo con color. La misma composición se usa en los movimientos recientes del
Dashboard. Los estilos locales están en
`src/styles/MovementsScreenStyles.js`.

Las filas reutilizan `TarjetaMovimiento` (`src/components/MovementCard.js`) y
los datos son `MOVIMIENTOS_SIMULADOS` locales (10 ingresos y egresos de varios
depósitos, en orden cronológico descendente), sin consultas a SQLite. Al tocar
una fila se abre el detalle del movimiento.

### Buscador

El buscador comparte la fila con el botón «Filtros». Tiene lupa,
`placeholder` «Buscar» y botón `X` para limpiar. Su borde es fino y neutro en
reposo; solo toma el color de foco mientras el campo está enfocado. La búsqueda
es local sobre los datos simulados. Debajo aparecen los filtros aplicados como
chips horizontales; cada chip se puede quitar y «Limpiar todo» restablece los
filtros. Si no hay coincidencias, se muestra `Sin resultados para “…”`.

### Filtros

El botón «Filtros», de la misma altura que el buscador, abre una hoja modal
sobre un overlay. El panel tiene un encabezado fijo y una manija que permite
cerrarlo al deslizar hacia abajo. Las secciones se expanden dentro del panel y
resumen su selección cuando están cerradas. El orden es Tipo, Fecha, Depósitos,
Categorías y Monto.

- **Tipo:** Todos, Ingresos o Egresos. Al elegir un tipo, Categorías muestra
  solo las opciones de ese tipo y quita las selecciones incompatibles.
- **Fecha:** Todo, Día, Mes o Rango. Día usa un calendario inline; Mes permite
  elegir mes y año; Rango usa el mismo calendario para elegir inicio y fin, y
  permanece abierto después de elegir la primera fecha.
- **Depósitos:** aparecen todos seleccionados inicialmente. Si están todos
  seleccionados no se restringen los resultados; al desmarcar alguno, se
  filtran por los que continúan marcados. No se puede quitar el último depósito
  hasta marcar otro. «Todos» vuelve a seleccionar cada depósito.
- **Categorías:** selección múltiple en una grilla adaptable de tres o cuatro
  columnas, sin desplazamiento horizontal. Los fondos usan el color de acento
  de cada categoría (pastel en claro y más saturado en oscuro); la selección no
  cierra el panel.
- **Monto:** campos numéricos de mínimo y máximo.

Los íconos de depósito usan la misma paleta, fondos e íconos del Dashboard.
Cada criterio aplicado aparece como un chip que puede quitarse. Si solo queda
un depósito seleccionado, su chip muestra el bloqueo hasta que se elija otro.
«Limpiar filtros» restablece los criterios, incluidos todos los depósitos
seleccionados. El filtrado es local sobre los datos de muestra; no hay consultas
a SQLite.

### Detalle

Al presionar una tarjeta se navega a `DETALLE_MOVIMIENTO`
(`src/screens/MovementDetailScreen.js`, ya registrado) con
`{movimiento, categoria}`. Muestra tipo, monto con signo, descripción,
categoría, depósito, fecha y hora, estado y la fila `Recurrente: Sí ·
Frecuencia` solo cuando el movimiento es recurrente. Al volver, los filtros
se conservan porque el estado queda en la pantalla del historial.

### Estados vacíos

- **Cargando:** skeleton de 3 líneas durante ~1 segundo simulado.
- **Sin movimientos:** tarjeta vacía cuando no hay datos base.
- **Sin resultados de búsqueda:** mensaje con el texto buscado.
- **Sin resultados por filtros:** mensaje con acción para limpiar.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
