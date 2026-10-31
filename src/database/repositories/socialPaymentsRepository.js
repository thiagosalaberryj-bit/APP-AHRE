import { crearRepositorio } from './repositoryFactory';

export const pagosSocialesRepositorio = crearRepositorio({
  tabla: 'pagos_sociales',
  campos: ["usuario_id","clase","gasto_compartido_id","participante_gasto_id","deuda_id","monto","fecha","descripcion","movimiento_id","clave_operacion","estado","fecha_anulacion","fecha_creacion","fecha_actualizacion"],
  camposFiltrables: ["usuario_id","clase","gasto_compartido_id","participante_gasto_id","deuda_id","clave_operacion","estado","movimiento_id"],
  ordenPredeterminado: 'id',
});
