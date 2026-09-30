import { crearRepositorio } from './repositoryFactory';

export const personasRepositorio = crearRepositorio({
  tabla: 'personas',
  campos: [
    'usuario_id',
    'nombre',
    'correo_electronico',
    'es_usuario_actual',
    'activa',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['nombre', 'correo_electronico'],
  camposFiltrables: ['usuario_id', 'es_usuario_actual', 'activa'],
  camposOrdenables: ['nombre', 'fecha_creacion', 'fecha_actualizacion'],
  ordenPredeterminado: 'nombre',
  eliminacion: { campo: 'activa', valor: 0 },
});
