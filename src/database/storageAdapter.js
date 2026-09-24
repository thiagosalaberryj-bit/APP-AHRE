/**
 * Define el contrato que utilizará la aplicación para el almacenamiento local.
 * La implementación concreta podrá ser AsyncStorage, SQLite u otra solución
 * compatible con Expo sin acoplarla a las pantallas.
 */
export function crearAdaptadorAlmacenamiento(adaptador) {
  if (
    !adaptador ||
    typeof adaptador.getItem !== 'function' ||
    typeof adaptador.setItem !== 'function' ||
    typeof adaptador.removeItem !== 'function'
  ) {
    throw new Error('El adaptador local debe implementar getItem, setItem y removeItem.');
  }

  return {
    obtener: (clave) => adaptador.getItem(clave),
    guardar: (clave, valor) => adaptador.setItem(clave, valor),
    eliminar: (clave) => adaptador.removeItem(clave),
  };
}
