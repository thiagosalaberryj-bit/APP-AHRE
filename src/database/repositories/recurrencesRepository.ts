import { crearRepositorio } from './repositoryFactory';

export const recurrenciasRepositorio = crearRepositorio({
  tabla: 'recurrencias',
  campos: [
    'deposito_id',
    'categoria',
    'tipo',
    'monto',
    'descripcion',
    'frecuencia',
    'fecha_inicio',
    'fecha_fin',
    'proxima_ejecucion',
    'activa',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['categoria', 'descripcion'],
  camposFiltrables: ['deposito_id', 'categoria', 'tipo', 'frecuencia', 'activa'],
  camposOrdenables: ['proxima_ejecucion', 'fecha_inicio', 'fecha_creacion'],
  ordenPredeterminado: 'proxima_ejecucion',
  eliminacion: { campo: 'activa', valor: 0 },
});
