import type { LecturaOcr, LineaOcr } from '../../modules/receipt-ocr';

const PATRON_IMPORTE = /-?\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?/g;
const PATRON_FECHA = /\b(\d{4}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{1,2}|\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*(?:\d{4}|\d{2}))\b/g;
const PATRON_ETIQUETA_TOTAL = /\b(total a pagar|importe total|total final|total neto|total|importe)\b/;
const PATRON_EXCLUIDO = /\b(sub\s*total|total|importe|iva|impuestos?|tributos?|vuelto|cambio|efectivo|tarjeta|debito|credito|pago|pagado|descuento|bonificacion|cuit|cuil|cajero|caja|ticket|factura|comprobante|telefono|tel|domicilio|direccion|consumidor|responsable|ingresos brutos|cae|vencimiento|fecha|hora|gracias)\b/;

const normalizarTexto = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  // «TOTAL($)» puede llegar como «TOTALCS$)». Solo se corrige ante ese cierre
  // de moneda, para no convertir nombres como «Totalcare» en una etiqueta.
  .replace(/\btotal[cs]{1,2}(?=\s*\$?\s*\))/g, 'total');

const esEncabezadoProductos = (linea: string) => (
  (normalizarTexto(linea).match(/\b(descripcion|productos?|articulos?|cant(?:idad)?|precio|unitario|importe)\b/g) || []).length >= 2
);

export function interpretarImporteOcr(texto: string): number | null {
  let valor = texto.trim();
  if (!/^-?\d[\d.,]*$/.test(valor)) return null;
  const punto = valor.lastIndexOf('.');
  const coma = valor.lastIndexOf(',');
  const separador = Math.max(punto, coma);
  const decimales = separador < 0 ? 0 : valor.length - separador - 1;
  if (decimales > 0 && decimales <= 2) {
    valor = `${valor.slice(0, separador).replace(/[.,]/g, '')}.${valor.slice(separador + 1)}`;
  } else {
    valor = valor.replace(/[.,]/g, '');
  }
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

// ML Kit puede separar nombres e importes en bloques distintos. Se unen por fila.
export function reconstruirLineasOcr(resultado: LecturaOcr): string[] {
  const fragmentos = resultado.lineas?.filter((linea) => (
    linea.texto?.trim() && Number.isFinite(linea.y) && linea.alto > 0
  ));
  if (!fragmentos?.length) return (resultado.texto || '').split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean);

  const filas: { centro: number; alto: number; fragmentos: LineaOcr[]; }[] = [];
  [...fragmentos].sort((a, b) => a.y - b.y || a.x - b.x).forEach((fragmento) => {
    const centro = fragmento.y + fragmento.alto / 2;
    const fila = filas.find((actual) => (
      Math.abs(actual.centro - centro) <= Math.min(actual.alto, fragmento.alto) * 0.45
    ));
    if (fila) fila.fragmentos.push(fragmento);
    else filas.push({ centro, alto: fragmento.alto, fragmentos: [fragmento] });
  });
  return filas.map((fila) => fila.fragmentos.sort((a, b) => a.x - b.x).map(({ texto }) => texto.trim()).join(' '));
}

function detectarFecha(lineas: string[]) {
  const fechas: string[] = [];
  for (const linea of lineas) {
    if (/\b(vencimiento|vto|cae)\b/.test(normalizarTexto(linea))) continue;
    for (const [valor] of linea.matchAll(PATRON_FECHA)) {
      const partes = valor.split(/[-/.]/).map(Number);
      const [anioLeido, mes, dia] = partes[0] > 31 ? partes : [partes[2], partes[1], partes[0]];
      // Los tickets recientes con año corto se interpretan dentro de 2000–2099.
      const anio = anioLeido < 100 ? 2000 + anioLeido : anioLeido;
      const fecha = new Date(anio, mes - 1, dia);
      if (anio < 1900 || anio > 2100 || fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) continue;
      fechas.push(`${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`);
    }
  }
  const unicas = [...new Set(fechas)];
  return unicas.length === 1 ? unicas[0] : null;
}

function prioridadTotal(linea: string) {
  const texto = normalizarTexto(linea);
  if (esEncabezadoProductos(linea)) return 0;
  if (/\b(sub\s*total|iva|impuestos?|tributos?|vuelto|descuento|ahorro)\b/.test(texto)) return 0;
  if (/\b(total a pagar|importe total|total final|total neto)\b/.test(texto)) return 3;
  if (/\btotal\b/.test(texto)) return 2;
  if (/\bimporte\b/.test(texto)) return 1;
  return 0;
}

function detectarCandidatosMonto(lineas: string[]) {
  const candidatos: { monto: number; linea: string; prioridad: number; indice: number; }[] = [];
  lineas.forEach((linea, indice) => {
    const prioridad = prioridadTotal(linea);
    if (!prioridad) return;
    // Solo se busca en la misma fila o, si está vacía, en la siguiente fila numérica.
    const etiqueta = normalizarTexto(linea).match(PATRON_ETIQUETA_TOTAL);
    const textoImporte = linea.slice(etiqueta!.index! + etiqueta![0].length);
    // Un contador como «01 ART.» anterior a TOTAL no es un segundo importe.
    let numeros = [...textoImporte.matchAll(PATRON_IMPORTE)];
    if (!numeros.length && /^\s*\$?\s*[\d.,]+\s*$/.test(lineas[indice + 1] || '')) {
      numeros = [...lineas[indice + 1].matchAll(PATRON_IMPORTE)];
    }
    if (numeros.length !== 1) return;
    const monto = interpretarImporteOcr(numeros[0][0]);
    if (monto !== null) candidatos.push({ monto, linea, prioridad, indice });
  });
  return candidatos;
}

function detectarHora(lineas: string[]) {
  const horas = lineas.flatMap((linea) => [...linea.matchAll(/\bhora\s*:?\s*((?:[01]?\d|2[0-3]):[0-5]\d)\b/gi)]
    .map((coincidencia) => coincidencia[1].padStart(5, '0')));
  const unicas = [...new Set(horas)];
  return unicas.length === 1 ? unicas[0] : null;
}

function esInformacionAdministrativa(linea: string) {
  return PATRON_EXCLUIDO.test(normalizarTexto(linea)) || esEncabezadoProductos(linea)
    || /\b(ruta|calle|avenida|nro|codigo postal|datos almacenados)\b/.test(normalizarTexto(linea))
    || /^(?:t|und|pv|pto\.?(?: de venta)?)\s*:/i.test(linea)
    || /\d{1,4}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{2,4}/.test(linea);
}

function detectarProductos(lineas: string[], comercio: string | null) {
  const productos: string[] = [];
  let nombresPendientes: string[] = [];
  let dentroTabla = false;
  for (const linea of lineas) {
    // El total cierra el detalle aun cuando el importe todavía sea ambiguo.
    if (prioridadTotal(linea)) break;
    if (esEncabezadoProductos(linea)) {
      dentroTabla = true;
      nombresPendientes = [];
      continue;
    }
    if (linea === comercio || esInformacionAdministrativa(linea)) {
      nombresPendientes = [];
      continue;
    }
    const tieneImporte = /\d[.,]\d{2}\b|\$\s*\d|\d\s*\$/.test(linea)
      || (dentroTabla && /\d\s*$/.test(linea));
    const valoresSinUnidades = linea.replace(/(\d)(?=[a-z])/gi, '$1 ')
      .replace(/\b(?:kg|k9|gr?|ml|lts?|un|und|uds|ars|pesos)\b/gi, '');
    const soloValores = /^[\d\s.,xX×$S/()+%-]+$/.test(valoresSinUnidades);
    if (tieneImporte && (soloValores || /[\p{L}]{2}/u.test(linea))) {
      productos.push([...nombresPendientes, linea].join(' — '));
      nombresPendientes = [];
    } else if (/[\p{L}]{3}/u.test(linea) && !tieneImporte) {
      // Hasta dos líneas de nombre para productos con descripción partida.
      nombresPendientes = [...nombresPendientes, linea].slice(-2);
    } else {
      nombresPendientes = [];
    }
  }
  return productos;
}

export function prepararItemsComprobante(productos: string[]) {
  return productos.map(linea => {
    const importes = [...linea.matchAll(/\$?\s*-?\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?/g)];
    const ultimo = importes.at(-1);
    const terminaEnImporte = ultimo && !linea.slice(ultimo.index + ultimo[0].length).replace(/[$Ss\s]/g, '');
    const monto = terminaEnImporte ? interpretarImporteOcr(ultimo[0].replace(/[$\s]/g, '')) : null;
    const descripcion = monto ? linea.slice(0, ultimo!.index).replace(/[\s—x×$]+$/, '').trim() : linea.trim();
    return { descripcion: descripcion || linea.trim(), monto };
  });
}

export function interpretarComprobante(resultado: LecturaOcr) {
  const lineas = reconstruirLineasOcr(resultado);
  const lineasOriginales = (resultado.texto || '').split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean);
  const candidatosGeometricos = detectarCandidatosMonto(lineas);
  // El texto original sigue siendo útil si la agrupación geométrica separó una etiqueta.
  const candidatos = candidatosGeometricos.length ? candidatosGeometricos : detectarCandidatosMonto(lineasOriginales);
  const prioridadMaxima = Math.max(0, ...candidatos.map(({ prioridad }) => prioridad));
  const preferidos = candidatos.filter(({ prioridad }) => prioridad === prioridadMaxima);
  const montos = [...new Set(preferidos.map(({ monto }) => monto))];
  const monto = montos.length === 1 ? montos[0] : null;
  const comercio = lineas.slice(0, 5).find((linea, indice) => (
    /[\p{L}]{3}/u.test(linea) && !/\d[.,]\d{2}|\$/.test(linea) && !esInformacionAdministrativa(linea)
    && !/^[\d\s.,xX×$]+\d[.,]\d{2}\s*$/.test(lineas[indice + 1] || '')
  )) || null;
  const productosGeometricos = detectarProductos(lineas, comercio);
  const productos = productosGeometricos.length ? productosGeometricos : detectarProductos(lineasOriginales, comercio);
  return {
    monto,
    fecha: detectarFecha([...lineas, ...lineasOriginales]),
    hora: detectarHora([...lineas, ...lineasOriginales]),
    comercio,
    productos,
    items: prepararItemsComprobante(productos),
    descripcion: [comercio, ...productos].filter(Boolean).join('\n'),
    candidatosMonto: candidatos,
    lineas,
  };
}
