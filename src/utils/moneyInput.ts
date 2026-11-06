type SeleccionMonto = { start: number; end: number };

/** Formatea texto local sin convertirlo a Number ni perder centavos o precisión. */
export function formatearEntradaMonto(valor: string) {
  const limpio = valor.replace(/[.\s$]/g, '');
  if (!/^\d*(?:,\d{0,2})?$/.test(limpio) || !limpio) return valor;
  const [entero, decimales] = limpio.split(',');
  const agrupado = (entero || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return agrupado + (decimales === undefined ? '' : `,${decimales}`);
}

/** Devuelve texto sin separadores de miles y conserva la posición lógica del cursor. */
export function editarEntradaMonto(anterior: string, texto: string, seleccion: SeleccionMonto) {
  const cantidadInsertada = texto.length - anterior.length + seleccion.end - seleccion.start;
  const insertado = texto.slice(seleccion.start, seleccion.start + cantidadInsertada);
  // Algunos teclados decimales entregan punto aun con la aplicación en español.
  if (insertado === '.') {
    texto = texto.slice(0, seleccion.start) + ',' + texto.slice(seleccion.start + 1);
  } else if (cantidadInsertada > 1 && insertado.includes('.')) {
    const pegado = insertado.replace(/[\s$]/g, '');
    if (!/^\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?$/.test(pegado)) return null;
  }
  let cursor = Math.max(0, Math.min(texto.length, seleccion.end + texto.length - anterior.length));
  // Al borrar un punto automático también se borra el dígito vecino: el cursor no se traba.
  if (seleccion.start === seleccion.end && texto.length === anterior.length - 1) {
    const atras = seleccion.start - 1;
    if (anterior[atras] === '.' && texto === anterior.slice(0, atras) + anterior.slice(atras + 1)) {
      texto = anterior.slice(0, atras - 1) + anterior.slice(atras + 1);
      cursor = atras - 1;
    } else if (anterior[seleccion.start] === '.' && texto === anterior.slice(0, seleccion.start) + anterior.slice(seleccion.start + 1)) {
      texto = anterior.slice(0, seleccion.start) + anterior.slice(seleccion.start + 2);
      cursor = seleccion.start;
    }
  }
  let valor = texto.replace(/[.\s$]/g, '');
  if (!/^\d*(?:,\d{0,2})?$/.test(valor)) return null;
  let posicionLogica = texto.slice(0, cursor).replace(/[.\s$]/g, '').length;
  if (valor.startsWith(',')) {
    valor = `0${valor}`;
    posicionLogica++;
  }
  const formateado = formatearEntradaMonto(valor);
  let posicion = 0;
  for (let leidos = 0; posicion < formateado.length && leidos < posicionLogica; posicion++) {
    if (formateado[posicion] !== '.') leidos++;
  }
  return { valor, formateado, seleccion: { start: posicion, end: posicion } };
}
