/**
 * Define un contrato auxiliar de almacenamiento clave-valor.
 * Los datos relacionados de AHRE se guardan en SQLite mediante los repositorios.
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
