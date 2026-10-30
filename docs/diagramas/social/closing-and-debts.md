# Cierre de sala y deudas propias

## Cierre

```mermaid
flowchart TD
  A[Solicitar cierre] --> B[Resumen de ítems, total, partes pagadas y pendientes]
  B --> C{Confirmar}
  C -->|No| D[Volver sin cambios]
  C -->|Sí| E[Iniciar transacción y recargar sala]
  E --> F{Ya estaba cerrada}
  F -->|Sí| G[Devolver el cierre existente sin duplicar]
  F -->|No| H[Validar reparto, plan y depósitos de cada ítem]
  H --> S[Crear compras, entregas y movimientos nuevos o vincular existentes]
  S --> I{Parte pendiente distinta de la del pagador}
  I -->|No| J[No crear deuda]
  I -->|Sí| K{Vos es deudor o acreedor}
  K -->|No| L[Conservar pendiente de terceros dentro de la sala]
  K -->|Sí| M[Crear deuda propia única por participación]
  M --> N[Vincular pagos anteriores sin copiarlos]
  J --> O[Marcar sala cerrada y guardar fecha]
  L --> O
  N --> O
  O --> P[Confirmar todos los movimientos, pagos, deudas y cierre]
  P --> Q[Sala histórica de solo lectura]
  P --> R[Deudas propias visibles en el registro personal]
```

El recorrido I a O se aplica a todas las partes. Una sala vacía, completamente
pagada o con pendientes exclusivamente entre terceros se cierra sin crear
deudas personales. Retirar a una persona no excluye sus partes del cierre.

La deuda conserva el importe original de la parte; el pendiente resta las
entregas anteriores y futuras. Si tu parte es $4.000 y ya entregaste $1.000,
el registro muestra $4.000 originales y $3.000 pendientes. No se crea otro
egreso si esos $1.000 ya tenían un movimiento vinculado. Los movimientos nuevos
preparados en el borrador sí se crean durante el cierre.

## Deuda personal y cancelación

```mermaid
flowchart TD
  A[Registrar deuda personal] --> B[Persona activa, dirección, importe y descripción]
  B --> C{Origen de la deuda}
  C -->|Me debe| M[Crear o vincular egreso del adelanto]
  C -->|Le debo| O[Guardar obligación sin modificar depósitos]
  M --> P[Guardar deuda y vínculo de origen en una transacción]
  O --> P
  P --> D[Detalle de deuda]
  E[Deuda originada en sala cerrada] --> D
  D --> F{Acción}
  F -->|Registrar pago| G[Egreso si pagás o ingreso si cobrás, con depósito o movimiento existente]
  G --> H[Actualizar pendiente y estado]
  F -->|Eliminar deuda pendiente| I[Mostrar resumen y pedir confirmación]
  I -->|Volver| D
  I -->|Confirmar| J[Estado cancelada y fecha, sin borrar]
  J --> K[Conservar pagos, origen e identidad de la persona]
  J --> L[Excluir de pendientes sin devolver dinero]
```

Una persona desactivada sigue identificada y sus deudas previas pueden saldarse.
No hay compensación automática entre lo que debés y lo que te deben. Los pagos
posteriores a un cierre actualizan tus deudas; el reparto original de la sala
y su historial entre terceros permanecen de solo lectura.

El movimiento de origen no es una devolución y no reduce el pendiente. Un
adelanto de $800 genera un egreso; cobrarlo devuelve esos $800 mediante un
ingreso. Usar un movimiento existente conserva su depósito y no vuelve a
afectar el saldo. Revertir el origen requiere corregir primero devoluciones
vigentes y luego cancela la deuda; eliminar solo la deuda no devuelve dinero.
Al saldar se confirma Deuda saldada y se vuelve al inicio de Social. Las deudas
saldadas permanecen en el historial y no se pueden eliminar.
