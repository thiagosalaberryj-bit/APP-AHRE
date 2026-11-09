// Deja confirmar el estado de carga y dibujar un cuadro antes de preparar filas.
export function esperarDibujo() {
  return new Promise<void>(resolver => requestAnimationFrame(() => requestAnimationFrame(() => resolver())));
}
