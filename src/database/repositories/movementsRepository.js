import { crearRepositorio } from './repositoryFactory';

export const movimientosRepositorio = crearRepositorio({
  tabla: 'movimientos',
  campos: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'monto',
    'descripcion',
    'fecha_hora',
    'anulado',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['categoria', 'descripcion'],
  camposFiltrables: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'anulado',
  ],
  camposOrdenables: ['fecha_hora', 'tipo', 'categoria', 'monto', 'fecha_creacion'],
  ordenPredeterminado: 'fecha_hora',
  eliminacion: { campo: 'anulado', valor: 1 },
});
