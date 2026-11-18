# OCR de comprobantes de AHRE

## Alcance y flujo

La pantalla secundaria existente `src/screens/OcrScreen.tsx` utiliza ML Kit para
reconocimiento local y permite confirmar exclusivamente egresos. El comparador
temporal y las opciones Tesseract se retiraron por indicación del líder.

Desde Dashboard o Nuevo, el botón «Escanear» abre la pantalla existente de OCR para elegir cámara o galería y ajustar el recorte. Después se reconoce e interpreta el contenido, se revisa y se seleccionan categoría y depósito antes de confirmar el egreso local.

## Captura y recorte

Antes de mostrar el escáner se consultan los depósitos activos al entrar y al
recuperar foco. Sin depósitos, se muestra únicamente la tarjeta «Todavía no tenés
depósitos» con «Nuevo depósito», como en Ingreso/Egreso; cámara y galería no se
ofrecen. La carga permite reintentar si falla.

El visor mantiene la cámara en vivo y el obturador debajo. Escanear se transforma
en Tomar foto dentro de la misma fila, con Galería siempre en la misma posición.
La cámara se monta
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

`src/ocr/OcrExpenseForm.tsx` es un formulario dentro de la misma pantalla, con:

- comercio reconocido como referencia;
- total editable mediante `MoneyInput`;
- descripción multilínea editable con comercio y posibles productos;
- categorías y depósitos reales mediante los selectores existentes;
- fecha y hora editables con los selectores compartidos;
- foto temporal del comprobante;
- «Texto reconocido», sección desplegable con chevron y texto seleccionable;
- «Confirmar egreso» y la acción secundaria «Escanear otro comprobante».

Si falta monto se deja vacío. Si falta fecha/hora se propone la actual y se
explica visiblemente. La descripción mantiene el límite financiero de 500
caracteres: una propuesta extensa se conserva para revisar y resumir, con
contador y validación, sin truncarla automáticamente.

La creación de depósitos se resuelve antes de capturar, sin otra invitación en
el formulario del resultado. Confirmar sigue protegido si no hay depósitos.
Categoría y depósito no se eligen automáticamente. Un error de carga ofrece reintento.

## Guardado y presentación

Se reutilizan `cargarDatosMovimiento('egreso')`, `validarDatosMovimiento` y
`crearMovimiento(datos, 'egreso')`, sin otro mecanismo de persistencia. Los
controles y el regreso del encabezado se bloquean mientras se guarda; una
referencia evita confirmar el mismo resultado nuevamente. Los errores de campo
se muestran junto al dato y los generales usan el toast de AHRE. Un error de
guardado conserva el borrador. El éxito informa y regresa a la pantalla anterior.

Se conservan los componentes compartidos sin modificarlos, los estilos locales
de `OcrScreenStyles.ts`, los tokens globales y ambos temas. La foto sirve para
revisar: no se almacena como adjunto permanente del movimiento.

La evaluación, heurísticas, límites, imágenes, funcionamiento offline y pruebas
están documentados en [`../funcionalidades/ocr.md`](../funcionalidades/ocr.md).


## Lectura y ayudas de revisión

La confirmación distingue los valores editables de los accesos de ayuda con
icono, título coloreado y modal de información compartido. El comercio aparece como sugerencia, con una explicación
en un modal del criterio: el parser recorre las cinco primeras líneas
reconstruidas por posición y elige la primera con tres letras consecutivas, sin
moneda ni importe decimal, que no parezca información administrativa ni esté
seguida solo por un importe. Puede confundir un producto con el nombre del
negocio; no consulta un registro comercial ni verifica su identidad. El usuario
puede corregir el nombre en Descripción. No se modificó este algoritmo en el
cambio de presentación.
