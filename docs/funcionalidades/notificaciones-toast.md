# Notificaciones toast

## Uso en AHRE

AHRE usa el componente toast compartido para comunicar resultados breves de una
acción: errores al guardar o consultar información, confirmaciones de éxito y
avisos informativos. El proveedor está en `App.tsx`, por encima de la navegación,
por lo que las pantallas pueden mostrar avisos aunque la ruta cambie.

El toast usa `Animated` y `PanResponder` de React Native y el contexto de áreas
seguras que ya está instalado en AHRE. No agrega una dependencia de terceros.
Es un aviso temporal para dar respuesta a una acción; no es el historial de la
pantalla Notificaciones, no se guarda en SQLite ni representa una notificación
local o push del dispositivo.

Mantené el mensaje específico junto al campo que la persona puede corregir.
Cuando un envío falla por campos incompletos, usá también un toast breve para
indicar que revise los campos marcados; no agregues otro mensaje general al pie
del formulario. Usá el toast para el resultado general del envío, por ejemplo
cuando falla el guardado o cuando la operación termina bien. Los errores que
bloquean el inicio de la aplicación y requieren una acción persistente, como
reintentar la inicialización de SQLite, deben permanecer visibles en la
pantalla mientras sigan bloqueando el uso; un toast desaparece solo y no
alcanza para ese estado.
El tipo `exito` confirma que una acción terminó; no reemplaza un diálogo cuando
la persona debe decidir si inicia una acción destructiva.

## Cómo mostrar un aviso

Desde una pantalla o componente descendiente de `ProveedorAvisos`, importá el
contexto y obtené `mostrarAviso` dentro del cuerpo del componente (no a nivel de
módulo):

```js
import { useContext } from 'react';

import { ContextoAvisos } from '../contexts/ToastContext';

// Dentro de la función del componente:
const { mostrarAviso } = useContext(ContextoAvisos);
```

Mostrá una confirmación después de que la operación termine correctamente y
un error general desde `catch`. El mensaje debe ser claro y no exponer SQL,
datos de cuenta, credenciales ni detalles técnicos internos:

```js
try {
  await guardarCambios();
  mostrarAviso('Los cambios se guardaron.', { tipo: 'exito' });
} catch {
  mostrarAviso('No se pudieron guardar los cambios. Intentá nuevamente.', {
    tipo: 'error',
  });
}
```

## Tipos y duración

Los tipos disponibles son:

| Tipo | Uso |
| --- | --- |
| `error` | Falló una operación que la persona intentó realizar. |
| `exito` | Una operación terminó correctamente. |
| `informacion` | Aviso breve que no representa un fallo ni una confirmación. |

La duración predeterminada es de `4500` ms. Se puede pasar `duracion` en
milisegundos; el contexto la limita al rango de `1500` a `10000` ms:

```js
mostrarAviso('La sincronización sigue en curso.', {
  tipo: 'informacion',
  duracion: 6500,
});
```

La notificación también se puede cerrar con la X o deslizando hacia un costado.
Si se muestra otro aviso, reemplaza al que estaba visible. El color del icono
depende del tipo; los colores compartidos están en
`src/styles/colors.ts` (`COLORES_NOTIFICACIONES`). El fondo sigue la apariencia:
verde oscuro en claro y `tema.superficieElevada` en oscuro. El texto y los iconos
mantienen contraste en ambas superficies.

## Uso actual

Login y Registro usan este contexto para errores generales y confirmación de
registro. Los formularios de depósito, ingreso y egreso conservan los errores
específicos junto a cada campo y muestran un toast si faltan datos al enviar.
Las pantallas que incorporen operaciones reales deben usar el mismo patrón y
evitar crear avisos locales distintos para los mismos resultados.

## Resultados generales y modales

Los errores generales de consultas y operaciones se informan con el toast, sin
líneas de error ni tarjetas dentro del contenido que exijan desplazarse.
Se conservan los errores específicos debajo de cada campo, los estados de
negocio (por ejemplo, una deuda pendiente), los requisitos de permisos y las
acciones Reintentar. El error que impide iniciar SQLite sigue visible con su
recuperación: la app todavía no puede presentar su interfaz habitual.

`src/hooks/useErrorNotice.ts` centraliza el aviso de errores generales y conserva
su estado para validaciones, carga y reintentos. Evita repetir el mismo error en
cada actualización de fondo; limpiar el error al reintentar permite avisarlo otra
vez. Los resultados de una acción se notifican desde su callback, nunca durante
el render.

Los modales nativos montan `AvisosEnModal` dentro de su ventana. El proveedor
compartido dirige el aviso al modal visible más profundo. Al cerrar esa ventana
no vuelve a reproducir su aviso en la pantalla ni en otro modal. Se reutiliza
`ToastNotification`, con duración, cierre, gesto y accesibilidad existentes.
No se crean entradas en el historial de Notificaciones ni escrituras en SQLite.

## Interfaces revisadas

| Interfaz | Componentes y tratamiento |
| --- | --- |
| Carga de Social | `useSocialScreen` y `SocialScreenFrame`: error por toast; se conserva Reintentar. |
| Vínculos de cuenta | `AccountLinkRequests` y `PersonAccountLink`: errores y confirmaciones arriba. |
| Personas e ingresos a una sala | `OnlineRoomPanel` y `AddRoomPeopleModal`: error por toast sin perder la selección ni la opción de reemplazar acceso. |
| QR y enlace de invitación | `InvitationScanner` y `JoinRoomModal`: errores, QR reconocido, solicitud enviada e ingreso aceptado por toast. |
| Compartir invitación | `ShareInvitationModal`: copia exitosa y fallos de copiar/compartir por toast; se conserva la marca de copiado. |
| Acceso a una sala | `RoomAccessControl`: errores y confirmaciones de guardar, renovar o pausar ingresos por toast. |
| Invitación e historial de deuda | `DebtInvitation` y `DebtActivityHistory`: errores generales por toast y confirmación al responder. |
| Pago y gastos online | `RegisterPaymentForm`, `ExpenseOnlineActions` y `RoomFinanceSelection`: errores y resultados generales arriba. |
| Confirmar movimiento Social | `SocialMovementModal`: error de consulta por toast; se conserva el bloqueo de confirmación inválida. |
| Inicio y depósitos | `DashboardScreen` y `DepositDetailScreen`: se quita la repetición del error escrito; se mantienen los avisos y Reintentar. |
| Movimientos y detalle | `MovementsScreen`, `MovementDetailScreen` y `MovementMonthList`: errores de consulta/paginación por toast; recuperación en la vista. |
| Ingreso, Egreso y Escanear | `IncomeScreen` (reutilizado por Egreso) y `OcrExpenseForm`: fallos de carga por toast; errores de campos intactos. |
| Estadísticas y categoría | `StatisticsScreen` y `CategoryDetailScreen`: fallos generales por toast; controles de reintento conservados. |
| Perfil y preferencias | `ProfileScreen` y `ProfileModal`: error de carga por toast; validaciones de correo/contraseñas permanecen junto al campo. |
| Notificaciones | `NotificationsScreen`: errores al consultar/guardar y confirmación de preferencias por toast. |
| Sincronización | `SyncScreen`: errores, reparación y confirmación de sincronización por toast; se conservan acciones de reparación y estados. |
| Recurrencias | `RecurrencePanel`: consultas y resultados generales por toast, también en el modal. |
| Mercado Pago | `MercadoPagoScreen` y `MercadoPagoSelectionActions`: resultados por toast. Los errores históricos se consultan con Ver error de consulta. |
| Cuenta de desarrollo | `DevelopmentDataButton`: falla por toast; diagnóstico técnico solo en consola. |

Los diálogos que piden una decisión destructiva siguen siendo diálogos. El toast
confirma su resultado, no sustituye la decisión de la persona.
