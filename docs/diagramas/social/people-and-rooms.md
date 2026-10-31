# Personas y salas

## Agenda

```mermaid
flowchart TD
  A[Alta o edición] --> B[Nombre, apellido y apodo de hasta 20 caracteres]
  B --> C[Normalizar y buscar coincidencias en toda la agenda]
  C --> D{Existe otra ficha}
  D -->|Activa| E[Abrir ficha existente y no duplicar]
  D -->|Inactiva| F[Ofrecer reactivación explícita de la misma ficha]
  D -->|No| G[Guardar ficha con identificador estable]
  H[Eliminar persona] --> I{Confirmar}
  I -->|No| J[Conservar todo]
  I -->|Sí| K[Marcar activa igual a cero]
  K --> L[Ocultar en nuevas selecciones]
  K --> M[Conservar salas, partes, pagos y deudas]
  M --> N[Seguir mostrando y cobrando o pagando sus deudas propias]
```

Editar excluye la misma ficha de la comparación. Las claves normalizadas
también son únicas para contactos inactivos. Vos es una representación interna
única por cuenta y no puede desactivarse. No se borran filas de personas.

## Creación y pertenencia

```mermaid
flowchart TD
  A[Crear sala] --> B[Nombre, descripción, categoría, icono, color, personas y fecha]
  B --> C[Comenzar transacción y comprobar usuario]
  C --> D{Hay menos de tres abiertas}
  D -->|No| E[Rechazar sin guardar]
  D -->|Sí| F[Guardar sala abierta y pertenencias, incluido Vos]
  F --> G[Confirmar transacción]
  G --> H[Sala sin ítems disponible]
  I[Agregar o quitar persona] --> J{Sala abierta}
  J -->|No| K[Consultar en solo lectura]
  J -->|Sí| L{Acción}
  L -->|Agregar| M[Elegir persona activa y crear o reactivar pertenencia]
  L -->|Quitar| N[Confirmar consecuencias]
  N --> O[Desactivar solo la pertenencia]
  O --> P[Conservar partes y pagos anteriores]
  M --> Q[Usar integrantes actuales para nuevos ítems]
  P --> Q
```

No se redistribuyen ítems anteriores al agregar o quitar personas. Quien fue
retirado puede seguir teniendo pagos o pendientes históricos. Desactivar una
persona en la agenda y retirarla de una sala son operaciones distintas. La
fecha de la ocasión y la de creación se guardan por separado; una sala cerrada
libera un lugar entre las tres abiertas.
