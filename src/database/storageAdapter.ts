/**
 * Define un contrato auxiliar de almacenamiento clave-valor.
 * Los datos relacionados de AHRE se guardan en SQLite mediante los repositorios.
 */
export function crearAdaptadorAlmacenamiento(adaptador: {getItem:(clave:string)=>Promise<string|null>;setItem:(clave:string,valor:string)=>Promise<void>;removeItem:(clave:string)=>Promise<void>}) {
  if (
    !adaptador ||
    typeof adaptador.getItem !== 'function' ||
    typeof adaptador.setItem !== 'function' ||
    typeof adaptador.removeItem !== 'function'
  ) {
    throw new Error('El adaptador local debe implementar getItem, setItem y removeItem.');
  }

  return {
    obtener: (clave: string) => adaptador.getItem(clave),
    guardar: (clave: string, valor: string) => adaptador.setItem(clave, valor),
    eliminar: (clave: string) => adaptador.removeItem(clave),
  };
}
