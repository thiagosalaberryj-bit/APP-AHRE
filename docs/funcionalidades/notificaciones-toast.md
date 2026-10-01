# Notificaciones toast

## Uso en AHRE

AHRE usa el componente toast compartido para comunicar resultados breves de una
acción: errores al guardar o consultar información, confirmaciones de éxito y
avisos informativos. El proveedor está en `App.js`, por encima de la navegación,
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
`src/styles/colors.js` (`COLORES_NOTIFICACIONES`).

## Uso actual

Login y Registro usan este contexto para errores generales y confirmación de
registro. Los formularios de depósito, ingreso y egreso conservan los errores
específicos junto a cada campo y muestran un toast si faltan datos al enviar.
Las pantallas que incorporen operaciones reales deben usar el mismo patrón y
evitar crear avisos locales distintos para los mismos resultados.
