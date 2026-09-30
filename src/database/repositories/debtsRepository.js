import { crearRepositorio } from './repositoryFactory';

export const deudasRepositorio = crearRepositorio({
  tabla: 'deudas',
  campos: [
    'usuario_id',
    'persona_id',
    'gasto_compartido_id',
    'tipo',
    'monto',
    'descripcion',
    'fecha',
    'fecha_vencimiento',
    'estado',
    'movimiento_id',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['descripcion'],
  camposFiltrables: ['usuario_id', 'persona_id', 'gasto_compartido_id', 'tipo', 'estado', 'movimiento_id'],
  camposOrdenables: ['fecha', 'fecha_vencimiento', 'monto', 'estado', 'fecha_creacion'],
  ordenPredeterminado: 'fecha',
  eliminacion: { campo: 'estado', valor: 'cancelada' },
});
