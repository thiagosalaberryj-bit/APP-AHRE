# Interfaces de autenticación de AHRE

## Alcance

Login y Registro preparan la interfaz para una futura autenticación. En esta
etapa no crean usuarios, no guardan credenciales ni sesión, no consultan SQLite
ni se comunican con un backend. Los botones no ejecutan validaciones ni envían
datos; los componentes exponen propiedades visuales para incorporar esos estados
cuando se desarrolle la lógica. El estado local se limita a los valores escritos,
la visibilidad de las contraseñas y el switch «Recordarme»; no hay hooks
personalizados ni lógica de autenticación.

## Estructura de Login

`src/screens/LoginScreen.js` presenta la identidad de AHRE, el título «Iniciá
sesión», una explicación breve, el correo electrónico, la contraseña, el botón
«Iniciar sesión» y el acceso «Ir a Registro». El botón lleva al Dashboard para
comprobar el flujo visual, sin autenticar ni crear una sesión.

Campos previstos:

| Campo | Obligatorio previsto | Teclado / entrada |
| --- | --- | --- |
| Correo electrónico | Sí | `email-address`, sin capitalización automática |
| Contraseña | Sí | Entrada oculta inicialmente, con acción para mostrarla |

Debajo de la contraseña se muestra un switch tipo cápsula, compacto y animado,
«Recordarme», junto al acceso «¿Olvidaste tu contraseña?». El switch distingue
visualmente los estados activo e inactivo; sólo cambia su estado en pantalla,
sin guardar preferencias ni sesión. Mide `56 × 32` y anima su control interno.
La recuperación todavía no tiene navegación asociada.

## Estructura de Registro

`src/screens/RegistrationScreen.js` presenta el nombre, correo electrónico,
contraseña, confirmación de contraseña, el botón «Registrarse» y el acceso
«Volver a Login». Ambos regresan a la pantalla Login.

Campos previstos:

| Campo | Obligatorio previsto | Relación con el modelo / entrada |
| --- | --- | --- |
| Nombre | Sí | `usuarios.nombre`; capitalización de palabras |
| Correo electrónico | Sí | `usuarios.correo_electronico`; teclado `email-address` |
| Contraseña | Sí | Credencial para una futura autenticación; no existe como campo local de `usuarios` |
| Confirmar contraseña | Sí | Confirmación visual de la credencial; no se guarda en el modelo |

El modelo local de usuario definido en `docs/base-de-datos/base-datos-local.md`
contiene `id`, `nombre`, `correo_electronico`, `activo`, `fecha_creacion` y
`fecha_actualizacion`. El correo es el identificador usado en estas pantallas.
Las contraseñas no se almacenan en SQLite. La comprobación de formato, la
coincidencia entre contraseña y confirmación y las reglas de contraseña quedan
para la futura lógica de autenticación.

Debajo del botón «Registrarse» aparece en una sola línea el texto «Al registrarte,
aceptás Términos y Política de privacidad». Los nombres tienen estilo de enlace,
pero todavía no navegan a documentos. En pantallas angostas el texto reduce su
tamaño hasta el 80 % para conservar una línea sin bloquear el desplazamiento del
formulario.

## Componentes reutilizados

- `src/components/AuthContainer.js` (`ContenedorAutenticacion`): marca,
  encabezado, áreas seguras, desplazamiento y adaptación al teclado.
- `src/components/AuthInput.js` (`CampoAutenticacion`): etiqueta, entrada de
  texto y representación de estados normal, enfocado, completado, error y
  deshabilitado.
- `src/components/PasswordInput.js` (`CampoContrasena`): entrada de contraseña
  oculta con acción accesible para mostrarla u ocultarla.
- `src/components/PrimaryButton.js` (`BotonPrincipal`): acción principal y estado de carga.
- `src/components/ErrorMessage.js` (`MensajeError`): mensaje general de error
  o indisponibilidad.
- Colores y estilos tipográficos vienen de `src/styles/colors.js` y
  `src/styles/globalStyles.js`; las reglas de distribución de autenticación
  están en `src/styles/authStyles.js`.

## Estados visuales

- **Normal:** borde y superficie definidos por el tema global.
- **Enfocado:** borde del color de foco global.
- **Completado:** borde de éxito cuando el campo contiene texto y pierde el foco.
- **Error:** borde y mensaje junto al campo con color de error del tema. La
  propiedad `error` permite representarlo sin validar los datos desde la
  pantalla.
- **Deshabilitado:** superficie y texto de deshabilitado a través de la propiedad
  `deshabilitado`.
- **Procesando:** el botón principal permite mostrar un indicador y «Procesando…»
  mediante la propiedad `cargando`.
- **Error general:** `MensajeError` presenta el mensaje bajo los campos y antes
  del botón principal cuando reciba texto.

Los componentes están preparados para representar esos estados, pero las
pantallas Login y Registro actualmente no activan errores ni carga; los mensajes
son opcionales y no se simulan automáticamente.

No se implementan validaciones, envío de formularios ni simulaciones de carga.
Tampoco se comprueba formato de correo, reglas de contraseña o coincidencia de
la confirmación.

## Teclado y tamaños de pantalla

`ContenedorAutenticacion` combina `KeyboardAvoidingView` con `ScrollView`, áreas
seguras y `keyboardShouldPersistTaps="handled"`. En iOS el contenedor usa ajuste
`padding` y cierre interactivo del teclado; en Android usa ajuste `height`. Así
se puede desplazar el contenido para llegar a cualquier campo y acción. El correo
abre el teclado apropiado, y las teclas «siguiente» llevan el foco al campo
siguiente.

El contenido limita su ancho a 480 puntos en pantallas amplias y conserva
márgenes en pantallas pequeñas. El tema se toma de la preferencia del sistema y
usa las paletas clara u oscura existentes.

## Decisiones visuales

Los campos muestran una indicación breve en gris dentro de cada entrada y usan
un borde fino gris claro en su estado normal. En modo claro, las acciones
principales intercambian los colores globales de fondo y texto; en modo oscuro
conservan la combinación del tema. El texto de los botones va en negrita. La app
actualiza el fondo nativo con `expo-system-ui` según el tema y el Native Stack
usa ese mismo color como fondo del contenido para evitar que aparezca un fondo
blanco detrás de la transición entre pantallas. Ambas pantallas muestran al pie
el copyright de AHRE con el año actual calculado al renderizar. La barra de
estado sigue el tema; como Login y Registro no muestran la barra de pestañas,
el área de navegación inferior del sistema utiliza el fondo general del tema.

## Navegación

```text
Inicio → Login → Registro → Login
```

Login abre Registro desde «Ir a Registro» y su botón principal navega al
Dashboard. Registro vuelve a Login tanto desde «Registrarse» como desde «Volver
a Login». Estas acciones sólo comprueban la navegación visual; no autentican,
crean usuarios ni guardan una sesión.

## Funcionamiento sin conexión

Las pantallas sólo usan componentes, estilos, íconos y el logo incluidos en la
app. No requieren Internet ni invocan servicios externos.
