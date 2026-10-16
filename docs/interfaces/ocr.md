# OCR de comprobantes de AHRE

## Alcance y flujo

La pantalla secundaria existente `src/screens/OcrScreen.js` utiliza ML Kit para
reconocimiento local y permite confirmar exclusivamente egresos. El comparador
temporal y las opciones Tesseract se retiraron por indicación del líder.

```text
Dashboard o Nuevo → OCR → cámara / galería → ajustar recorte
→ reconocer e interpretar → revisar → seleccionar categoría y depósito
→ confirmar egreso local
```

## Captura y recorte

El visor mantiene la cámara en vivo y el obturador debajo. La cámara se monta
solo cuando la pantalla tiene foco y la captura está activa. Galería utiliza
el selector del sistema. El permiso rechazado o un error de cámara permiten
reintentar o regresar, sin bloquear el resto de AHRE.

La imagen se puede arrastrar y ampliar antes de confirmar el recorte. La ayuda
pide incluir comercio, productos, fecha y total. El recorte generado en caché
se entrega al módulo nativo; no se sube a un servicio externo.

## Procesamiento y errores

Se muestra «Analizando comprobante...» y una acción para cancelar. Los envíos
repetidos se bloquean. Texto vacío, imagen inválida y errores del motor muestran
un mensaje controlado, reintento, volver a escanear y cancelación. Si existe
texto pero faltan campos, se abre la revisión para completarlos manualmente.

## Revisión del egreso

`src/ocr/OcrExpenseForm.js` es un formulario dentro de la misma pantalla, con:

- comercio reconocido como referencia;
- total editable mediante `MoneyInput`;
- descripción multilínea editable con comercio y posibles productos;
- categorías y depósitos reales mediante los selectores existentes;
- fecha y hora editables con los selectores compartidos;
- foto temporal del comprobante;
- «Ver texto reconocido», desplegable y seleccionable;
- «Confirmar egreso» y «Volver a escanear».

Si falta monto se deja vacío. Si falta fecha/hora se propone la actual y se
explica visiblemente. La descripción mantiene el límite financiero de 500
caracteres: una propuesta extensa se conserva para revisar y resumir, con
contador y validación, sin truncarla automáticamente.

Si no existen depósitos se ofrece «Crear depósito» mediante la ruta existente;
confirmar queda deshabilitado. Al regresar se conservan el resultado y las
correcciones y se recargan los depósitos. Categoría y depósito no se eligen
automáticamente. Un error de carga ofrece reintento.

## Guardado y presentación

Se reutilizan `cargarDatosMovimiento('egreso')`, `validarDatosMovimiento` y
`crearMovimiento(datos, 'egreso')`, sin otro mecanismo de persistencia. Los
controles y el regreso del encabezado se bloquean mientras se guarda; una
referencia evita confirmar el mismo resultado nuevamente. Los errores de campo
se muestran junto al dato y los generales usan el toast de AHRE. Un error de
guardado conserva el borrador. El éxito informa y regresa a la pantalla anterior.

Se conservan los componentes compartidos sin modificarlos, los estilos locales
de `OcrScreenStyles.js`, los tokens globales y ambos temas. La foto sirve para
revisar: no se almacena como adjunto permanente del movimiento.

La evaluación, heurísticas, límites, imágenes, funcionamiento offline y pruebas
están documentados en [`../funcionalidades/ocr.md`](../funcionalidades/ocr.md).
