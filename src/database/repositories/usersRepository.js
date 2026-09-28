import { crearRepositorio } from './repositoryFactory';

export const usuariosRepositorio = crearRepositorio({
  tabla: 'usuarios',
  campos: ['nombre', 'correo_electronico', 'activo', 'fecha_creacion', 'fecha_actualizacion'],
  camposBusqueda: ['nombre', 'correo_electronico'],
  camposFiltrables: ['activo', 'correo_electronico'],
  camposOrdenables: ['nombre', 'fecha_creacion', 'fecha_actualizacion'],
  ordenPredeterminado: 'fecha_creacion',
  eliminacion: { campo: 'activo', valor: 0 },
});
