# OCR de comprobantes de AHRE

## Alcance

Este documento registra el maquetado del flujo de escaneo de tickets o
comprobantes. En esta etapa no hay acceso a cámara, solicitud de permisos,
captura real, reconocimiento de texto, interpretación del ticket, detección
real de datos, almacenamiento del movimiento, actualización del saldo ni
comunicación con backend. Todo es simulado y solo en pantalla.

## Flujo de escaneo

`src/screens/OcrScreen.js` es secundaria (acceso desde la acción rápida del
Dashboard) con `EncabezadoSeccion` («Escanear comprobante») y una máquina de
estados locales en la misma pantalla:

```text
Dashboard
→ OCR (cámara)
→ Escanear / Galería
→ procesando
→ resultado (revisar, corregir, confirmar)
→ error → Intentar nuevamente / Cancelar
```

## Pantalla inicial

Área de cámara como placeholder oscuro con guía de esquinas en verde claro
(según el mockup), instrucciones breves («Colocá el ticket dentro del área
indicada, con buena luz y sin arrugas») y acciones mitad y mitad: `Escanear`
(principal) y `Galería` (secundario con ícono). Sin botón `Cancelar` en
cámara a pedido del líder (el regreso queda en la flecha del encabezado);
sí hay `Cancelar` en resultado y error como exige el Issue. La guía usa
proporciones relativas para adaptarse a distintos tamaños. El botón de
galería es solo visual: entra al mismo flujo simulado sin abrir el selector
del sistema ni pedir permisos (`expo-image-picker` ya instalado; su cableado
real queda para el Issue de OCR funcional).

## Estado procesando

Tarjeta con indicador, «Analizando comprobante...» y aviso de espera, más
`Cancelar`. Incluye un link sutil `Simular error de lectura`, solo ayuda de
verificación para representar el error sin OCR real; se quita cuando llegue
el reconocimiento funcional.

## Error de lectura

Tarjeta con ícono, «No pudimos leer correctamente el comprobante.»,
sugerencia de reintento o carga manual, `Intentar nuevamente` (repite el
procesamiento simulado) y `Cancelar`.

## Resultado del escaneo

Formulario editable con los datos detectados (simulados):

- Monto (`EntradaMonto`, ej. `$ 24.580`), corregible con `X` para limpiar;
- Descripción editable con contador implícito de 500;
- Fecha y hora con `SelectorFecha` y `SelectorHora` (modales compartidos);
- Categoría con `SelectorCategoria` (catálogo de egresos);
- Depósito con `SelectorDeposito` (`Efectivo, Mercado Pago, Cuenta bancaria`).

Escáner lleva a un resultado completo; galería a uno **incompleto** (sin
categoría, con aviso para elegirla manualmente). Acciones `Confirmar`
(principal, visual, aún no crea el egreso), `Volver a escanear` y `Cancelar`.

## Estados visuales

- **Cámara preparada:** visor + guía + instrucciones.
- **Capturando:** el botón `Escanear` inicia el procesamiento (sin captura
  real).
- **Procesando:** indicador + mensaje + cancelación.
- **Resultado detectado / incompleto:** formulario editable + aviso si falta
  la categoría.
- **Error de lectura:** mensaje + reintento + cancelación.

## Decisiones de diseño

- Un solo archivo de pantalla con estados, como permite el Issue; sin
  pantallas nuevas.
- Reutilización total: `MoneyInput, CategorySelector, DepositSelector,
  DateSelector, TimeSelector, PrimaryButton, SectionHeader` sin modificarlos;
  los estilos de formulario vienen de `expenseStyles.js` (mismo lenguaje
  visual que crear un egreso) y lo propio del escáner en
  `src/styles/OcrScreenStyles.js`.
- El tema viene de `ContextoApariencia`, como el resto de la app.
- Sin `hover`: todo por foco, selección y texto.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
