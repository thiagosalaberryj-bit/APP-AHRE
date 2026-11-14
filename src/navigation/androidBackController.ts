// Compartido entre pantallas para absorber otro Atrás durante el cambio de foco.
export function crearControlRegresoAndroid(ahora: () => number = Date.now) {
  let protegerHasta = -Infinity;
  return {
    registrarRegreso() { protegerHasta = ahora() + 400; },
    manejar({ enfocada, bloqueada, puedeVolver, volver }: {
      enfocada: boolean; bloqueada: boolean; puedeVolver: boolean; volver: () => void;
    }) {
      if (!enfocada) return false;
      if (bloqueada || ahora() < protegerHasta) return true;
      if (!puedeVolver) return false;
      volver();
      return true;
    },
  };
}
export const controlRegresoAndroid = crearControlRegresoAndroid();
