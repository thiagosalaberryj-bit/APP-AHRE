# OCR offline de comprobantes — Issue 31

## Estado y decisión

ML Kit es el único motor integrado. El líder lo seleccionó después de comparar
las lecturas en su dispositivo con Tesseract automático y Tesseract en columna.
Se retiraron el selector, el comparador, la dependencia Tesseract y su modelo
español. El flujo ahora permite revisar el reconocimiento y confirmar un egreso
local. El 16 de octubre de 2026, el líder confirmó el buen funcionamiento de
la versión actualizada en su dispositivo. Esta confirmación es cualitativa;
no acredita por sí sola cada escenario manual de aceptación del Issue.

## Alternativas evaluadas

| Alternativa | Evaluación y decisión |
| --- | --- |
| ML Kit Text Recognition 16.0.1 | Probado por el líder; informó mejores lecturas. Entrega texto y coordenadas. Se conserva el modelo latino incluido, disponible sin una descarga inicial. |
| Tesseract4Android 4.9.0 | Probado con modelo español en distribución automática y columna. El líder prefirió ML Kit. Se retiraron dependencia, modelo y código nativo para no mantener alternativas sin uso. |
| PaddleOCR | Investigación documental; no se integró ni se probó en dispositivo. Su despliegue móvil requeriría otra evaluación nativa. |

No se inventaron porcentajes de precisión ni tiempos comparativos: el feedback
fue cualitativo. La evidencia real incluye un ticket de balanza Kretz con fecha
`15/10/26` y `01 ART. TOTAL($ ) 3840.00`; permitió reproducir y corregir la
omisión del año corto y la confusión entre contador de artículos y monto.
El líder también reportó `TOTALCS$)`, variante que ahora se reconoce como
etiqueta y se excluye del detalle de productos.

Fuentes primarias:

- [ML Kit Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android).
- [Términos de ML Kit](https://developers.google.com/ml-kit/terms).
- [Tesseract4Android](https://github.com/adaptech-cz/Tesseract4Android/tree/4.9.0).
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR).
- [Módulos locales Expo](https://docs.expo.dev/modules/get-started/).

## Flujo y arquitectura

```text
Dashboard o Nuevo → OCR → cámara o galería → recorte → ML Kit local
→ interpretación → revisión editable → categoría y depósito → confirmar
→ crearMovimiento(datos, 'egreso') → SQLite → regreso
```

`OcrScreen.js` conserva la captura y el recorte dentro de la pantalla existente.
`src/ocr/ocrService.js` invoca exclusivamente ML Kit; `receiptParser.js` interpreta
texto y posiciones. `OcrExpenseForm.js` presenta la revisión y usa los mismos
selectores de los formularios financieros. `ocrExpenseDraft.js` prepara valores
editables sin guardar nada. El módulo Expo local `modules/receipt-ocr/` contiene
el adaptador Android Kotlin; el resto de la lógica permanece en JavaScript.

Expo Autolinking descubre el módulo. El modelo latino viene en
`com.google.mlkit:text-recognition:16.0.1`; no se usa la variante descargable por
Play Services. Hace falta un APK Android que incluya el módulo; Expo Go no lo
incluye. El parámetro nativo de motor conserva la firma anterior, pero solo
admite `mlkit` y ya no existe ninguna selección de motor en la interfaz.

Se conserva el perfil EAS `ocr-comparison` para no cambiar el comando de pruebas,
aunque su APK ya contiene únicamente ML Kit:

```powershell
npx eas-cli@latest build --platform android --profile ocr-comparison --clear-cache
```

La compilación necesita red para obtener dependencias; la captura, lectura,
corrección y persistencia usan recursos locales. No se envían fotos a servicios
OCR externos. El preprocesamiento nativo limita el lado mayor a 4096 píxeles
mediante muestreo para acotar memoria; tickets largos y letra pequeña pueden
perder calidad y requieren una mejor captura.

## Interpretación y productos

- Se agrupan fragmentos de ML Kit por fila para reunir nombres y precios.
- El total se busca después de TOTAL, TOTAL A PAGAR o IMPORTE. Se excluyen
  subtotal, impuestos y vuelto. Un contador anterior como `01 ART.` no cuenta
  como segundo importe. `TOTALCS$)` se normaliza solo en ese contexto de moneda,
  sin convertir nombres como Totalcare en una etiqueta.
- Varios candidatos distintos de la misma prioridad dejan el monto vacío; el
  usuario debe ingresarlo. Si la geometría no ofrece candidatos, se consulta
  el texto original.
- La fecha admite barras, guiones, puntos y espacios, con año de dos o cuatro
  cifras. Un año corto pertenece a 2000–2099. Se valida el calendario y se
  ignoran líneas de vencimiento/CAE. Varias fechas distintas dejan la propuesta
  sin determinar. La hora se propone cuando figura explícitamente como HORA.
- Los productos se buscan antes del total. Se reconocen filas con importes
  decimales o moneda explícita y precios enteros dentro de tablas identificadas
  por sus encabezados. Hasta dos líneas de nombre pueden unirse con una fila
  de cantidades y precios. No se inventan nombres ni se recalculan precios.
- Se conserva el comercio seguido del detalle detectado en la descripción.
  Un comprobante de balanza sin nombre de producto conserva su peso/precio
  reconocido; el usuario puede completar el nombre.

El papel deteriorado, los errores OCR y los diseños de ticket pueden producir
omisiones. El texto original y la foto siguen disponibles durante la revisión.
No existe clasificación automática de categorías ni una garantía de extracción
completa de todos los productos.

## Revisión, depósitos y confirmación

Monto, descripción, categoría, depósito, fecha y hora son editables. Si no se
detecta fecha/hora se propone la actual con una aclaración visible. Si falta
monto o descripción no se inventan valores. El límite normal de descripción
sigue siendo 500 caracteres: se conserva una propuesta larga y se pide resumirla
antes de guardar, sin truncarla silenciosamente.

`cargarDatosMovimiento('egreso')` obtiene depósitos activos de la sesión y las
categorías reales. Sin depósitos se informa y se ofrece crear uno mediante la
ruta existente; el formulario conserva foto y correcciones al regresar y
recarga las opciones con `useFocusEffect`. No permite confirmar hasta contar
con depósitos. Categoría y depósito requieren selección manual.

La confirmación reutiliza `validarDatosMovimiento` y
`crearMovimiento(datos, 'egreso')`. No hay SQL ni un repositorio paralelo en OCR.
El servicio vuelve a comprobar sesión, depósito y categoría, y guarda el
movimiento positivo con tipo `egreso` y el impacto de saldo en una transacción.
Los movimientos anteriores a la creación del depósito permanecen en el historial
sin modificar su saldo actual, igual que en Egresos. OCR no crea recurrencias.

Durante el guardado se bloquean los controles, la flecha de regreso y envíos
repetidos. Una marca impide guardar nuevamente un resultado ya confirmado.
Los errores se muestran por campo y mediante el toast habitual; el borrador se
conserva si falla el guardado. Al terminar se confirma y vuelve al origen, cuyas
consultas por foco reflejan el movimiento.

## Permisos, errores e imágenes

Se reutiliza el permiso de cámara existente; no se solicita micrófono. Rechazar
el permiso permite reintentar o regresar. Texto vacío, foto inválida o fallo del
motor ofrecen reintentar, volver a escanear o cancelar. Un resultado parcial
con texto legible abre la revisión para completar los campos faltantes.

La foto es temporal y no se adjunta permanentemente al movimiento. Al volver a
escanear o salir se intenta eliminar las copias propias de cámara y recorte;
la eliminación está limitada a la caché privada y no borra el original de la
galería. Un cierre abrupto puede dejar temporales sujetos a limpieza de Android.
Cancelar descarta la respuesta pendiente; una operación nativa iniciada puede
terminar en segundo plano antes de liberar su imagen.

## Verificación

Las pruebas automatizadas cubren formatos de monto/fecha/hora, el ticket real
de Kretz, TOTALCS$), nombres partidos, precios enteros y textos incompletos o
extensos. El borrador se comprueba con las validaciones normales de Egresos.
La integración ejecuta el esquema, servicio y repositorios reales con SQLite
en memoria de Node, sustituyendo únicamente sesión y adaptador de plataforma:
comprueba creación de egreso, descuento de saldo, depósitos ajenos/inactivos,
categoría inválida y rollback ante fallo de actualización de saldo.

```powershell
node --experimental-vm-modules --test tests/receiptParser.test.js tests/ocrExpenseDraft.test.js tests/ocrExpensePersistence.test.js
```

Las 24 pruebas pasan y se verificó la exportación Android con Hermes. El líder
confirmó el funcionamiento en su dispositivo el 16 de octubre de 2026.
Las pruebas en SQLite de Node no sustituyen la ejecución en Expo SQLite.
Para una regresión manual completa deben registrarse individualmente:
permisos rechazados/aceptados, seis tipos de ticket del Issue,
correcciones, crear depósito y regresar, guardar un único egreso, historial,
saldo, cancelar, errores y flujo completo en modo avión desde el primer uso.
