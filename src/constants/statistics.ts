export const PERIODOS_RESUMEN = Object.freeze([
  { id: 'dia', nombre: 'Día' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'mes', nombre: 'Mes' },
  { id: 'anio', nombre: 'Año' },
]);

export const MODOS_COLUMNAS = Object.freeze([
  { id: 'semana', nombre: 'Semana' },
  { id: 'anio', nombre: 'Año' },
]);

export const DIAS_SEMANA = Object.freeze(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
export const MESES = Object.freeze([
  { id: 0, corto: 'Ene', nombre: 'Enero' },
  { id: 1, corto: 'Feb', nombre: 'Febrero' },
  { id: 2, corto: 'Mar', nombre: 'Marzo' },
  { id: 3, corto: 'Abr', nombre: 'Abril' },
  { id: 4, corto: 'May', nombre: 'Mayo' },
  { id: 5, corto: 'Jun', nombre: 'Junio' },
  { id: 6, corto: 'Jul', nombre: 'Julio' },
  { id: 7, corto: 'Ago', nombre: 'Agosto' },
  { id: 8, corto: 'Sep', nombre: 'Septiembre' },
  { id: 9, corto: 'Oct', nombre: 'Octubre' },
  { id: 10, corto: 'Nov', nombre: 'Noviembre' },
  { id: 11, corto: 'Dic', nombre: 'Diciembre' },
]);
export const ANIO_ACTUAL = new Date().getFullYear();
export const ANIOS_DISPONIBLES = Object.freeze(Array.from({ length: 6 }, (_, indice) => ANIO_ACTUAL - indice));

