# Formulario de creación de depósitos

## Finalidad y alcance

`src/screens/DepositScreen.js` presenta el formulario para crear un depósito,
es decir, una fuente donde el usuario organiza su dinero. Se abre desde «Nuevo
depósito» en el Dashboard y usa la ruta ya registrada en `AppNavigator.js`.
Al crear, valida los campos y guarda el depósito en SQLite local a través de la
lógica de depósitos y el repositorio; no requiere conexión a Internet. Si se
completa correctamente, vuelve a la pantalla anterior. La flecha y «Cancelar»
regresan sin guardar.

## Campos

| Campo | Requerido | Presentación |
| --- | --- | --- |
| Saldo inicial | Sí | Primer campo del formulario; monto en pesos con prefijo `$`, presentación destacada y teclado decimal. La ayuda indica que la coma separa los decimales; admite hasta dos y persiste como número. |
| Nombre | Sí | Debajo del saldo inicial; texto de hasta 30 caracteres, con ejemplos y contador junto al título del campo. |
| Tipo de depósito | Sí | Selector entre Efectivo, Banco y Billetera virtual. |
| Ícono | Sí, con una opción inicial | Grilla compacta con cuatro opciones visibles y «Más» para abrir las restantes; se persiste el nombre de Ionicons seleccionado. |
| Color | No | Muestra azul suave predeterminada (`#C3D1E3`) y cuatro alternativas de la paleta de depósitos, todas visibles. |
| Descripción | No | Texto de hasta 60 caracteres con contador junto al título del campo y la indicación «Opcional». |

El catálogo de tipos corresponde a `efectivo`, `banco` y
`billetera_virtual`, según el modelo de datos de depósitos. La opción activa se
indica con borde y cambio de fondo además del color, sin una marca de tilde.

El ícono empieza con una opción de efectivo seleccionada. La grilla muestra
Efectivo, Banco, Virtual, Billetera y «Más», siguiendo el patrón compacto del
selector de categorías. «Más» abre un modal con Tarjeta y Ahorros. Se guarda la
referencia permitida del ícono, no el componente visual.

El color predeterminado es el azul suave `#C3D1E3`. El selector presenta en una
sola fila los cinco colores de `COLORES_DEPOSITOS`: azul predeterminado, verde
suave, violeta, rosa y amarillo suave. Esta paleta identifica depósitos y es
independiente de los colores de categorías de Estadísticas. La opción
seleccionada presenta un tick y un borde verde de foco; las demás conservan un
borde neutro. El texto también informa el color seleccionado. Se persiste el
color elegido o el azul suave predeterminado.

La descripción es opcional. Se recortan los espacios y se admiten hasta 60
caracteres. Si queda vacía, la lógica de depósitos genera una descripción con
el nombre y tipo: `Fuente «{nombre}» · {tipo}`.

## Estados visuales

- **Normal:** campos y superficies usan los tokens del tema activo.
- **Enfocado:** los campos de texto usan el borde de foco global.
- **Error:** al intentar guardar con datos faltantes o inválidos, el campo
  correspondiente muestra borde y texto de error, y un toast resume que hay
  que revisar los campos marcados. Los errores de sesión o de almacenamiento
  local también se presentan mediante un aviso compartido.
- **Guardando:** el botón principal presenta «Procesando…»; se deshabilitan los
  controles para evitar cambios o envíos repetidos mientras se guarda.
- **Éxito:** el depósito queda en la base local y el formulario vuelve a la
  pantalla anterior.

El saldo inicial se guarda como número y también inicializa el saldo actual. No
se implementan movimientos ni una actualización del Dashboard desde SQLite.
Las reglas completas de persistencia se describen en
[`docs/funcionalidades/depositos.md`](../funcionalidades/depositos.md).

## Teclado, adaptación y temas

La pantalla combina `KeyboardAvoidingView`, `ScrollView`,
`keyboardShouldPersistTaps="handled"` y el espacio inferior del área segura para
mantener accesibles los campos y las acciones con el teclado abierto. El saldo
usa `decimal-pad`. El formulario limita el ancho a 480 puntos y se adapta a
pantallas angostas mediante tarjetas que pueden ocupar más de una fila.

El encabezado reutiliza `SectionHeader`; los campos y las acciones utilizan los
estilos globales. Los estilos propios de distribución están en
`src/styles/DepositScreenStyles.js` y consumen `TEMAS`,
`COLOR_DEPOSITO_PREDETERMINADO`, `COLORES_GRAFICOS` y los tokens de
`globalStyles.js`. La paleta se mantiene legible en modo claro y
oscuro, y el formulario respeta el área segura superior e inferior.

## Detalle de un depósito

`src/screens/DepositDetailScreen.js` muestra el depósito seleccionado desde el
Dashboard. La fila entrega el objeto de depósito a la ruta existente; la
pantalla reutiliza `SectionHeader` para volver, con el título «Detalle de
depósito» y la descripción «Consultá el saldo y los movimientos de este
depósito». Respeta las áreas seguras superior e inferior; la distribución propia
de esta pantalla vive en `src/styles/DepositDetailScreenStyles.js`.

La tarjeta superior presenta el ícono sobre el color del depósito, nombre,
tipo, descripción opcional y saldo destacado. El saldo se identifica como
perteneciente a ese depósito; no es el balance general que aparece en el
Dashboard. Los ejemplos cubren Efectivo, Billetera virtual y Banco. Banco
incluye el estado visual sin movimientos.

Debajo del título «Movimientos» aparece una fila con el buscador y el botón
«Filtros» a su lado. El buscador tiene lupa, placeholder «Buscar» y una acción
para borrar el texto; solo toma el color de foco mientras está enfocado. Los
filtros abren una hoja superpuesta con manija y cierre. Las secciones Tipo,
Fecha, Categorías y Monto se pueden plegar y muestran un
resumen cuando están cerradas. Tipo ofrece Todos, Ingresos y Egresos. Fecha
ofrece Todo, Día, Mes y Rango, con calendario en línea para elegir el día o los
extremos del rango, y una grilla de meses con navegación por año. Categorías
usa la grilla coloreada y multiselección de Movimientos, limitada a las
categorías presentes en el depósito y al tipo seleccionado. Monto permite
indicar mínimo y máximo. El panel se puede cerrar con el botón, tocando fuera
o arrastrando la manija hacia abajo.

Los filtros se aplican localmente a los datos simulados. Los criterios activos
aparecen debajo del buscador como chips que pueden quitarse; «Limpiar todo»
restablece la búsqueda y los filtros. El rótulo muestra el número de criterios
activos y el botón «Filtros» abre la hoja.
El detalle no muestra un filtro de depósitos porque la lista ya está limitada
al depósito seleccionado. No se consulta SQLite.

La lista simulada reutiliza `TarjetaMovimiento` y agrupa los movimientos por
día, con los rótulos «Hoy», «Ayer» o una fecha anterior. Cada tarjeta presenta
categoría y descripción, hora y depósito, tipo e importe con signo, como en la
pestaña Movimientos. Al tocar una fila se abre el detalle existente con la
descripción del movimiento y sus datos. Los estados incluyen carga, sin
movimientos, sin resultados de búsqueda y sin resultados por filtros.

El botón de opciones del depósito, ubicado arriba a la derecha de la tarjeta,
abre un modal que presenta directamente las acciones «Editar depósito» y
«Eliminar depósito», sin repetir el nombre y el tipo del depósito. Editar
presenta un modal en la misma pantalla que reutiliza la presentación y los
controles del formulario de creación: nombre, tipo, ícono, color y descripción,
sin saldo inicial. Los cambios del formulario son un borrador local:
«Cancelar» los descarta y «Guardar cambios» informa que todavía no se guardan,
conservando los datos originales.

Eliminar abre una confirmación con el resumen del depósito, un aviso visual y
las acciones «Cancelar» y «Eliminar». La confirmación no elimina el depósito y
comunica que la operación aún no está disponible. No se implementan
persistencia, consultas, actualización ni eliminación reales.

La pantalla y sus modales usan el tema activo claro u oscuro, tokens de
`globalStyles.js` y colores de `colors.js`. No se añade una pantalla separada
para edición ni se modifica la navegación existente.
