/**
 * Define el contrato que utilizará la aplicación para el almacenamiento local.
 * La implementación concreta podrá ser AsyncStorage, SQLite u otra solución
 * compatible con Expo sin acoplarla a las pantallas.
 */
export function createStorageAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter.getItem !== 'function' ||
    typeof adapter.setItem !== 'function' ||
    typeof adapter.removeItem !== 'function'
  ) {
    throw new Error('El adaptador local debe implementar getItem, setItem y removeItem.');
  }

  return {
    get: (key) => adapter.getItem(key),
    set: (key, value) => adapter.setItem(key, value),
    remove: (key) => adapter.removeItem(key),
  };
}
