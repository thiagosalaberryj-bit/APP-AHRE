import { crearRepositorio } from './repositoryFactory';

export const participantesGastoRepositorio = crearRepositorio({
  tabla: 'participantes_gasto',
  campos: ["usuario_id","gasto_compartido_id","persona_id","monto_correspondiente","orden"],
  camposFiltrables: ["usuario_id","gasto_compartido_id","persona_id"],
  ordenPredeterminado: 'id',
});
