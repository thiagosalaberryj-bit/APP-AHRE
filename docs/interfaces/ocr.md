# OCR de comprobantes de AHRE

## Alcance

Este documento registra el flujo de escaneo de tickets o comprobantes. La
cámara y la galería entregan una imagen real mediante `expo-image-picker`; su
URI se conserva en el borrador local mientras se revisa el egreso. El
reconocimiento y los datos extraídos continúan simulados. No se crea el
movimiento, no se guarda la imagen de forma permanente, no se actualiza el saldo
ni se comunica con un backend.

## Flujo de escaneo

`src/screens/OcrScreen.js` es secundaria (acceso desde la acción rápida del
Dashboard) con `EncabezadoSeccion` («Escanear comprobante») y una máquina de
estados locales en la misma pantalla:

```text
Dashboard
→ OCR
→ tomar foto / Galería
→ procesando
→ resultado (total, productos, comprobante, categoría, depósito, fecha y hora)
→ confirmar egreso (visual)
```

## Pantalla inicial

Área de cámara como placeholder oscuro con guía de esquinas en verde claro,
instrucciones («Tomá una foto clara del ticket o elegí una imagen de tu
galería») y acciones mitad y mitad: `Escanear` (principal) y `Galería`
(secundario con ícono). `Escanear` abre la cámara del sistema y solicita
permiso cuando hace falta; `Galería` abre el selector del sistema. La imagen
elegida se conserva en el borrador mientras se completa el formulario. Sin
botón `Cancelar` en cámara (el regreso queda en la flecha del encabezado);
sí hay `Cancelar` en resultado y error. La guía usa proporciones relativas
para adaptarse a distintos tamaños.

## Estado procesando

Tarjeta con indicador, «Analizando comprobante...» y aviso de espera, más
`Cancelar`. Incluye un link sutil `Simular error de lectura`, solo ayuda de
verificación para representar el error sin OCR real. Los errores de permiso o
de apertura de imagen pasan al estado de error descrito debajo.

## Error de lectura o acceso

Tarjeta con ícono y un mensaje acorde al problema: no se pudo leer el ticket,
abrir la imagen o acceder a la cámara. Incluye una sugerencia de reintento o
carga manual, `Intentar nuevamente` (repite el procesamiento o vuelve a abrir
el selector) y `Cancelar`.

## Resultado del escaneo

Formulario editable con los datos reconocidos (simulados), en este orden:

- Total del ticket (`EntradaMonto`, ej. `$ 24.580`), corregible con `X` para
  limpiar;
- Detalle de productos editable como texto multilínea, un producto por línea
  y contador de 500;
- Comprobante adjunto con vista previa de la imagen capturada o elegida;
- Categoría con `SelectorCategoria` (catálogo de egresos), sin selección
  inicial;
- Depósito con `SelectorDeposito` (`Efectivo, Mercado Pago, Cuenta bancaria`),
  sin selección inicial;
- Fecha y hora con `SelectorFecha` y `SelectorHora` (modales compartidos), al
  final para revisar o ajustar.

Escáner y galería llevan al mismo formulario. El usuario completa o confirma
categoría, depósito, fecha y hora; no se muestra una alerta por datos que el
OCR no pueda determinar. Acciones `Confirmar` (principal, visual, aún no crea
el egreso), `Volver a escanear` y `Cancelar`.

## Estados visuales

- **Cámara preparada:** visor + guía + instrucciones.
- **Capturando:** `Escanear` abre la cámara del sistema y `Galería` abre el
  selector de imágenes.
- **Procesando:** indicador + mensaje + cancelación.
- **Resultado:** total, detalle de productos, vista previa del comprobante y
  selectores editables; los campos no detectables quedan para el usuario sin
  alertas.
- **Error de lectura o acceso:** mensaje + reintento + cancelación.

## Decisiones de diseño

- Un solo archivo de pantalla con estados, como permite el Issue; sin
  pantallas nuevas.
- Reutilización: `MoneyInput, CategorySelector, DepositSelector,
  DateSelector, TimeSelector, PrimaryButton, SectionHeader` sin modificarlos;
  los estilos de formulario vienen de `expenseStyles.js` (mismo lenguaje
  visual que crear un egreso) y lo propio del escáner en
  `src/styles/OcrScreenStyles.js`.
- La imagen se mantiene en el borrador en memoria y se presenta como adjunto al
  egreso; la persistencia del archivo y del movimiento queda pendiente de la
  implementación funcional.
- El tema viene de `ContextoApariencia`, como el resto de la app.
- Sin `hover`: todo por foco, selección y texto.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
