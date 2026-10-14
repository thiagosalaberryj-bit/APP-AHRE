# Registro local de ingresos y egresos

## Alcance

Las pantallas existentes de Ingreso y Egreso usan el formulario compartido para
crear movimientos en la base SQLite local. El flujo no utiliza Internet ni un
backend y conserva la separación entre pantalla, lógica de dominio y
repositorios. La pantalla define el tipo (`ingreso` o `egreso`), y el servicio
común carga el catálogo correspondiente y guarda el movimiento.

```text
Dashboard → Ingreso o Egreso → cargar depósitos y categorías → validar → guardar
movimiento → actualizar saldo → volver a la pantalla anterior
```

## Ingreso: depósitos y categorías

Al abrir la pantalla se consulta la sesión local y se cargan únicamente los
depósitos activos del usuario actual. El formulario trabaja con
`deposito_id`, no con el nombre visible. Al regresar desde Nuevo depósito, la
pantalla vuelve a consultar SQLite para incorporar el depósito recién creado.

Si no existen depósitos, no se muestra el formulario de guardado. Se presenta
el estado «Todavía no tenés depósitos» junto con el acceso a Nuevo depósito.
Así no es posible crear un ingreso con `deposito_id` nulo. Antes de guardar se
vuelve a comprobar que el depósito exista, pertenezca al usuario y permanezca
activo.

Las categorías de ingreso se obtienen mediante `categoriasRepositorio`, que
centraliza el catálogo local predefinido de AHRE. La pantalla no declara un
catálogo propio. La categoría se valida otra vez al crear el movimiento.

## Validaciones

- el monto es obligatorio, mayor que cero y admite la representación local con
  punto de miles y coma decimal;
- el monto se convierte a número antes de guardarse, sin `$` ni formato visual;
- la descripción es obligatoria, se recortan sus espacios externos y admite
  hasta 500 caracteres;
- depósito y categoría son obligatorios y deben seguir disponibles;
- fecha y hora se combinan y se normalizan a una fecha ISO consistente;
- la frecuencia se valida cuando el ingreso es recurrente.

Los errores se muestran junto a los campos y el toast resume que deben
revisarse. Después del primer intento, se recalculan al editar o limpiar los
campos, como en Nuevo depósito: un valor que sigue inválido conserva su error.
Los fallos de consulta o guardado se informan sin exponer detalles
de SQLite.

## Recurrencia y saldo

Un ingreso normal se guarda con `tipo = 'ingreso'`. Cuando se activa
«Recurrente», se crea además una fila en `recurrencias` con depósito, categoría,
monto, descripción, frecuencia y próxima ejecución. La ejecución automática de
recurrencias queda fuera de este alcance.

El movimiento y la recurrencia se crean dentro de la misma transacción. El
repositorio de movimientos suma el monto a `depositos.saldo_actual` dentro de
esa transacción, siempre que la fecha y hora del movimiento sean iguales o
posteriores a `depositos.fecha_creacion`. Si son anteriores, el movimiento se
conserva en el historial y no modifica el saldo actual. La regla también se
aplica al editar movimientos y a sus reversiones. Si alguna escritura falla, no
queda el movimiento incompleto ni se modifica parcialmente el saldo.

## Estados y navegación

Mientras se cargan depósitos y categorías se muestra un estado de carga. Si
falla una consulta se ofrece reintentar. Mientras se guarda, el botón queda en
estado de procesamiento y una referencia interna evita inserciones repetidas
por pulsaciones múltiples. Los controles del formulario se bloquean durante
el guardado.

El formulario conserva el ancho y el espaciado de Egreso: el padding se aplica
una sola vez en el contenedor del formulario, sin un margen exterior adicional
en el ScrollView. Los estados de carga, error y ausencia de depósitos conservan
su propio espacio y se centran en el área disponible. Al desplazar el contenido
se descarta el teclado, como en Nuevo depósito.

Al guardar correctamente se muestra una confirmación y se vuelve a la pantalla
anterior. La flecha del encabezado permite cancelar; cancelar no llama al
servicio ni escribe en SQLite.

## Archivos involucrados

- `src/screens/IncomeScreen.js`: formulario compartido, estados visuales,
  navegación y coordinación del guardado;
- `src/movements/movementService.js`: carga de datos, comprobación de sesión y
  creación atómica del ingreso o egreso;
- `src/utils/movementValidation.js`: normalización de montos, fecha/hora y
  validaciones reutilizables;
- `src/database/repositories/movementsRepository.js`: movimiento, impacto del
  saldo y reglas de categorías;
- `src/database/repositories/depositsRepository.js`: depósitos y saldo actual;
- `src/database/repositories/recurrencesRepository.js`: recurrencias locales;
- `src/database/repositories/categoriesRepository.js`: catálogos locales de
  categorías de ingreso y egreso.

## Funcionamiento offline

La pantalla usa exclusivamente SQLite, SecureStore a través de la sesión local,
catálogos internos y componentes de la aplicación. No realiza solicitudes de
red y puede utilizarse en modo avión.

## Registro de egresos

Egreso reutiliza `FormularioMovimiento` y los mismos selectores, validaciones,
repositorios y estilos que Ingreso. `ExpenseScreen.js` solo configura el tipo
`egreso`; no mantiene catálogos de muestra ni una lógica de guardado paralela.

Al abrirse, el servicio consulta la sesión local y carga los depósitos activos
del usuario junto con `categoriasRepositorio.consultar('egreso')`. Las
categorías son el catálogo local definido por AHRE en constantes; no existe una
tabla de categorías en SQLite. El formulario guarda el identificador
`deposito_id`, además del identificador de categoría, y comprueba al guardar que
el depósito todavía exista, pertenezca al usuario y esté activo.

Cuando el usuario no tiene depósitos, el formulario oculta el botón de guardado
y muestra «Todavía no tenés depósitos» con el acceso a Nuevo depósito. Al
regresar, `useFocusEffect` vuelve a consultar los datos locales y carga el
depósito que se acaba de crear. Así no se puede registrar un egreso sin una
relación válida.

El monto es obligatorio, debe ser mayor que cero y se guarda como número
positivo. La descripción se recorta, es obligatoria y admite hasta 500
caracteres. El depósito, la categoría, la fecha y la hora también deben ser
válidos. La fecha y la hora se combinan con `combinarFechaYHora()` y se guardan
en `fecha_hora` como ISO 8601, igual que en Ingreso.

El movimiento se guarda con `tipo = 'egreso'`. Si el usuario activa
«Recurrente», el servicio crea una fila de `recurrencias` con el mismo tipo,
depósito, categoría, monto, descripción, frecuencia y fecha de inicio, y la
relaciona mediante `recurrencia_id`. Se usan las frecuencias que ya admite el
modelo (`diaria`, `semanal`, `mensual` y `anual`); su ejecución automática no
forma parte de este flujo.

### Política de saldo insuficiente

El esquema permite que `depositos.saldo_actual` sea negativo: la columna no
tiene una restricción de saldo mínimo y el repositorio aplica la variación del
movimiento directamente. Por eso AHRE permite registrar un egreso superior al
saldo disponible y deja el saldo resultante en negativo. El monto del egreso
sigue siendo positivo; el tipo determina que se reste del saldo.

El servicio crea, dentro de una única transacción SQLite, la recurrencia cuando
corresponde y el movimiento. `movimientosRepositorio` resta el monto del
`saldo_actual` en esa misma transacción si su fecha y hora no son anteriores a
la creación del depósito. Si el movimiento está fechado antes de
`depositos.fecha_creacion`, permanece en el historial, pero no cambia el saldo.
La misma regla se aplica a las transferencias y reversiones. Un error revierte
todas las escrituras y no deja registros parciales. La pantalla bloquea los
controles mientras guarda y una referencia interna impide iniciar otro
guardado por una pulsación repetida. Al terminar correctamente muestra una
confirmación y vuelve a la pantalla anterior; la flecha permite cancelar sin
escribir en la base.

### Archivos reutilizados

- `src/screens/IncomeScreen.js`: contiene `FormularioMovimiento`, compartido por
  Ingreso y Egreso;
- `src/screens/ExpenseScreen.js`: configura el formulario existente como
  egreso;
- `src/movements/movementService.js`: consulta depósitos y categorías locales,
  valida sus relaciones y crea el movimiento y la recurrencia;
- `src/utils/movementValidation.js`: valida el monto, la descripción, el
  depósito, la categoría, la fecha, la hora y la frecuencia;
- `src/database/repositories/movementsRepository.js`: persiste el movimiento y
  actualiza el saldo dentro de la transacción;
- `src/database/repositories/depositsRepository.js`,
  `src/database/repositories/categoriesRepository.js` y
  `src/database/repositories/recurrencesRepository.js`: consultan los datos
  locales relacionados.

El formulario solo usa SQLite, la sesión local, catálogos internos y
componentes de AHRE. Funciona sin conexión a Internet.
