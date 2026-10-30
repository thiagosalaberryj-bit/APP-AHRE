import { crearRepositorio } from './repositoryFactory';

export const deudasRepositorio = crearRepositorio({
  tabla: 'deudas',
  campos: ["usuario_id","deudor_id","acreedor_id","participante_gasto_id","monto","descripcion","fecha","fecha_vencimiento","estado","fecha_cancelacion","motivo_cancelacion","fecha_creacion","fecha_actualizacion"],
  camposFiltrables: ["usuario_id","estado","participante_gasto_id"],
  ordenPredeterminado: 'id',
});
