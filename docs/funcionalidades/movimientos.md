# Registro local de ingresos

## Alcance

La pantalla existente de Ingreso crea movimientos de tipo `ingreso` en la base
SQLite local. El flujo no utiliza Internet ni un backend y conserva la
separación entre pantalla, lógica de dominio y repositorios.

```text
Dashboard → Ingreso → cargar depósitos y categorías → validar → guardar
movimiento → actualizar saldo → volver a la pantalla anterior
```

## Depósitos y categorías

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
esa transacción. Si alguna escritura falla, no queda el movimiento incompleto
ni se modifica parcialmente el saldo.

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

- `src/screens/IncomeScreen.js`: formulario, estados visuales, navegación y
  coordinación del guardado;
- `src/movements/incomeService.js`: carga de datos, comprobación de sesión y
  creación atómica del ingreso;
- `src/utils/movementValidation.js`: normalización de montos, fecha/hora y
  validaciones reutilizables;
- `src/database/repositories/movementsRepository.js`: movimiento, impacto del
  saldo y reglas de categorías;
- `src/database/repositories/depositsRepository.js`: depósitos y saldo actual;
- `src/database/repositories/recurrencesRepository.js`: recurrencias locales;
- `src/database/repositories/categoriesRepository.js`: catálogo local de
  categorías de ingreso.

## Funcionamiento offline

La pantalla usa exclusivamente SQLite, SecureStore a través de la sesión local,
catálogos internos y componentes de la aplicación. No realiza solicitudes de
red y puede utilizarse en modo avión.
