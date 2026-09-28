# OCR de comprobantes de AHRE

## Alcance

Este documento registra el flujo de escaneo y carga de tickets o comprobantes.
La vista en vivo y la captura se realizan con `expo-camera`; `expo-image-picker`
permite elegir una imagen de la galería. El URI se conserva en el borrador local
mientras se revisa el egreso. El reconocimiento y los datos extraídos continúan
simulados. No se crea el movimiento, no se guarda la imagen de forma permanente,
no se actualiza el saldo ni se comunica con un backend.

## Flujo

`src/screens/OcrScreen.js` es secundaria (acceso desde la acción rápida del
Dashboard) con `EncabezadoSeccion` («Escanear comprobante») y estados locales en
la misma pantalla:

```text
Dashboard
→ OCR
→ vista en vivo / tomar foto o elegir imagen de la galería
→ ajustar encuadre (arrastrar y acercar/alejar) / confirmar recorte
→ procesando
→ resultado (total, productos, comprobante, categoría, depósito, fecha y hora)
→ confirmar egreso (visual)
```

## Pantalla inicial

El visor muestra la vista previa de la cámara con una guía para encuadrar el
ticket. `Escanear` solicita permiso y activa la cámara en ese espacio; el botón
`Tomar foto` superpuesto toma la foto. `Galería` abre el selector del sistema.
Luego se puede arrastrar la foto y usar los controles de zoom para ajustar el
encuadre; `Usar este recorte` genera y adjunta ese recorte al borrador. `Volver
a escanear` regresa al visor. La cámara se pausa al salir de esta pantalla, al
ajustar el encuadre y al revisar el resultado. La imagen recortada se conserva
en el borrador mientras se completa el formulario.

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
  altura limitada permite desplazar descripciones extensas dentro del campo;
- Comprobante adjunto con vista previa de la imagen capturada o elegida y
  recortada según el encuadre confirmado;
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

- **Cámara preparada:** guía e instrucciones en el visor.
- **Vista en vivo:** imagen de la cámara y obturador dentro del visor; `Galería`
  permite elegir otra imagen.
- **Ajuste de encuadre:** se arrastra la foto y se acerca o aleja con controles;
  se muestra una guía centrada y se confirma antes de generar el archivo
  recortado que queda adjunto al formulario.
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
  egreso; el archivo recortado se genera en la caché local, mientras que la
  persistencia permanente del archivo y del movimiento queda pendiente de la
  implementación funcional.
- La cámara se monta únicamente en OCR y cuando esa pantalla tiene el foco; se
  desmonta durante el procesamiento y al revisar el resultado.
- El formulario se desplaza hasta el final, mantiene espacio para el área segura
  inferior y evita que el teclado tape la descripción o las acciones.
- La descripción de productos conserva el tamaño de texto del formulario y usa
  altura máxima; el texto largo se desplaza dentro del campo para dejar
  accesibles el resto del formulario y la confirmación.
- El tema viene de `ContextoApariencia`, como el resto de la app.
- Sin `hover`: todo por foco, selección y texto.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
