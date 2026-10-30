import { crearRepositorio } from './repositoryFactory';

export const personasSalaRepositorio = crearRepositorio({
  tabla: 'personas_sala',
  campos: ["usuario_id","sala_id","persona_id","activa","fecha_alta","fecha_baja"],
  camposFiltrables: ["usuario_id","sala_id","persona_id","activa"],
  ordenPredeterminado: 'id',
});
