import { crearRepositorio } from './repositoryFactory';

export const salasRepositorio = crearRepositorio({
  tabla: 'salas',
  campos: ["usuario_id","nombre","descripcion","categoria","icono","color","fecha","estado","fecha_cierre","fecha_creacion","fecha_actualizacion"],
  camposFiltrables: ["usuario_id","estado"],
  ordenPredeterminado: 'id',
});
