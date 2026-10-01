# Pantalla inicial de AHRE

## Finalidad

Inicio es la primera pantalla visible cada vez que se abre AHRE. Después de
preparar SQLite, queda esperando que la persona deslice el control para
continuar. El gesto consulta la sesión local y conduce a Login o, luego de
validar la huella, al Dashboard.

```text
Abrir AHRE → Inicio → deslizar
                       ├── sin sesión → Login
                       └── sesión válida → huella → carga animada → Dashboard
```

## Elementos visuales

- Fondo uniforme del tema activo, sin luces ni círculos decorativos (`#F4F4F4`
  en claro y `#081C19` en oscuro).
- Símbolo de AHRE desde `assets/ahre-mark.png`.
- Nombre de AHRE en dos líneas (`AH` y `RE`), centrado en la pantalla.
- Deslizador inferior con el texto «Desliza para iniciar».
- Mientras se inicializa SQLite, permanece la pantalla nativa de carga. Inicio
  aparece con el deslizador habilitado cuando la preparación termina.
- Después de validar la huella, Inicio cambia a una pantalla de carga completa:
  muestra el logo completo de AHRE, sin texto fijo en el centro, y una barra de
  progreso verde brillante en la parte inferior. Encima, el estado cambia y se
  muestra el porcentaje actual. La pista y los textos usan el tema activo; el
  progreso dura 1,5 segundos antes de abrir el Dashboard.

## Comprobación y destino

La sesión no se consulta al abrir la aplicación. El logo y la barra de carga
aparecen únicamente después de autenticar la huella. Al completar el deslizador,
una sesión válida activa el
diálogo biométrico nativo; si no hay sesión, Inicio se reemplaza por Login sin
solicitar la huella. El flujo y sus casos de error están documentados en
[`docs/funcionalidades/inicio.md`](../funcionalidades/inicio.md).

Cancelar o fallar la huella deja a la persona en Inicio con el deslizador listo
para reintentar. Si el dispositivo no tiene biometría configurada, se ofrece
Login con contraseña.

## Tema, áreas seguras y conectividad

Inicio acompaña el modo claro u oscuro seleccionado en el dispositivo. La barra
de estado, el fondo, el contenido y el área de navegación del sistema respetan
el tema activo y las áreas seguras. No muestra la barra de pestañas de AHRE.

La inicialización y la comprobación de sesión usan recursos locales. No
comprueban conexión a Internet ni consultan servicios remotos.
