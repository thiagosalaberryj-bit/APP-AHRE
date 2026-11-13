export interface EstadoEncabezado { desplegado: boolean; desplazado: boolean; }

export function crearControlEncabezado(alCambiar: (estado: EstadoEncabezado) => void, alSubir: () => void) {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  let ultimoY = 0, gesto = false, eleccionManual = false, regresando = false, finArrastre = -Infinity;
  let enTransicion = false, bajada = 0, subida = 0, ultimaVista: number | undefined;
  const actualizar = (siguiente: EstadoEncabezado) => {
    if (estado.desplegado === siguiente.desplegado && estado.desplazado === siguiente.desplazado) return;
    enTransicion = true; estado = siguiente; alCambiar(estado);
  };
  return {
    iniciarArrastre(y: number) {
      ultimoY = Math.max(0, y); bajada = 0; subida = 0; gesto = true; eleccionManual = false; regresando = false;
      if (ultimoY <= 8 && !enTransicion) actualizar({ desplegado: true, desplazado: false });
    },
    terminarTransicion() { enTransicion = false; bajada = 0; subida = 0; },
    terminarArrastre() { gesto = false; finArrastre = Date.now(); },
    iniciarInercia() { gesto = Date.now() - finArrastre < 250; },
    terminarMovimiento() { gesto = false; finArrastre = -Infinity; },
    desplazar(posicion: number, altoContenido?: number, altoVista?: number) {
      const maximo = altoContenido !== undefined && altoVista !== undefined ? Math.max(0, altoContenido - altoVista) : Infinity;
      const y = Math.max(0, Math.min(posicion, maximo)), diferencia = y - ultimoY;
      const cambioVista = ultimaVista !== undefined && altoVista !== undefined && Math.abs(ultimaVista - altoVista) > 0.5;
      if (altoVista !== undefined) ultimaVista = altoVista;
      ultimoY = y;
      if (enTransicion || cambioVista) return;
      if (gesto) {
        if (diferencia > 0) { bajada += diferencia; if (diferencia > 1) subida = 0; }
        if (diferencia < 0) { subida -= diferencia; if (diferencia < -1) bajada = 0; }
      }
      if (y <= 8 && (!estado.desplazado || regresando || gesto && subida >= 8)) {
        regresando = false; eleccionManual = false;
        actualizar({ desplegado: true, desplazado: false }); return;
      }
      if (regresando) return;
      const desplazado = estado.desplazado || y > 144;
      actualizar({ desplazado, desplegado: desplazado && gesto && bajada >= 8 && !eleccionManual ? false : estado.desplegado });
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
