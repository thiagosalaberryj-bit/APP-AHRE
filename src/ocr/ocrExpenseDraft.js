export function prepararEgresoReconocido(resultado, ahora = new Date()) {
  let fecha = new Date(ahora);
  if (resultado.fecha) {
    const [dia, mes, anio] = resultado.fecha.split('/').map(Number);
    fecha = new Date(anio, mes - 1, dia);
  }
  return {
    monto: resultado.monto == null ? '' : resultado.monto.toFixed(2).replace('.', ','),
    descripcion: resultado.descripcion || '',
    fecha,
    hora: resultado.hora || `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
    categoria: null,
    deposito_id: null,
    recurrente: false,
  };
}
