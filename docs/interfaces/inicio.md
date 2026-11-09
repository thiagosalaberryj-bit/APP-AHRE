# Pantalla inicial de AHRE

## Finalidad

Inicio es la primera pantalla visible cada vez que se abre AHRE. Después de
preparar SQLite, queda esperando que la persona deslice el control para
continuar. El gesto consulta la sesión local y conduce a Login o, luego de
validar la huella, al Dashboard.

Abrir AHRE muestra Inicio. Al deslizar, una cuenta sin sesión pasa a Login; una sesión válida requiere huella y muestra la carga animada antes de Dashboard.

## Elementos visuales

- La pantalla nativa previa usa `assets/ahre-logo.png`, con ancho de 160 y ajuste
  `contain`, sobre los fondos claro y oscuro de AHRE. Se configura mediante
  `expo-splash-screen`. El ícono adaptativo de Android añade un margen del 22 %
  alrededor del caballo mediante el plugin local `withCompleteAdaptiveIcon`.
  Estas configuraciones requieren una nueva compilación del APK.
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

La sesión no se valida al abrir la aplicación. Si SecureStore conserva el
identificador recordado, AHRE carga su apariencia guardada antes de mostrar
Inicio; esto no abre ni valida la sesión. El logo y la barra de carga aparecen
únicamente después de autenticar la huella. Al completar el deslizador, una
sesión válida activa el diálogo biométrico nativo y conserva el tema cargado; si
no hay sesión, Inicio se reemplaza por Login sin solicitar la huella. El flujo
y sus casos de error están documentados en
[`docs/funcionalidades/inicio.md`](../funcionalidades/inicio.md).

Cancelar o fallar la huella deja a la persona en Inicio con el deslizador listo
para reintentar. Si el dispositivo no tiene biometría configurada, se ofrece
Login con contraseña.

## Acceso temporal a datos de prueba

En Expo Go, Inicio muestra Entrar con datos de prueba y Entrar con 10.000 movimientos
encima del deslizador, con la aclaración Solo desarrollo · Cuenta local independiente. Está condicionado
por `__DEV__`; no se habilitó ningún perfil ni APK para este acceso.

El primer botón prepara tres depósitos, movimientos de ejemplo, tres contactos, una sala
con cuatro gastos y una deuda pendiente en una cuenta local de pruebas; luego
abre el Dashboard. Muestra Preparando datos… y bloquea el deslizador
mientras trabaja. Un error conserva Inicio y se comunica con el toast existente.
El flujo normal del deslizador sigue disponible cuando termina.

El segundo agrega el depósito Volumen · 10.000 movimientos en la misma cuenta
de prueba, sin sincronizar. Mientras trabaja muestra Preparando 10.000 movimientos…;
ambos botones y el deslizador quedan deshabilitados para evitar cargas simultáneas.
No aparece en la versión de producción ni altera las cuentas habituales.

El componente y sus estilos están separados en DevelopmentDataButton.tsx y
DevelopmentDataButtonStyles.ts. La preparación está en src/development/ y se
describe en la [lógica de Inicio](../funcionalidades/inicio.md#datos-temporales-para-expo-go).

## Tema, áreas seguras y conectividad

Inicio usa la apariencia guardada de la sesión recordada o, si no hay un
identificador guardado, el modo claro u oscuro del dispositivo. La barra de
estado, el fondo, el contenido y el área de navegación del sistema respetan el
tema activo y las áreas seguras. No muestra la barra de pestañas de AHRE.

La inicialización y la comprobación de sesión usan recursos locales. No
comprueban conexión a Internet ni consultan servicios remotos.
