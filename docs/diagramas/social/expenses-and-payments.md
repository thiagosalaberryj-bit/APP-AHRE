# Ítems y pagos

## Registro y reparto de un ítem

```mermaid
flowchart TD
  A[Agregar ítem a sala abierta] --> B{Carga}
  B -->|Manual| C[Descripción e importe]
  B -->|OCR compartido| D[Captura, recorte y reconocimiento local existentes]
  D --> E{Resultado revisable}
  E -->|Cancelar o error| C
  E -->|Revisar lista editable| C
  C --> F[Elegir pagador y personas involucradas]
  F --> G{Reparto}
  G -->|Iguales| H[Dividir en centavos y distribuir resto por orden estable]
  G -->|Manual| I[Exigir partes positivas que sumen el total]
  H --> J[Revisar partes y pagos iniciales]
  I --> J
  J --> K[Asociar depósitos o movimientos para las operaciones propias]
  K --> L{Pagó Vos}
  L -->|Sí| M[Preparar egreso por el total sin modificar el saldo]
  L -->|No| N[Preparar compra ajena sin egreso propio]
  M --> O[Guardar ítem, partes y plan de pagos como borrador]
  N --> O
```

El pagador puede estar fuera del reparto; si participa, su parte está cubierta
por la compra y no provoca otro pago. Un ítem tiene un solo pagador. La lectura
OCR no crea por adelantado un egreso. Devuelve la lista al registro de Social;
la carga manual y la reconocida comparten validación y guardado atómico.
Guardar un ítem tampoco crea el egreso: los movimientos nuevos y pagos se
confirman al cerrar la sala. El borrador reserva los movimientos ya existentes
para impedir que se vuelvan a usar en otro gasto o pago social.

## Entregas de partes y deudas

```mermaid
flowchart TD
  A[Registrar entrega] --> B[Consultar pendiente vigente]
  B --> C{Importe positivo y no superior al pendiente}
  C -->|No| D[Corregir sin guardar]
  C -->|Sí| E{Vos participa en el dinero}
  E -->|No| F[Pago entre terceros sin movimiento]
  E -->|Pagás| G[Egreso propio]
  E -->|Cobrás| H[Ingreso propio]
  G --> I{El movimiento ya existe}
  H --> I
  I -->|Sí| J[Validar usuario, importe, dirección y vínculo único]
  I -->|No| K{Hay depósito activo}
  K -->|No| L[Crear depósito y conservar borrador]
  L --> K
  K -->|Sí| M[Crear movimiento en depósito elegido]
  J --> N[Guardar pago y actualizar estado en la misma transacción]
  M --> N
  F --> N
  N --> O{Pendiente restante}
  O -->|Cero| P[Parte o deuda saldada]
  O -->|Positivo| Q[Pago parcial]
```

Todos pagaron prepara una entrega por cada pendiente, excepto la parte del
pagador. Se revisan los depósitos y movimientos propios antes de confirmar.
Los pagos entre terceros solo se registran mientras la sala está abierta.
Vincular un movimiento existente no altera nuevamente el saldo. Dos entregas
legítimas del mismo importe son válidas; la prevención de reintentos usa una
clave de operación, no una comparación de textos o importes.

## Edición

```mermaid
flowchart TD
  A[Editar ítem] --> B{Sala abierta}
  B -->|No| C[Rechazar edición]
  B -->|Sí| D{Cambian importes, pagador o personas}
  D -->|No| E[Guardar descripción sin nuevos movimientos]
  D -->|Sí| H[Validar nuevamente reparto, marcas de pago y depósitos]
  H --> J[Guardar con control de versión]
```

En una sala abierta todavía no hay pagos confirmados: corregir el borrador
no requiere compensaciones. Las referencias con historial financiero confirmado
siguen protegidas; una sala cerrada no se edita.
