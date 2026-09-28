# OCR de comprobantes de AHRE

## Alcance

Este documento registra el flujo de escaneo y carga de tickets o comprobantes.
La cámara y la galería entregan una imagen real mediante `expo-image-picker`; su
URI se conserva en el borrador local mientras se revisa el egreso. El
reconocimiento y los datos extraídos continúan simulados. No se crea el
movimiento, no se guarda la imagen de forma permanente, no se actualiza el saldo
ni se comunica con un backend.

## Flujo

`src/screens/OcrScreen.js` es secundaria (acceso desde la acción rápida del
Dashboard) con `EncabezadoSeccion` («Escanear comprobante») y estados locales en
la misma pantalla:

```text
Dashboard
→ OCR
→ tomar foto / elegir imagen de la galería
→ procesando
→ resultado (total, productos, comprobante, categoría, depósito, fecha y hora)
→ confirmar egreso (visual)
```

## Pantalla inicial

Área de cámara con guía visual e instrucciones. `Escanear` solicita permiso y
abre la cámara del sistema; `Galería` abre el selector del sistema. La imagen
seleccionada se conserva en el borrador mientras se completa el formulario. En
el resultado, `Volver a escanear` regresa a la cámara. El regreso desde el
inicio queda en la flecha del encabezado.

## Estado procesando

Tarjeta con indicador, «Analizando comprobante...» y aviso de espera, más
`Cancelar`. Incluye un link sutil `Simular error de lectura`, solo ayuda de
verificación para representar el error sin OCR real.

## Error de lectura o acceso

Tarjeta con ícono y un mensaje acorde al problema: no se pudo leer el ticket,
abrir la imagen o acceder a la cámara. Incluye una sugerencia de reintento o
carga manual, `Intentar nuevamente` (repite el procesamiento o vuelve a abrir
el selector) y `Cancelar`.

## Resultado

Formulario editable con los datos reconocidos (simulados), en este orden:

- Total del ticket (`EntradaMonto`), corregible con `X` para limpiar;
- Detalle de productos editable como texto multilínea, un producto por línea
  con cantidad, precio unitario y subtotal, y contador de 500 caracteres; la
  letra compacta y la altura limitada permiten desplazar descripciones extensas
  dentro del campo;
- Comprobante adjunto con vista previa completa de la imagen capturada o
  elegida;
- Categoría con `SelectorCategoria` (catálogo de egresos), sin selección
  inicial;
- Depósito con `SelectorDeposito` (`Efectivo, Mercado Pago, Cuenta bancaria`),
  sin selección inicial;
- Fecha y hora con `SelectorFecha` y `SelectorHora` (modales compartidos), al
  final para revisar o ajustar.

El usuario completa o confirma categoría, depósito, fecha y hora; no se muestra
una alerta por datos que el OCR no pueda determinar. Acciones `Confirmar`
(principal, visual, aún no crea el egreso) y `Volver a escanear`. No se muestra
la acción `Cancelar` en el resultado.

## Estados visuales

- **Cámara preparada:** visor, guía e instrucciones.
- **Capturando:** `Escanear` abre la cámara y `Galería` abre el selector de
  imágenes.
- **Procesando:** indicador, mensaje y cancelación.
- **Resultado:** total, detalle de productos, vista previa del comprobante y
  selectores editables; los campos no detectables quedan para el usuario sin
  alertas.
- **Error de lectura o acceso:** mensaje, reintento y cancelación.

## Decisiones de diseño

- Un solo archivo de pantalla con estados, como permite el Issue; sin pantallas
  nuevas.
- Reutilización: `MoneyInput, CategorySelector, DepositSelector, DateSelector,
  TimeSelector, PrimaryButton, SectionHeader` sin modificarlos; los estilos de
  formulario vienen de `expenseStyles.js` y los estilos propios de esta pantalla
  de `src/styles/OcrScreenStyles.js`.
- La imagen se mantiene en el borrador en memoria y se presenta como adjunto al
  egreso; la persistencia del archivo y del movimiento queda pendiente de la
  implementación funcional.
- El formulario se desplaza hasta el final, mantiene espacio para el área segura
  inferior y evita que el teclado tape la descripción o las acciones.
- La descripción de productos usa letra compacta y altura máxima; el texto largo
  se desplaza dentro del campo para dejar accesibles el resto del formulario y
  la confirmación.
- El tema viene de `ContextoApariencia`, como el resto de la app.
- Sin `hover`: todo por foco, selección y texto.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
