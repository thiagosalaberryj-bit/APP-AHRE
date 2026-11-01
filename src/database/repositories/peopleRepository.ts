import { crearRepositorio } from './repositoryFactory';

export const personasRepositorio = crearRepositorio({
  tabla: 'personas',
  campos: ["usuario_id","nombre","apellido","apodo","nombre_normalizado","apellido_normalizado","apodo_normalizado","correo_electronico","es_usuario_actual","activa","fecha_creacion","fecha_actualizacion"],
  camposFiltrables: ["usuario_id","activa","es_usuario_actual"],
  ordenPredeterminado: 'id',
  eliminacion: {"campo":"activa","valor":0},
});
