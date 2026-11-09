type Medir = (recibir: (x: number, y: number, ancho: number, alto: number) => void) => void;
export interface CandidatoCarga { clave: string; medir: Medir; cargar: () => void; }

// Solo un desplazamiento intencional hacia abajo puede disparar una carga.
// Medir la posición real evita usar la altura del contenido como aproximación.
export function crearCargaVisible(medirVista: Medir, candidatos: () => CandidatoCarga[]) {
  let activo = false, ultimoY = 0, revision = 0, finArrastre = -Infinity, midiendo = false;
  return {
    iniciar(y: number) { activo = true; ultimoY = y; midiendo = false; revision++; },
    terminarArrastre() { activo = false; midiendo = false; finArrastre = Date.now(); revision++; },
    iniciarInercia() { activo = Date.now() - finArrastre < 250; },
    terminar() { activo = false; midiendo = false; finArrastre = -Infinity; revision++; },
    desplazar(y: number) {
      const haciaAbajo = y > ultimoY + 0.5;
      ultimoY = y;
      if (!activo || !haciaAbajo) { revision++; midiendo = false; return; }
      if (midiendo) return;
      const actual = revision;
      const disponibles = candidatos();
      if (!disponibles.length) return;
      midiendo = true;
      medirVista((_x, inicio, _ancho, alto) => {
        if (revision !== actual) return;
        if (alto <= 0) { midiendo = false; return; }
        let pendientes = disponibles.length;
        for (const candidato of disponibles) candidato.medir((_bx, posicion, _ba, altura) => {
          if (revision === actual && --pendientes === 0) midiendo = false;
          if (!activo || revision !== actual || altura <= 0 || posicion >= inicio + alto || posicion + altura <= inicio) return;
          if (candidatos().some(vigente => vigente.clave === candidato.clave)) candidato.cargar();
        });
      });
    },
  };
}
