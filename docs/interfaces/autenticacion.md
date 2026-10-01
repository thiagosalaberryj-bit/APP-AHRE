# Interfaces de autenticación de AHRE

## Alcance

Login y Registro crean y validan cuentas en SQLite local. No consultan un backend, no requieren Internet y no realizan solicitudes de red. Al abrir AHRE, Inicio permanece visible hasta que la persona completa el deslizador. Sin sesión, abre Login; con sesión válida, solicita la huella y luego abre el Dashboard.

## Login

`src/screens/LoginScreen.js` solicita correo electrónico y contraseña. Antes de consultar SQLite comprueba que ambos estén completos y que el correo tenga un formato válido. El correo se recorta y normaliza a minúsculas. Las credenciales inválidas muestran el mismo mensaje para un usuario inexistente o una contraseña incorrecta.

El botón «Recordarme» está activo inicialmente. Al activarlo, el identificador de usuario de la sesión se guarda con `expo-secure-store`. Si se desactiva, la sesión se conserva solo mientras la aplicación está abierta. Después de inicializar SQLite, AHRE permanece en Inicio; la sesión se consulta al completar el deslizador. «¿Olvidaste tu contraseña?» permanece sin un flujo asociado; la recuperación remota no forma parte de esta funcionalidad.

El botón de Login muestra carga durante la verificación, impide pulsaciones repetidas y permite mostrar u ocultar la contraseña sin alterar su contenido. Al autenticar correctamente reemplaza la pila de navegación por el Dashboard, así el botón de regreso no vuelve al formulario.

## Registro

`src/screens/RegistrationScreen.js` solicita nombre, correo, contraseña y confirmación. La pantalla valida los campos antes de llamar al servicio; el servicio vuelve a validar antes de cualquier operación de persistencia.

Reglas actuales:

- nombre obligatorio, recortando espacios externos;
- correo obligatorio, formato de correo y comparación única sin distinguir mayúsculas de minúsculas;
- contraseña de al menos 8 caracteres Unicode y no compuesta solo por espacios;
- confirmación obligatoria e idéntica a la contraseña;
- la contraseña conserva exactamente los espacios que escribió la persona.

Los errores de validación aparecen junto al campo correspondiente. Los avisos generales, como un correo duplicado o un fallo de almacenamiento, aparecen en una notificación emergente en la parte superior. Mientras se guarda la cuenta, los campos y el botón quedan deshabilitados.

## Protección de contraseña

El servicio usa `expo-crypto` para generar una sal aleatoria de 16 bytes y calcular un SHA-256 de una sola pasada. `credenciales_usuario` guarda el algoritmo, la sal y el resultado; no guarda la contraseña ni la confirmación. Este cálculo es rápido, pero facilita probar muchas contraseñas si alguien copia la base local. Los datos de desarrollo con otro formato de verificador se descartan y la cuenta se crea de nuevo; AHRE no convierte verificadores anteriores.

## Persistencia local

`src/database/repositories/authenticationRepository.js` crea el usuario, el verificador y su fila de preferencias en una transacción SQLite. Si la transacción falla, no queda una cuenta parcial. El correo se normaliza a minúsculas antes de guardarse y SQLite mantiene un índice único normalizado. Las preferencias comienzan con notificaciones activas y sin depósito predeterminado.

Después de crear la cuenta, Registro reemplaza la pantalla actual por Login y muestra una notificación emergente de éxito. La persona inicia sesión manualmente.

## Notificaciones emergentes

`src/components/ToastNotification.js` presenta los avisos generales de Login y Registro encima de la pantalla. El mensaje se cierra automáticamente y una barra blanca indica el tiempo restante. La persona también puede cerrarlo con la X o deslizarlo horizontalmente. `src/contexts/ToastContext.js` mantiene el aviso visible mientras Registro navega a Login y permite reutilizar el componente desde otras pantallas.

El patrón compartido para mostrar errores de operación, confirmaciones y avisos
informativos está documentado en
[`docs/funcionalidades/notificaciones-toast.md`](../funcionalidades/notificaciones-toast.md).

## Sesión local

`src/authentication/sessionService.js` expone:

| Función | Responsabilidad |
| --- | --- |
| `crearSesion(usuarioId, recordar)` | Comprueba que el usuario siga activo y conserva su identificador en memoria o SecureStore. |
| `obtenerSesionActual()` | Recupera el identificador y confirma que el usuario exista y esté activo. |
| `comprobarSesion()` | Devuelve si hay una sesión válida. |
| `cerrarSesion()` | Elimina la sesión de memoria y SecureStore. |

SecureStore contiene únicamente el identificador del usuario; la contraseña y su verificador no se almacenan allí. Tras deslizar en Inicio, `obtenerSesionActual()` confirma que ese identificador corresponde a un usuario activo. Si no hay sesión o la referencia no corresponde a un usuario activo, se abre Login sin mostrar biometría; una referencia obsoleta se limpia. Si la sesión es válida, se solicita la huella del dispositivo antes de abrir el Dashboard. Los fallos de acceso a SecureStore o SQLite muestran un aviso y permiten volver a deslizar.

La operación para cerrar sesión está disponible en el servicio. Conectar el botón existente de Perfil se mantiene para una tarea posterior, según el alcance definido para esta etapa.

## Separación de responsabilidades

- `src/screens/`: campos, estados visuales y navegación.
- `src/components/ToastNotification.js`: presentación y cierre de los avisos emergentes.
- `src/contexts/ToastContext.js`: estado compartido y acceso a las notificaciones de texto.
- `src/utils/authenticationValidation.js`: reglas de correo, contraseña y campos requeridos.
- `src/authentication/authenticationService.js`: registro y autenticación local.
- `src/authentication/passwordSecurity.js`: creación y verificación del hash rápido con sal.
- `src/authentication/sessionService.js`: persistencia y recuperación local de sesión.
- `src/database/repositories/authenticationRepository.js`: consultas de cuenta y transacción de registro.
- `src/database/migrations/001_initialSchema.js`: tablas e índice único del esquema mientras AHRE siga en desarrollo.

## Navegación y conectividad

```text
Inicio → deslizar → sin sesión → Login → Registro → Login → Dashboard
Inicio → deslizar → sesión válida → huella → carga animada → Dashboard
```

Registro y Login usan SQLite, SecureStore, generación aleatoria y cálculo local de SHA-256 con sal. No utilizan `fetch`, APIs remotas ni conectividad, por lo que el flujo puede usarse en modo avión.
