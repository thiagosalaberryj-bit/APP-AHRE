import { crearRepositorio } from './repositoryFactory';

export const preferenciasRepositorio = crearRepositorio({
  tabla: 'preferencias',
  campos: [
    'usuario_id',
    'deposito_predeterminado_id',
    'notificaciones_activas',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposFiltrables: ['usuario_id', 'deposito_predeterminado_id', 'notificaciones_activas'],
  camposOrdenables: ['fecha_creacion', 'fecha_actualizacion'],
  ordenPredeterminado: 'fecha_creacion',
});
