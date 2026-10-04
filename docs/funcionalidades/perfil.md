# Perfil y preferencias locales

## Alcance

La pantalla existente de Perfil administra localmente la información del
usuario autenticado y sus preferencias. No utiliza Internet ni un backend.

```text
Perfil → consultar usuario y preferencias → editar o guardar preferencias
Perfil → confirmar cierre de sesión → eliminar solo la sesión → Login
```

## Usuario actual

`src/profile/profileService.js` obtiene el usuario mediante la sesión local y
lo consulta desde SQLite. Perfil muestra el nombre, el correo y la fecha de
creación reales de `usuarios`; ya no utiliza datos de cuenta hardcodeados.

La edición conserva el modal existente. Antes de abrirlo, la persona puede
confirmar su identidad con la contraseña local contra el verificador almacenado
o con la biometría configurada en el dispositivo. La contraseña se envía desde
el teclado y la acción biométrica aparece debajo del campo. Si no hay biometría
disponible, la contraseña continúa como alternativa. El nombre y el correo se
validan con las mismas reglas básicas de Registro, incluidos campos
obligatorios, formato, longitud y correo único. Guardar actualiza `usuarios` y
refleja los cambios inmediatamente. Cerrar el editor con la `X` descarta el
borrador y no escribe en la base.

## Preferencias

La tabla `preferencias` conserva una fila por usuario y ahora almacena:

- `idioma`: `es` o `en`;
- `notificaciones_activas`: indicador `0/1`;
- `apariencia`: `sistema`, `claro` u `oscuro`;
- el depósito predeterminado existente.

Idioma y notificaciones se guardan al elegir o cambiar el control. La selección
de apariencia también se guarda y actualiza `ContextoApariencia`, por lo que el
tema se aplica globalmente. Al iniciar AHRE, si SecureStore conserva el
identificador recordado, se recupera la apariencia antes de mostrar Inicio sin
validar la sesión. El deslizador valida la sesión por separado y conserva el
tema ya aplicado. Al completar Login también se recupera la apariencia
guardada. `Modo del sistema` sigue la configuración del dispositivo.
La fila `Restablecer apariencia`, dentro de `Preferencias`, devuelve la
selección al tema del dispositivo.

La biometría solo verifica localmente a quien usa el dispositivo al abrir el
editor; no almacena datos de huella ni reemplaza el verificador de contraseña.
El cambio de contraseña verifica la contraseña actual, deriva un verificador
nuevo y actualiza `credenciales_usuario` en SQLite. El cambio queda disponible
en los siguientes ingresos, incluso después de cerrar y volver a abrir AHRE.

Las traducciones completas no forman parte de este Issue: el idioma queda
persistido y disponible para los módulos futuros.

## Cierre de sesión

La confirmación distingue cancelar de confirmar. Al confirmar se elimina la
sesión en memoria y SecureStore, se restablece temporalmente la apariencia del
dispositivo y se reemplaza la pila por Login. El botón Atrás no permite volver
al Dashboard de la sesión cerrada.

El cierre de sesión no elimina usuarios, depósitos, movimientos, categorías,
estadísticas ni preferencias. Los datos financieros quedan asociados al
usuario para el próximo inicio de sesión.

## Estados y errores

- **Cargando:** skeleton mientras se consulta el usuario y sus preferencias.
- **Guardando:** el botón de edición muestra «Procesando…» y bloquea envíos
  repetidos.
- **Error:** se conservan los errores junto a los campos y se utiliza el toast
  para fallos de consulta, duplicados o preferencias.
- **Sesión inválida:** se ofrece volver a Login sin mostrar información
  simulada.

## Archivos involucrados

- `src/screens/ProfileScreen.js`: interfaz, modales, estados y navegación;
- `src/profile/profileService.js`: consultas, validaciones y escrituras del
  perfil y preferencias;
- `src/database/repositories/authenticationRepository.js`: acceso a los
  verificadores de contraseña persistidos;
- `src/database/repositories/usersRepository.js`: usuario local;
- `src/database/repositories/preferencesRepository.js`: preferencias locales;
- `src/database/migrations/001_initialSchema.js`: columnas iniciales de idioma
  y apariencia;
- `src/contexts/AppearanceContext.js`: tema global durante la sesión;
- `src/authentication/sessionService.js`: creación, consulta y cierre de la
  sesión local.

## Funcionamiento offline

Todas las operaciones usan SQLite, SecureStore y estado local de la aplicación.
Perfil, preferencias y cierre de sesión funcionan sin Wi-Fi, datos móviles o
backend.
