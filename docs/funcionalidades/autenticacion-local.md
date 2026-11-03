# Autenticación local

## Alcance

AHRE registra y autentica cuentas mediante SERVER-AHRE y conserva en SQLite un verificador para ingresos offline posteriores. El registro y la primera autorización necesitan conexión. Solo una instalación por cuenta puede sincronizar. No incluye verificación de correo, OAuth ni recuperación de contraseña.

```text
Registro → validar → registrar y autorizar en servidor → crear cuenta local → Login
Login → autenticar con servidor o validar acceso offline autorizado → sesión → Dashboard
```

## Registro y validación

El correo electrónico identifica el acceso y debe ser único, pero la identidad estable de la cuenta es su ID. El correo se recorta y normaliza a minúsculas antes de buscarlo o guardarlo; un índice único sobre `LOWER(correo_electronico)` protege también las escrituras concurrentes.

Las reglas implementadas son nombre obligatorio, correo obligatorio y válido, contraseña de al menos 8 caracteres Unicode que no consista solo en espacios, confirmación obligatoria y coincidencia exacta. La contraseña se mantiene sin recortar para que Login verifique exactamente lo que ingresó la persona. La validación de pantalla y servicio ocurre antes de consultar SQLite; los formularios inválidos no generan operaciones de base de datos.

Si el correo ya existe, el registro se rechaza con un mensaje localizado. No se incluyen datos del formulario en logs o mensajes de error.

## Protección de contraseña

El servicio crea una sal aleatoria de 16 bytes con `expo-crypto`
(`getRandomBytesAsync`) y calcula un SHA-256 con sal en una sola pasada
(`digestStringAsync`). Esto hace que el registro y el login sean rápidos en
Expo Go. Si alguien copia la base SQLite, podrá probar muchas contraseñas con
rapidez. La cadena de `credenciales_usuario` contiene el algoritmo, la sal y
el hash, nunca la contraseña ni su confirmación. El uso de esta dependencia y
de SecureStore está detallado en
[`docs/configuracion/dependencias.md`](../configuracion/dependencias.md).

Las cuentas de desarrollo creadas con un formato de verificador anterior no se convierten y no pueden autenticarse con este formato. Antes de probar esta versión, se descartan los datos locales de desarrollo y se crea la cuenta nuevamente. No se agrega código de transición para conservar esos verificadores.

## Datos locales y preferencias

`authenticationRepository.ts` inserta el usuario en `usuarios`, el verificador en `credenciales_usuario` y las preferencias en `preferencias` dentro de una transacción. Si cualquiera de esas escrituras falla, la transacción revierte todo.

Las preferencias nuevas usan las opciones acordadas: `deposito_predeterminado_id` empieza en `NULL` y `notificaciones_activas` en `1`. El registro no crea un depósito ni altera saldos financieros.

## Login

Login valida el formulario y autentica con el servidor cuando está disponible. Después busca la cuenta local por el ID remoto antes de intentar crearla. Si el correo local cambió offline, reutiliza esa cuenta y conserva su perfil y pendientes. No une cuentas con IDs distintos aunque coincida el correo. Una respuesta remota de credenciales incorrectas no habilita un ingreso offline alternativo.

Hasta confirmar un cambio de correo, el ingreso remoto utiliza el correo anterior. Después de sincronizar, utiliza el nuevo. El ingreso offline autorizado valida el correo y verificador locales. Si una autorización revocada conserva pendientes, tampoco puede vincularse entrando con el correo anterior.

La contraseña no se escribe en almacenamiento local, logs ni errores. Si la autenticación falla, la persona permanece en Login y no se crea sesión.

## Cambio de contraseña desde Perfil

El cambio requiere conexión y sesión remota: primero actualiza la contraseña del servidor. El formulario valida la contraseña actual contra su verificador y aplica a la
nueva contraseña las mismas reglas que Registro. Al confirmar, calcula un
verificador con una sal nueva y actualiza `credenciales_usuario`, incluida su
fecha de modificación. La contraseña original nunca se guarda. El siguiente
Login comprueba la nueva contraseña persistida, también después de reiniciar la
aplicación.

## Sesión local

`sessionService.ts` expone `crearSesion`, `obtenerSesionActual`, `comprobarSesion` y `cerrarSesion`. La clave de sesión en SecureStore contiene el identificador del usuario; una clave distinta conserva la preferencia de visibilidad de saldos. No guarda la contraseña ni el verificador. La opción «Recordarme», activa inicialmente en Login, determina si el identificador de sesión se persiste en SecureStore o queda únicamente en memoria hasta cerrar AHRE.

Al abrir AHRE, `App.tsx` prepara SQLite y deja Inicio como ruta inicial; todavía
no consulta la sesión. Cuando la persona completa el deslizador, Inicio llama a
`obtenerSesionActual()`. Si SecureStore conserva el identificador guardado con
«Recordarme» y el usuario existe y está activo, se solicita la huella local.
Después de autenticar, Inicio muestra una carga animada de 1,5 segundos y abre
el Dashboard. Si no hay sesión, reemplaza Inicio por Login sin solicitar
biometría. Si el dispositivo no tiene biometría configurada, ofrece Login con
contraseña. Inicio no queda en la pila después del destino.

El botón de Perfil elimina la sesión local y el token guardado, sin borrar la cuenta ni los pendientes. También ofrece sincronizar y desvincular, que necesita conexión y confirmar todos los pendientes.

## Navegación

- El registro exitoso limpia la pila y muestra Login con un aviso de éxito.
- El Login exitoso limpia la pila y muestra Dashboard, sin dejar Login atrás.
- AHRE permanece en Inicio después de preparar SQLite; el deslizador consulta
  la sesión y decide si abre Login o solicita biometría antes del Dashboard.
- Login solo lleva al Dashboard después de verificar las credenciales.

## Errores y carga

Los errores de validación se muestran junto al campo. Los avisos generales, como un correo duplicado, credenciales inválidas o un error de almacenamiento, aparecen en una notificación emergente superior. El mismo componente confirma el registro exitoso. La notificación desaparece al terminar su barra de tiempo, tocar la X o deslizarla horizontalmente. Los errores no incluyen SQL, contraseña, sal ni verificador. El patrón que deben reutilizar otras pantallas está en [`notificaciones-toast.md`](notificaciones-toast.md).

Registro y Login muestran carga durante las operaciones y bloquean nuevos envíos mientras uno está en curso. La capa de servicio valida de nuevo los datos, de modo que no se depende únicamente de la interfaz.

## Trabajo sin conexión

El registro requiere conexión. El ingreso en modo avión solo se permite con credenciales locales válidas y una autorización previa vigente para esta instalación. Los ejemplos de desarrollo permanecen locales. Los tokens remotos se guardan en SecureStore únicamente al recordar la sesión. La revocación se detecta al reconectar; no permite reenviar pendientes de otra autorización.

## Verificación de recuperación por ID (etapa 2)

El 2 de noviembre de 2026 pasaron el chequeo de tipos y las 143 pruebas de la
app, incluidas seis integraciones con MySQL 8.4.13 local; el backend mantuvo
sus 36 pruebas aprobadas, sin omisiones. Los nuevos casos usan el servicio
real de Perfil y cubren correo offline, reinicio, ambas opciones de Recordarme,
contraseña incorrecta, identidad incompatible y pendientes revocados. Comprueban
que no se duplican usuarios ni preferencias y que los saldos se conservan.
La prueba visual del aviso en un APK queda pendiente. Esta etapa no repara
lotes rechazados: esa recuperación corresponde a la etapa 3.
