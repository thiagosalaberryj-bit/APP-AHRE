# Autenticación local

## Alcance

AHRE crea cuentas y autentica a las personas localmente. El flujo funciona sin conexión y no usa backend, verificación de correo, OAuth, recuperación remota ni tokens de servidor.

```text
Registro → validar → crear cuenta local → Login
Login → validar credenciales locales → crear sesión → Dashboard
```

## Registro y validación

Registro usa el correo electrónico como identificador único porque ese es el campo disponible en la pantalla. El correo se recorta y normaliza a minúsculas antes de buscarlo o guardarlo; un índice único sobre `LOWER(correo_electronico)` protege también las escrituras concurrentes.

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

`authenticationRepository.js` inserta el usuario en `usuarios`, el verificador en `credenciales_usuario` y las preferencias en `preferencias` dentro de una transacción. Si cualquiera de esas escrituras falla, la transacción revierte todo.

Las preferencias nuevas usan las opciones acordadas: `deposito_predeterminado_id` empieza en `NULL` y `notificaciones_activas` en `1`. El registro no crea un depósito ni altera saldos financieros.

## Login

Login valida correo y contraseña antes de acceder a SQLite. Busca una cuenta activa por correo normalizado y compara la contraseña con el verificador persistido. Una cuenta inexistente y una contraseña incorrecta producen el mismo mensaje para no revelar si ese correo está registrado.

La contraseña no se escribe en almacenamiento local, logs ni errores. Si la autenticación falla, la persona permanece en Login y no se crea sesión.

## Sesión local

`sessionService.js` expone `crearSesion`, `obtenerSesionActual`, `comprobarSesion` y `cerrarSesion`. SecureStore contiene solo el identificador del usuario; no guarda la contraseña ni el verificador. La opción «Recordarme», activa inicialmente en Login, determina si ese identificador se persiste en SecureStore o queda únicamente en memoria hasta cerrar AHRE.

Al iniciar AHRE, `App.js` prepara SQLite y siempre monta el navegador en Inicio. Aunque SecureStore conserve el identificador al usar «Recordarme», el arranque no lo consulta ni salta al Dashboard. La recuperación automática de sesión y su navegación quedan para otro Issue.

El servicio de cierre elimina la sesión de memoria y SecureStore. La conexión del botón de Perfil queda fuera de este issue y se realizará en un trabajo posterior.

## Navegación

- El registro exitoso limpia la pila y muestra Login con un aviso de éxito.
- El Login exitoso limpia la pila y muestra Dashboard, sin dejar Login atrás.
- AHRE siempre abre en Inicio; desde allí la persona elige Login o Registro.
- Login solo lleva al Dashboard después de verificar las credenciales.

## Errores y carga

Los errores de validación se muestran junto al campo. Los avisos generales, como un correo duplicado, credenciales inválidas o un error de almacenamiento, aparecen en una notificación emergente superior. El mismo componente confirma el registro exitoso. La notificación desaparece al terminar su barra de tiempo, tocar la X o deslizarla horizontalmente. Los errores no incluyen SQL, contraseña, sal ni verificador. El patrón que deben reutilizar otras pantallas está en [`notificaciones-toast.md`](notificaciones-toast.md).

Registro y Login muestran carga durante las operaciones y bloquean nuevos envíos mientras uno está en curso. La capa de servicio valida de nuevo los datos, de modo que no se depende únicamente de la interfaz.

## Trabajo sin conexión

La función usa SQLite, SecureStore y cómputo criptográfico local. No realiza llamadas de red. El registro y el login pueden ejecutarse en modo avión.
