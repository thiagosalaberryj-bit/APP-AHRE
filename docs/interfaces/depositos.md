# Formulario de creación de depósitos

## Finalidad y alcance

`src/screens/DepositScreen.tsx` presenta el formulario para crear un depósito,
es decir, una fuente donde el usuario organiza su dinero. Se abre desde «Nuevo
depósito» en el Dashboard y usa la ruta ya registrada en `AppNavigator.tsx`.
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
selector de categorías. «Más» abre un modal con Tarjeta y Ahorros. Al elegir una
de estas opciones, la quinta casilla muestra su ícono y nombre con el estado
seleccionado; tocarla vuelve a abrir el modal. Si se elige una opción principal,
la quinta casilla vuelve a mostrar «Más». Este comportamiento se comparte con
la edición del depósito. Se guarda la
referencia permitida del ícono, no el componente visual.

El color predeterminado es el azul suave `#C3D1E3`. El selector presenta en una
sola fila los cinco colores de `COLORES_DEPOSITOS`: azul predeterminado, verde
suave, violeta, rosa y amarillo suave. Esta paleta identifica depósitos y es
independiente de los colores de categorías de Estadísticas. La opción
seleccionada presenta un tick y un borde verde de foco; las demás conservan un
borde neutro. El texto también informa el color seleccionado. Se persiste el
color elegido o el azul suave predeterminado. Los nombres visibles son Azul,
Verde, Violeta, Rosa y Amarillo, en una sola línea; la información de selección
conserva el nombre completo.

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
usa `decimal-pad`. El formulario ocupa el ancho disponible con 12 puntos de
margen por lado, igual que Inicio, y se adapta a
pantallas angostas mediante tarjetas que pueden ocupar más de una fila.

El encabezado reutiliza `SectionHeader`; los campos y las acciones utilizan los
estilos globales. Crear y editar comparten campos con fondo de superficie (blanco en tema claro) y radio de
10 puntos, separación de 16 puntos entre grupos, tarjetas de tipo de 84 puntos
e íconos de tipo en contenedores de 32 puntos. El modal de íconos usa radio de
12 puntos y ancho máximo de 480 puntos. Los estilos propios de distribución están en
`src/styles/DepositScreenStyles.ts` y consumen `TEMAS`,
`COLOR_DEPOSITO_PREDETERMINADO`, `COLORES_GRAFICOS` y los tokens de
`globalStyles.ts`. La paleta se mantiene legible en modo claro y
oscuro, y el formulario respeta el área segura superior e inferior.

## Detalle de un depósito

`src/screens/DepositDetailScreen.tsx` muestra el depósito seleccionado desde el
Dashboard. La fila envía el identificador del depósito a la ruta existente; la
pantalla reutiliza `SectionHeader` para volver, con el título «Detalle de
depósito» y la descripción «Consultá el saldo y los movimientos de este
depósito». Respeta las áreas seguras superior e inferior; la distribución propia
de esta pantalla vive en `src/styles/DepositDetailScreenStyles.ts`.

La tarjeta superior sigue el estilo del detalle de movimiento: icono de 56 puntos,
nombre completo y tipo a la izquierda, con el saldo a su derecha sobre fondo
suave y el importe alineado a la derecha. El icono de ampliación aparece junto
a «Saldo» cuando el importe visible es largo, como en el detalle de movimiento.
Las opciones quedan en la parte inferior de la tarjeta, a la derecha de la fila
de comparación mensual. La descripción queda libre de botones.
La comparación ocupa una columna compacta: «Variación mensual» en el primer
renglón y el dato con su ícono justo debajo, separados por 4 puntos. El botón
de tres puntos queda a la derecha del conjunto, centrado respecto de ambas
filas, y conserva su área de 44 por 44 puntos.

Si el dato supera el ancho disponible, se muestra en una sola línea y se
desplaza automáticamente hasta el final. Espera un segundo antes de avanzar,
se mueve a velocidad constante y, al llegar al final, espera tres segundos
antes de volver al inicio. Cuando cabe completo permanece quieto. La animación
se detiene al salir de la pantalla y se reinicia al cambiar el contenido o las
medidas. Respeta la preferencia del sistema de reducir movimiento: en ese caso
permite deslizar el texto manualmente. La etiqueta accesible conserva el dato
completo y, al ocultar el saldo, se reemplaza por «Variación mensual oculta».
La tarjeta usa radio de 10 puntos y conserva la separación superior de 24 puntos.
Los modales del detalle (opciones, saldo, edición, íconos y eliminación) usan
superficies del tema, ancho máximo de 480 puntos y radio de 12 puntos. Comparten
la jerarquía de títulos, textos secundarios legibles y controles de cierre.
La edición conserva sus campos y validaciones, con fondo de superficie en las entradas,
separación de 16 puntos, selectores de tipo más compactos y acciones al pie de
altura consistente. Los contadores siguen junto al título del campo. Estos
estilos de campos y selectores se comparten con el formulario de creación en
`DepositScreenStyles.ts`; la distribución del modal queda en los estilos del detalle.
Luego aparece la descripción completa; una línea separa
la comparación mensual, con texto legible y su fecha de referencia. Esta pantalla
respeta la preferencia de privacidad del balance general, sin botón de ojo.
Tocar el saldo largo visible abre un modal
temático con el importe completo seleccionable y desplazamiento horizontal si
es muy largo; se cierra con X, Cerrar, Atrás o el fondo. La comparación conserva la fecha
exacta y el saldo anterior usado como referencia. La visibilidad se comparte con
el balance general y persiste por usuario al cerrar la aplicación. Cuando los
saldos están ocultos, también se ocultan los montos de la comparación mensual.
Al volver desde el detalle de un movimiento se actualizan los datos sin ocultar
temporalmente un saldo que ya era visible. La carga inicial permanece oculta
hasta leer la preferencia.
La comparación indica
el porcentaje de aumento o disminución, o comunica que todavía no hay una
referencia comparable. Si el saldo anterior era cero o negativo, la etiqueta
expresa la variación en pesos y evita un porcentaje engañoso. El saldo se
identifica como perteneciente a ese depósito; no es el balance general del
Dashboard. La información y el saldo actual se leen de SQLite local. Un ID que
no exista, esté inactivo o no pertenezca a la sesión muestra un error y permite
volver o reintentar. Si el depósito no tiene movimientos, aparece un estado
vacío.

Debajo del título «Movimientos» aparece una fila con el buscador y el botón
«Filtros» a su lado. El buscador tiene lupa, placeholder «Buscar» y una acción
para borrar el texto; solo toma el color de foco mientras está enfocado. Los
filtros abren una hoja superpuesta con manija y cierre. Las secciones Tipo,
Fecha, Categorías y Monto se pueden plegar y muestran un
resumen cuando están cerradas. Tipo ofrece Todos, Ingresos y Egresos en tres
opciones que comparten el ancho de la fila. Fecha ofrece Todo, Día, Semana, Mes
y Personalizado en una fila desplazable de opciones de ancho uniforme. Un
degradado suave en el borde indica si hay opciones fuera del área visible; sigue
el desplazamiento y desaparece en el extremo correspondiente. Incluye un
calendario en línea para elegir el día o los extremos del rango, y una grilla de
meses con navegación por año. Categorías
usa la grilla coloreada y multiselección de Movimientos, limitada a las
categorías presentes en el depósito y al tipo seleccionado. Monto permite
indicar mínimo y máximo en campos separados, con iconos y rótulos explícitos.
El panel se puede cerrar con el botón, tocando fuera o arrastrando la manija
hacia abajo.

La búsqueda y los filtros se aplican localmente a los movimientos reales del
depósito. La fecha incluye Todo, Día, Semana (lunes a domingo), Mes y
Personalizado; los demás filtros cubren tipo, categoría y rango de monto. Los
criterios activos aparecen debajo del buscador como chips que pueden quitarse;
«Limpiar todo» restablece la búsqueda y los filtros. El rótulo muestra el
número de criterios activos y el botón «Filtros» abre la hoja.
El detalle no muestra un filtro de depósitos porque la lista ya está limitada
al depósito seleccionado. Los resultados se agrupan por mes y año y se ordenan por
fecha y hora descendente.

Los meses usan `EncabezadoSeccionPlegable`, el mismo componente de Movimientos,
Social y Sincronización. El primer mes comienza abierto y los demás plegados;
cada uno se alterna de forma independiente. No hay encabezados diarios: la fecha
se muestra en cada tarjeta.

Cada tarjeta reutiliza `MovementCard.tsx`, igual que Inicio, Movimientos y
Detalle de categoría: descripción, día y tipo en el primer renglón; categoría,
depósito, hora e importe con signo en el segundo, con una franja de fondo suave
para el tipo y el importe. Al tocar una fila se abre el detalle
existente con la descripción del movimiento y sus datos. Los estados incluyen
carga, error, sin movimientos, sin resultados de búsqueda y sin resultados por
filtros.

El botón de opciones del depósito, ubicado en el encabezado de la tarjeta,
abre un modal centrado y compacto con título, descripción y cierre. Sus acciones
se presentan en una lista simple como las opciones de Perfil, con separador:
«Editar depósito» y «Eliminar depósito». Editar presenta un modal en la misma
pantalla que reutiliza la presentación y los controles del formulario de
creación: nombre, tipo, ícono, color y descripción, sin saldo inicial ni saldo
actual. «Cancelar» descarta el borrador y «Guardar cambios» valida y actualiza
SQLite; la tarjeta refleja los cambios de inmediato.

Eliminar abre una confirmación con el resumen del depósito, un aviso visual y
las acciones «Cancelar» y «Eliminar». Al confirmar, se marca `activo = 0`, se
conserva el historial de movimientos y se vuelve al Dashboard. Los depósitos
inactivos no aparecen en su lista.

La pantalla y sus modales usan el tema activo claro u oscuro, tokens de
`globalStyles.ts` y colores de `colors.ts`. No se añade una pantalla separada
para edición ni se modifica la navegación existente.


## Integración online y recurrencias

La [guía de la implementación](../arquitectura/social-online-recurrencias.md) define el contrato actual de categorías por gasto, identidades, conectividad, recurrencias y eliminación lógica.

## Recurrencias del depósito

El detalle tiene pestañas Movimientos y Recurrentes, con un contador de
programaciones. Comparten buscador, accesos rápidos de tipo, categoría e importe
y el panel de filtros de la pantalla Movimientos. El depósito queda fijado por contexto.
En Recurrentes los filtros de fecha se aplican a la próxima ejecución.
La pestaña Movimientos recurrentes muestra el total y todas las tarjetas sin plegarse.
Cada programación usa la apariencia de las tarjetas de movimientos e indica importe
y tiempo restante en el lugar donde una tarjeta habitual muestra la hora.
La frecuencia y los selectores de fecha y hora aparecen dentro del modal;
no se muestra el identificador técnico de zona horaria.
Los botones Editar programación, Pausar y Reactivar usan iconos y los estilos del proyecto.
El detalle de un movimiento recibe su ID para habilitar edición y eliminación
de registros vigentes, conservando las restricciones de transferencias y correcciones.

La programación no tiene un botón Cancelar separado: tocar Editar programación nuevamente cierra la edición sin guardar. Guardar programación modifica el importe y la fecha de los próximos registros, conservando los cobros anteriores.

## Opciones e historial recurrente

Al volver a entrar con datos de prueba, Billetera de prueba incluye «Streaming ·
recurrencia de prueba», con cinco cobros históricos por un total de $47.500 y
una próxima cuota de $12.000. Reentrar conserva las pausas y cambios de fecha
realizados sobre ese ejemplo. Sus fondos son ficticios y no cambian el saldo
neto de los ejemplos existentes.

Las tarjetas recurrentes reutilizan directamente los estilos de MovementCard. Tocar una abre un modal con importe, programación y acciones de edición, pausa o reactivación. El resumen acumulado reemplaza la lista de historial: Total gastado o Total recibido, veces registrado y, si cambió, variación del importe actual frente al primer importe registrado, en pesos y porcentaje. El primer importe se obtiene de la primera ejecución, incluso si después se elimina o corrige ese movimiento. El total excluye eliminados y correcciones; el contador conserva las ejecuciones realizadas. Las acciones y selectores quedan dentro del modal, sin botón Cancelar separado.


## Confirmación manual y claridad financiera

Las recurrencias vencidas se aceptan desde Depósito → Recurrentes o se desactivan;
no generan dinero automáticamente. La aceptación es única por fecha programada.
En salas cerradas se indica cuántos movimientos propios faltan incorporar y qué
gastos los originan. La incorporación local actualiza el aviso sin esperar la red.
Las acciones financieras bloquean otros envíos y cancelaciones mientras guardan;
solo el botón elegido muestra carga. Las deudas usan Te debe/Le debés mientras
haya pendiente, Saldada cuando se pagó todo y Perdonada si se perdonó el resto.
Cerrada corresponde a salas. Las propuestas rechazadas se retiran del destinatario
y se conserva el registro privado del creador. Deuda registrada integra el
movimiento de origen, sin repetir una fila Adelanto registrado ni otro cargo.

Prueba física pendiente: nueva APK en Android, funcionamiento sin red, apertura
tras fechas vencidas, doble toque, navegación Atrás y resumen después de aceptar.
La APK build 11 anterior no incluye estos cambios; no se generó otra en esta revisión.
