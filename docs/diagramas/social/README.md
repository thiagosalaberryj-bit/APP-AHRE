# Diagramas del módulo Social

Estos diagramas describen la integración personal offline implementada sobre
SQLite mediante los servicios de `src/social/` y las pantallas existentes.
El OCR social comparte el reconocimiento existente y devuelve una lista editable.
La lista manual funciona en Expo Go; ML Kit requiere el módulo nativo Android.
La validación de captura en dispositivo sigue pendiente.

| Escenarios | Diagrama |
| --- | --- |
| Primera entrada, sesión, lectura por usuario, búsqueda e historial | [Entrada y consultas](overview.md) |
| Alta, duplicados, edición, desactivación y reactivación de personas | [Personas y salas](people-and-rooms.md) |
| Crear hasta tres salas, integrantes actuales e históricos | [Personas y salas](people-and-rooms.md) |
| Ítems, pagador fuera del reparto, iguales, manual, edición y OCR | [Ítems y pagos](expenses-and-payments.md) |
| Compra propia o ajena, pagos parciales, todos pagaron, vincular movimientos y depósitos | [Ítems y pagos](expenses-and-payments.md) |
| Cierre vacío, pagado, parcial o con pendientes de terceros; doble cierre | [Cierre y deudas](closing-and-debts.md) |
| Deuda personal, egreso del adelanto, obligación a pagar sin ingreso, pago y cancelación | [Cierre y deudas](closing-and-debts.md) |
| Tablas, claves, pagos antes y después del cierre, ejemplo de registros | [Modelo de datos](data-model.md) |
| Rollback, doble envío, movimiento anulado, permisos y límites de esta etapa | [Integridad y errores](integrity-and-errors.md) |

Los bloques Mermaid pueden verse en un visor compatible o en GitHub. La
[especificación funcional](../../funcionalidades/social.md) contiene las reglas
completas y los escenarios de aceptación. El [contrato del esquema](../../base-de-datos/social.md)
distingue lo que controla SQLite de lo que validan los servicios.

Reglas comunes: eliminar una persona la desactiva; guardar un ítem no mueve
dinero. El cierre aplica los movimientos nuevos a los depósitos asociados y
solo las deudas que te involucran pasan a tu registro personal. Las de terceros
conservan sus partes y pagos únicamente dentro de la sala. Una deuda saldada no
se elimina.
