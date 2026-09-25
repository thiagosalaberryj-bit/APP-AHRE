# Interfaces de movimientos de AHRE

## Alcance

Este documento registra los formularios de egreso e ingreso. En esta etapa no hay
persistencia, modificación de saldos, consultas reales, validaciones
funcionales, ejecución de recurrencias, actualización del Dashboard ni
estadísticas. La fecha, la hora y la frecuencia se mantienen solo en el estado
de la pantalla; los depósitos y las categorías son datos locales simulados.

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
o anual, solo en estado visual. «Guardar ingreso» usa la acción principal y
muestra los errores y el estado de guardado simulado. El pie no incluye una
acción para cancelar; la flecha del encabezado permite regresar al flujo
anterior. No hay persistencia, saldos ni lógica funcional.

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
desplegable y datos simulados de `src/constants/movimientos.js`:

```text
Efectivo
Mercado Pago
Cuenta bancaria
```

Muestra nombre y saldo simulado como texto. La lista se abre en un `Modal`
transparente superpuesto para no desplazar el formulario; la selección se
identifica con borde de foco y radio activo. No consulta la base de datos.

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
no guarda ni procesa movimientos.

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
color. En móvil no hay `hover`. Además se
reutilizan `SectionHeader`, `PrimaryButton` y `ErrorMessage` sin
modificarlos. Los estilos locales están en
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
- **Guardando:** `BotonPrincipal` con indicador y «Procesando…» durante
  1,5 segundos simulados.
- **Fecha y hora:** los modales reflejan la selección vigente; elegir un día o
  confirmar la hora actualiza el formulario.
- **Frecuencia recurrente:** las cuatro opciones muestran la frecuencia activa
  cuando el conmutador está habilitado.
- **Error general:** `MensajeError` con «Revisá los campos marcados antes
  de guardar el egreso».

Los errores solo se muestran al presionar «Guardar egreso» para representar
los estados; no hay validación funcional, persistencia ni cálculo de saldos.

## Teclado, scroll y temas

El formulario combina `KeyboardAvoidingView` con `ScrollView`,
`keyboardShouldPersistTaps="handled"` y espacio inferior según el área segura
del dispositivo para que el botón de guardado pueda verse completo. El monto
abre teclado numérico. El contenido limita su ancho a 480 puntos y conserva
márgenes en pantallas pequeñas. Las cinco tarjetas de categoría se distribuyen
en el ancho disponible sin scroll horizontal. Lee el modo claro u oscuro del
sistema y aplica `TEMAS.claro` u `TEMAS.oscuro` a fondos, textos, bordes,
botones y modales.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
