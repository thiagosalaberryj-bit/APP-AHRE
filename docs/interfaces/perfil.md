# Perfil y configuración de AHRE

## Alcance

Este documento registra el maquetado de la pantalla de Perfil. En esta etapa
no hay actualización real del perfil, persistencia de idioma o tema, permisos
de notificaciones, carga real de avatar, cierre de sesión ni comunicación con
backend. Todos los datos son simulados y los estados solo se representan en
pantalla.

## Estructura de la pantalla

`src/screens/ProfileScreen.js` es secundaria con `EncabezadoSeccion`
(«Perfil») y contenido desplazable con `KeyboardAvoidingView`:

```text
Perfil
│
├── Usuario
│   ├── Avatar, Nombre, Correo
│   └── Editar perfil → modal
│
├── Preferencias
│   ├── Idioma → modal
│   ├── Notificaciones → switch
│   └── Apariencia → chips
│
├── Cuenta
│   └── Cerrar sesión → confirmación
│
└── Avanzado
    └── Acerca de AHRE → modal
```

Se abre desde el botón de Perfil del Dashboard. La flecha del encabezado
vuelve atrás. Los estilos locales están en
`src/styles/ProfileScreenStyles.js` con tokens de `colors.js` y
`globalStyles.js`; el contenido limita su ancho a 480 puntos y acompaña los
temas claro y oscuro, incluidos modales y controles.

## Información del usuario

Tarjeta superior con avatar circular (iniciales sobre
`contenedorVerde`), nombre y correo simulados:

```text
Thiago Salaberry
thiago@ejemplo.com
```

Debajo, acción visual «Cambiar foto» sin selector real de imágenes. Al abrir
la pantalla se muestra un skeleton de carga simulado (~1 segundo).

## Modal de edición

`Editar perfil` abre un `Modal` (no una pantalla independiente) con avatar,
«Cambiar foto» visual, campo `Nombre`, campo `Correo electrónico` y
acciones `Guardar cambios` (principal, con estado de guardado simulado) y
`Cancelar`. Si el nombre está vacío al guardar, muestra «El nombre es
obligatorio» en el campo y en `MensajeError`. Al guardar se actualiza la
tarjeta solo en pantalla; no hay persistencia.

## Preferencia de idioma

Fila `Idioma` con el valor actual (`Español`) que abre un modal con
`Español/Inglés` y marca de selección. Elegir uno lo muestra como actual
solo en pantalla; las opciones reales y la persistencia quedan para después.

## Configuración de notificaciones

Fila con `Conmutador` (`src/components/Toggle.js`, mismo patrón visual de
Inicio de Sesión) y texto `Activadas/Desactivadas`. Solo cambia en pantalla;
no pide permisos ni programa nada.

## Configuración de apariencia

Fila `Apariencia` con el valor actual que abre un modal con `Modo
sistema/Modo claro/Modo oscuro` y marca de selección. `Modo sistema` es el
predeterminado y usa la apariencia del dispositivo. Es selección visual con
ayuda aclaratoria: el cambio real de tema lo implementará el líder (hoy el
tema lo define el sistema).

## Confirmación de cierre de sesión

Fila `Cerrar sesión` en color de error, diferenciada de las configuraciones.
Abre un modal con `¿Seguro que querés cerrar sesión?`, `Cancelar`
(secundario) y `Cerrar sesión` (peligro). Ambas solo cierran el modal; no
eliminan ninguna sesión.

## Configuración avanzada

Grupo `Avanzado` con fila `Acerca de AHRE` que abre un modal estático con
la descripción y la versión (`1.0.0`). No incluye exportar ni borrar datos:
cualquier acción avanzada real será otro Issue.

## Estados visuales

- **Cargando información:** skeleton al abrir la pantalla.
- **Guardando cambios:** `BotonPrincipal` con indicador y «Procesando…».
- **Error:** borde y mensaje junto al campo de nombre y `MensajeError`
  general en el modal de edición.

## Decisiones de diseño

- Se reutilizan `SectionHeader`, `Toggle`, `PrimaryButton` y `ErrorMessage`
  sin modificarlos.
- Los modales usan overlay con backdrop para cerrar y tarjeta con sombra,
  como el resto de la app.
- Seguridad biométrica, apellido, teléfono y contraseñas de los mockups
  quedan fuera de este Issue como observaciones para futuras
  funcionalidades.

## Funcionamiento sin conexión

La pantalla solo usa componentes, estilos, íconos y constantes locales. No
requiere Internet ni invoca servicios externos.
