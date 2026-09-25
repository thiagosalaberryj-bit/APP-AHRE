# Interfaces de movimientos de AHRE

## Alcance

Este documento registra el maquetado del formulario de egreso. En esta etapa
no hay persistencia, modificación de saldos, consultas reales, validaciones
funcionales, recurrencias, actualización del Dashboard ni estadísticas. Los
botones solo representan el flujo visual y los datos son simulados.

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
├── Información adicional
│   ├── Fecha
│   ├── Hora
│   └── Recurrente
│
└── Acciones
    ├── Guardar egreso
    └── Cancelar
```

El flujo visual es `Dashboard → Egreso → completar formulario →
Guardar egreso / Cancelar`, accesible también desde `Nuevo → Egreso`.

## Diferencias visuales respecto de Ingreso

- Título y descripción propios: «Nuevo egreso» y «Registra el dinero que
  gastas».
- La descripción es obligatoria y se marca con `*`.
- Las categorías son las de egreso; Ingreso reutilizará los mismos
  componentes con sus propias categorías cuando se maqueten.
- El color de egreso (`#E7B0B0`) queda reservado para futuros listados; el
  formulario usa los tokens neutros y de foco para no saturar.

## Campos

### Monto

`EntradaMonto` (`src/components/MoneyInput.js`) con teclado numérico,
prefijo `$`, formato visual `12.500`, estado enfocado con `tema.foco`,
estado inválido con `campoError` y botón `X` para limpiar. El contador y la
limpieza son solo visuales.

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

`SelectorCategoria` (`src/components/CategorySelector.js`) con tarjetas
horizontales y datos simulados:

```text
Comida
Transporte
Servicios
Entretenimiento
Otros
```

La seleccionada usa borde `tema.foco` e ícono destacado. Se acompaña con
texto, no solo color.

### Fecha

`SelectorFecha` (`src/components/DateSelector.js`): fila con ícono de
calendario y valor simulado «Hoy, 25 de mayo de 2025». Solo visual, sin
selector nativo porque no se agregan dependencias en este Issue.

### Hora

`SelectorHora` (`src/components/TimeSelector.js`): fila con ícono de reloj
y valor simulado «7:43». Solo visual.

### Recurrencia

`ControlRecurrencia` (`src/components/RecurrenceControl.js`): fila con
`Conmutador` (`src/components/Toggle.js`) reutilizado del patrón visual de
Inicio de Sesión, con animación `56 × 32` y valor `No/Sí`. Solo cambia el
estado en pantalla; no implementa repetición.

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
solo en enfocado o seleccionado; en móvil no hay `hover`. Además se
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
- **Error general:** `MensajeError` con «Revisá los campos marcados antes
  de guardar el egreso».

Los errores solo se muestran al presionar «Guardar egreso» para representar
los estados; no hay validación funcional, persistencia ni cálculo de saldos.

## Teclado, scroll y temas

El formulario combina `KeyboardAvoidingView` con `ScrollView` y
`keyboardShouldPersistTaps="handled"`. El monto abre teclado numérico. El
contenido limita su ancho a 480 puntos y conserva márgenes en pantallas
pequeñas. Lee el modo claro u oscuro del sistema y aplica `TEMAS.claro` u
`TEMAS.oscuro` a fondos, textos, bordes y botones.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
