# Integridad y errores de Social

## Escritura y reintento

```mermaid
flowchart TD
  A[Confirmar formulario] --> B[Validar datos y bloquear doble envío]
  B --> C[Entrar en la cola de transacciones existente]
  C --> D[Revisar sesión, propiedad, estado y clave de operación]
  D --> E{Ya se confirmó esa operación}
  E -->|Sí| F[Devolver resultado sin nuevas filas]
  E -->|No| G[Validar referencias, reparto y pendiente actual]
  G --> H[Guardar todas las filas y movimientos relacionados]
  H --> I{Se completó todo}
  I -->|Sí| J[COMMIT y recargar consultas]
  I -->|No| K[ROLLBACK completo]
  K --> L[Conservar borrador y mostrar error recuperable]
  L --> A
```

Se prueban cuenta ajena, registro inexistente, persona desactivada para nuevas
selecciones, depósito inactivo, sala cerrada, falta de cupo, sobrepago,
movimiento ya vinculado y fallo intermedio de escritura. La base no calcula
automáticamente saldos ni crea deudas al cambiar un estado.

## Corrección de un pago propio

```mermaid
flowchart TD
  A[Solicitar anulación de pago o movimiento vinculado] --> B[Consultar origen social]
  B --> C{Compra de sala cerrada}
  C -->|Sí| D[Impedir modificar el reparto cerrado]
  C -->|No| E[Revisar consecuencias y confirmar]
  E --> F[Transacción coordinada]
  F --> G[Crear compensación con reglas de Movimientos]
  G --> H[Anular pago conservando su fila]
  H --> I[Conservar original enlazado a compensación y recalcular deuda]
  I --> J[COMMIT o ROLLBACK completo]
```

El repositorio de movimientos ejecuta este flujo con `socialMovementReversal.js`.
Una compra abierta con entregas vigentes exige corregirlas antes; al revertir
una compra abierta se cancela su ítem. Un pago confirmado no cambia de importe,
fecha, origen o movimiento: se anula y se registra otro. Una compensación ni
un original ya revertido pueden usarse como un pago nuevo.

En un origen de deuda manual, se bloquea la reversión mientras queden devoluciones
vigentes. Una vez corregidas, se compensa el movimiento y se cancela la obligación;
el origen se excluye de las sumas usadas para recalcular el pendiente de una deuda.

## Alcance de la validación

El esquema protege claves, referencias por cuenta, clases de pagos, importes,
dirección y unicidad del movimiento, deudas propias y estados de solo lectura.
La normalización de nombres, suma exacta del reparto, actualización de estados,
autorización de sesión y atomicidad del cierre corresponden a los servicios.
Las pruebas de esquema y servicios usan SQLite en memoria. Las de interfaz
recorren componentes reales con controles nativos adaptados en ambos temas;
no reemplazan Expo SQLite ni la revisión visual en dispositivo.

La versión inicial del esquema se conserva. Estos cambios requieren una base
de desarrollo nueva; no convierten ni borran automáticamente bases anteriores.
No se debe descartar una base que contenga información personal real.
