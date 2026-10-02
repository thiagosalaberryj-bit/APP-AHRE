# Perfil y configuración de AHRE

## Alcance

Este documento registra la interfaz y el alcance local de la pantalla de
Perfil. El usuario, el idioma, la apariencia, las notificaciones y el cierre de
sesión se administran con SQLite y SecureStore, sin comunicación con backend.
La selección de una foto continúa siendo temporal porque el avatar persistente
queda fuera de este Issue.

## Estructura de la pantalla

`src/screens/ProfileScreen.js` es secundaria con `EncabezadoSeccion`
(«Perfil») y contenido desplazable con `KeyboardAvoidingView`:

```text
Perfil
│
├── Usuario
│   ├── Foto a la izquierda; nombre completo, correo y registro a su lado
│   ├── Cambiar foto / Quitar foto → selector o avatar con iniciales
│   └── Editar perfil → confirmar contraseña → modal
│
├── Preferencias
│   ├── Idioma → modal
│   ├── Notificaciones → switch
│   └── Apariencia → chips
│
├── Cuenta
│   └── Cambiar contraseña → modal de demostración
│
├── Ajustes avanzados
│   ├── Restablecer apariencia → tema del dispositivo
│   ├── Cuenta fantasma / Seguridad / Registro → próximamente
│   └── Acerca de AHRE → modal

└── Sesión
    └── Cerrar sesión → confirmación, al final de la pantalla
```

Se abre desde el botón de Perfil del Dashboard. La flecha del encabezado
vuelve atrás. Los estilos locales están en
`src/styles/ProfileScreenStyles.js` con tokens de `colors.js` y
`globalStyles.js`; el contenido limita su ancho a 480 puntos y acompaña los
temas claro y oscuro, incluidos modales y controles.

## Información del usuario

Tarjeta superior en dos columnas: avatar circular a la izquierda (iniciales
sobre `contenedorVerde` hasta seleccionar una foto) y los datos alineados a su
lado. Nombre y correo se agrupan arriba; la fecha queda abajo a la altura de
las acciones bajo el avatar. El nombre completo usa una sola línea, el mismo
estilo destacado y puntos suspensivos si no entra. Correo y fecha de registro
usan texto de apoyo más pequeño; la fecha abrevia el mes para mantenerse en
una línea:

```text
Thiago Salaberry
thiago@ejemplo.com
Miembro desde sep 2026
```

«Cambiar foto» aparece debajo del avatar, abre la galería del dispositivo y
recorta la imagen como un cuadrado. Cuando hay una foto, las acciones compactas
«Cambiar» y «Quitar» aparecen en una misma línea para conservar el alto de la
tarjeta. «Quitar» vuelve a mostrar las iniciales. La foto se conserva en
memoria mientras la pantalla de Perfil está abierta; no se guarda en
almacenamiento. Al abrir la pantalla se muestra un skeleton de carga simulado
(~1 segundo).

## Modal de edición

`Editar perfil` abre primero un modal para verificar la contraseña local contra
el verificador almacenado. Después abre un segundo modal (no una pantalla
independiente) con los campos `Nombre` y `Correo electrónico`, y las acciones
`Guardar cambios` y `Cancelar`. Se validan campos obligatorios, formato,
longitud y correo único antes de actualizar SQLite. Al guardar se actualiza la
tarjeta inmediatamente.

## Preferencia de idioma

Fila `Idioma` con el valor actual (`Español`) que abre un modal con
`Español/Inglés` y marca de selección. Elegir uno guarda `es` o `en` en las
preferencias locales y lo recupera al volver a abrir AHRE.

## Configuración de notificaciones

Fila con `Conmutador` (`src/components/Toggle.js`, mismo patrón visual de
Inicio de Sesión) y texto `Activadas/Desactivadas`. El estado se guarda como
`notificaciones_activas`; todavía no solicita permisos ni programa avisos.

## Configuración de apariencia

Fila `Apariencia` con el valor actual que abre un modal con `Modo del
sistema/Modo claro/Modo oscuro` y una descripción para cada opción. La
selección cambia el tema de todas las pantallas de AHRE en el momento. `Modo
del sistema` es el predeterminado y sigue la apariencia del dispositivo. El
valor se guarda en `preferencias` y se recupera al reiniciar la aplicación.

## Confirmación de cierre de sesión

La fila `Cerrar sesión` aparece al final de la pantalla, separada de las
configuraciones, con icono centrado sobre un rojo atenuado. Abre un modal con
`¿Seguro que querés cerrar sesión?`, `Cancelar` (secundario) y `Cerrar sesión`
(peligro). Confirmar elimina la sesión local y reemplaza la pila por Login, sin
borrar datos financieros ni preferencias.

## Cambio de contraseña

La fila `Cambiar contraseña` en `Cuenta` abre un modal con contraseña actual,
nueva y confirmación. Comprueba que los campos estén completos y que las dos
contraseñas nuevas coincidan. Como la autenticación no está conectada, el cambio
es de demostración y solo se conserva durante la sesión.

## Configuración avanzada

Grupo `Ajustes avanzados` con `Restablecer apariencia`, que vuelve al tema del
dispositivo durante la sesión; los apartados `Cuenta fantasma`, `Seguridad` y
`Registro` están desactivados con la etiqueta `Próximamente`; y `Acerca de AHRE`,
que abre un modal estático con una descripción de las funciones de AHRE y la
versión (`1.0.0`). No incluye exportar ni borrar datos: cualquier acción
avanzada real será otro Issue.

## Estados visuales

- **Cargando información:** skeleton al abrir la pantalla.
- **Foto de perfil:** el selector del sistema permite elegir y recortar una
  imagen; la vista previa se mantiene mientras Perfil está abierta.
- **Confirmación de contraseña:** verifica las credenciales locales antes de
  mostrar el editor.
- **Guardando cambios:** `BotonPrincipal` con indicador y «Procesando…».
- **Error:** borde y mensaje junto al campo, con un aviso local cuando la
  operación no puede completarse.

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
