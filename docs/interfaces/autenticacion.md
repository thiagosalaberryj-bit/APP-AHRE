# Interfaces de autenticación de AHRE

## Alcance

Registro y primer ingreso consultan SERVER-AHRE y necesitan conexión para autorizar la instalación. SQLite permite ingresos offline posteriores en la instalación previamente autorizada. Al abrir AHRE, Inicio permanece visible hasta que la persona completa el deslizador. Sin sesión, abre Login; con sesión válida, solicita huella si está configurada y luego abre el Dashboard.

## Login

`src/screens/LoginScreen.tsx` solicita correo electrónico y contraseña. Antes de consultar SQLite comprueba que ambos estén completos y que el correo tenga un formato válido. El correo se recorta y normaliza a minúsculas. Las credenciales inválidas muestran el mismo mensaje para un usuario inexistente o una contraseña incorrecta. El rechazo marca correo y contraseña junto a sus campos.

El botón «Recordarme» está activo inicialmente. Al activarlo, el identificador de usuario de la sesión se guarda con `expo-secure-store`. Si se desactiva, la sesión se conserva solo mientras la aplicación está abierta. `authentication/loginMemory.ts` guarda por separado la preferencia y el correo normalizado; Login abre con correo y contraseña vacíos. Cerrar sesión limpia el recordatorio de correo. Después de inicializar SQLite, AHRE permanece en Inicio; la sesión se consulta al completar el deslizador. «¿Olvidaste tu contraseña?» permanece sin un flujo asociado; la recuperación remota no forma parte de esta funcionalidad.

El botón de Login muestra carga durante la verificación, impide pulsaciones repetidas y permite mostrar u ocultar la contraseña sin alterar su contenido. Al autenticar correctamente reemplaza la pila de navegación por el Dashboard, así el botón de regreso no vuelve al formulario.

## Registro

`src/screens/RegistrationScreen.tsx` solicita nombre y apellido en una misma fila, correo, contraseña y confirmación. La pantalla valida los campos antes de llamar al servicio; el servicio vuelve a validar antes de cualquier operación de persistencia.

Reglas actuales:

- nombre y apellido obligatorios en el formulario, recortando espacios externos y con hasta 80 caracteres cada uno;
- correo obligatorio, formato de correo y comparación única sin distinguir mayúsculas de minúsculas;
- contraseña de al menos 8 caracteres Unicode y no compuesta solo por espacios;
- confirmación obligatoria e idéntica a la contraseña;
- la contraseña conserva exactamente los espacios que escribió la persona.

Los errores de validación aparecen junto al campo correspondiente. En Nombre y Apellido del registro ocupan una sola línea y se recortan si falta espacio; el mensaje de apellido dice «Ingresá tu apellido.». Los avisos generales, como un correo duplicado o un fallo de almacenamiento, aparecen en una notificación emergente en la parte superior. Mientras se guarda la cuenta, los campos y el botón quedan deshabilitados.

## Protección de contraseña

El servicio usa `expo-crypto` para generar una sal aleatoria de 16 bytes y calcular un SHA-256 de una sola pasada. `credenciales_usuario` guarda el algoritmo, la sal y el resultado; no guarda la contraseña ni la confirmación. Este cálculo es rápido, pero facilita probar muchas contraseñas si alguien copia la base local. Los datos de desarrollo con otro formato de verificador se descartan y la cuenta se crea de nuevo; AHRE no convierte verificadores anteriores.

## Persistencia local

`src/database/repositories/authenticationRepository.ts` crea el usuario, el verificador y su fila de preferencias en una transacción SQLite. Si la transacción falla, no queda una cuenta parcial. El correo se normaliza a minúsculas antes de guardarse y SQLite mantiene un índice único normalizado. Las preferencias comienzan con notificaciones activas y sin depósito predeterminado.

Después de crear la cuenta, Registro reemplaza la pantalla actual por Login y muestra una notificación emergente de éxito. La persona inicia sesión manualmente.

## Notificaciones emergentes

`src/components/ToastNotification.tsx` presenta los avisos generales de Login y Registro encima de la pantalla. El mensaje se cierra automáticamente y una barra blanca indica el tiempo restante. La persona también puede cerrarlo con la X o deslizarlo horizontalmente. `src/contexts/ToastContext.tsx` mantiene el aviso visible mientras Registro navega a Login y permite reutilizar el componente desde otras pantallas.

El patrón compartido para mostrar errores de operación, confirmaciones y avisos
informativos está documentado en
[`docs/funcionalidades/notificaciones-toast.md`](../funcionalidades/notificaciones-toast.md).

## Sesión local

`src/authentication/sessionService.ts` expone:

| Función | Responsabilidad |
| --- | --- |
| `crearSesion(usuarioId, recordar)` | Comprueba que el usuario siga activo y conserva su identificador en memoria o SecureStore. |
| `obtenerSesionActual()` | Recupera el identificador y confirma que el usuario exista y esté activo. |
| `comprobarSesion()` | Devuelve si hay una sesión válida. |
| `cerrarSesion()` | Elimina la sesión de memoria y SecureStore. |

La clave de sesión en SecureStore contiene el identificador del usuario; otra clave conserva la preferencia de visibilidad de saldos. La contraseña y su verificador no se almacenan allí. Tras deslizar en Inicio, `obtenerSesionActual()` confirma que el identificador de sesión corresponde a un usuario activo. Si no hay sesión o la referencia no corresponde a un usuario activo, se abre Login sin mostrar biometría; una referencia obsoleta se limpia. Si la sesión es válida y el equipo tiene biometría configurada, se solicita la huella antes de abrir el Dashboard. Sin hardware o sin huella configurada, Inicio deriva a Login y exige contraseña antes de continuar. Los fallos de acceso a SecureStore o SQLite muestran un aviso y permiten volver a deslizar.

Perfil permite cerrar la sesión local o sincronizar y desvincular la instalación con conexión.

## Separación de responsabilidades

- `src/screens/`: campos, estados visuales y navegación.
- `src/components/ToastNotification.tsx`: presentación y cierre de los avisos emergentes.
- `src/contexts/ToastContext.tsx`: estado compartido y acceso a las notificaciones de texto.
- `src/utils/authenticationValidation.ts`: reglas de correo, contraseña y campos requeridos.
- `src/authentication/authenticationService.ts`: registro y autenticación local.
- `src/authentication/passwordSecurity.ts`: creación y verificación del hash rápido con sal.
- `src/authentication/sessionService.ts`: persistencia y recuperación local de sesión.
- `src/database/repositories/authenticationRepository.ts`: consultas de cuenta y transacción de registro.
- `src/database/migrations/001_initialSchema.ts`: tablas e índice único del esquema mientras AHRE siga en desarrollo.

## Navegación y conectividad

Al deslizar en Inicio sin sesión se abre Login, que permite acceder a Registro y regresar antes de entrar a Dashboard. Con sesión válida se solicita huella y se muestra la carga animada antes de Dashboard.

Registro y primer ingreso usan la API remota y requieren conexión. Los ingresos offline posteriores comprueban el verificador local y la autorización de la instalación. Si se cambia el correo offline, Perfil avisa que se use el anterior para ingresar con conexión hasta confirmar el cambio. El ingreso remoto recupera la cuenta local por ID y conserva sus pendientes; no crea otra cuenta por la diferencia de correo. Una identidad remota distinta produce un aviso y no vincula los datos. El correo nuevo funciona remotamente después de sincronizar.


## Correcciones de acceso, permisos e invitaciones · 16/11/2026

Sin hardware biométrico o sin huella configurada, Inicio deriva a Login y exige contraseña; nunca abre Dashboard directamente. Login siempre abre con correo vacío. Cerrar sesión o invalidar la referencia guardada limpia también el recordatorio de correo.

Nombre y apellido del registro fuerzan una única línea en el input desde el primer render. Aceptar/rechazar tienen separación explícita. Quitar de una sala muestra los gastos afectados como lista desplazable, con confirmación visible. Una solicitud de una cuenta amiga se acepta directamente con su ficha confirmada; el servidor rechaza cualquier intento de asignarla a otra.

Notificaciones muestra primero Paso 1 para habilitar los avisos y, al concederlo, Paso 2 para configurar horarios precisos, con el mismo contenedor y acceso por flecha. Los horarios precisos reducen retrasos de recordatorios locales, no cambian la entrega del proveedor push. Las push y los recordatorios muestran el título y mensaje del historial, sin texto genérico; se retira el control que ocultaba ese contenido. El campo mostrarDetalles se conserva solo por compatibilidad del contrato.
