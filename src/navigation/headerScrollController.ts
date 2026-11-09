export interface EstadoEncabezado { desplegado: boolean; desplazado: boolean; }

export function crearControlEncabezado(alCambiar: (estado: EstadoEncabezado) => void, alSubir: () => void) {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  let ultimoY = 0, gesto = false, eleccionManual = false, regresando = false, finArrastre = -Infinity;
  const actualizar = (siguiente: EstadoEncabezado) => {
    if (estado.desplegado === siguiente.desplegado && estado.desplazado === siguiente.desplazado) return;
    estado = siguiente; alCambiar(estado);
  };
  return {
    iniciarArrastre(y: number) { ultimoY = Math.max(0, y); gesto = true; eleccionManual = false; regresando = false; },
    terminarArrastre() { gesto = false; finArrastre = Date.now(); },
    iniciarInercia() { gesto = Date.now() - finArrastre < 250; },
    terminarMovimiento() { gesto = false; finArrastre = -Infinity; },
    desplazar(posicion: number, altoContenido?: number, altoVista?: number) {
      const maximo = altoContenido !== undefined && altoVista !== undefined ? Math.max(0, altoContenido - altoVista) : Infinity;
      const y = Math.max(0, Math.min(posicion, maximo)), bajando = y > ultimoY + 2;
      ultimoY = y;
      if (y <= 8) {
        regresando = false; eleccionManual = false;
        actualizar({ desplegado: true, desplazado: false }); return;
      }
      if (regresando) return;
      const desplazado = estado.desplazado || y > 144;
      actualizar({ desplazado, desplegado: desplazado && gesto && bajando && !eleccionManual ? false : estado.desplegado });
    },
    alternar() {
      if (!estado.desplazado) return;
      eleccionManual = true;
      actualizar({ ...estado, desplegado: !estado.desplegado });
    },
    volverArriba() {
      gesto = false; finArrastre = -Infinity; regresando = true; eleccionManual = false;
      actualizar({ desplegado: true, desplazado: false }); alSubir();
    },
  };
}
