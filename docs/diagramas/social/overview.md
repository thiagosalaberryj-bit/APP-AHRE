# Entrada y consultas de Social

```mermaid
flowchart TD
  A[Entrar a Social] --> B{Sesión local válida}
  B -->|No| C[Solicitar inicio de sesión]
  B -->|Sí| D[Consultar SQLite con usuario de la sesión]
  D --> E{Resultado}
  E -->|Error| F[Mostrar error y reintentar]
  F --> D
  E -->|Sin datos| G[Totales cero y estados vacíos]
  E -->|Con datos| H[Resumen personal y listas]
  G --> I[Crear persona, sala o deuda]
  H --> J[Te deben y Debés sin compensar]
  H --> K[Últimas cinco deudas propias pendientes]
  H --> L[Hasta tres salas abiertas]
  H --> M[Agenda y perfiles]
  K --> N[Buscar, filtrar y agrupar deudas por mes]
  L --> O[Buscar y filtrar salas abiertas o cerradas]
  N --> P[Detalle de deuda y sala de origen]
  M --> Q[Perfil con deudas propias incluso de personas inactivas]
  O --> R[Sala con su reparto completo]
  R --> S[Pendientes propios y entre terceros]
```

Los totales personales se obtienen de deudas vigentes que tienen a Vos en uno
de sus extremos. No se filtran por actividad del contacto. Las partes de salas
abiertas siguen siendo provisionales y se consultan dentro de la sala; las
obligaciones entre terceros nunca se incorporan a tus totales.

Buscar, filtrar, plegar meses o consultar detalles no escribe datos. Al volver
de un formulario se recargan las consultas; reiniciar o cambiar de cuenta no
recupera ejemplos ni datos del usuario anterior. Los estados de carga, error,
sin registros y sin coincidencias son distintos.
