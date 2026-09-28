import { ejecutarConManejoDeErrores, ErrorBaseDatos } from '../errors';
import { ejecutarConConexion } from '../connectionQueue';
import { crearRepositorio } from './repositoryFactory';

const repositorioParticipantes = crearRepositorio({
  tabla: 'participantes_gasto',
  campos: ['gasto_compartido_id', 'persona_id', 'monto_correspondiente', 'deuda_id'],
  camposFiltrables: ['gasto_compartido_id', 'persona_id', 'deuda_id'],
  camposOrdenables: ['monto_correspondiente'],
  ordenPredeterminado: 'id',
});

async function eliminar(id, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', () =>
    ejecutarConConexion(async (baseDatos) => {
      const participante = await baseDatos.getFirstAsync(
        'SELECT deuda_id FROM participantes_gasto WHERE id = ?;',
        [id],
      );
      if (!participante) {
        return false;
      }
      if (participante.deuda_id) {
        throw new ErrorBaseDatos('integridad');
      }

      const resultado = await baseDatos.runAsync(
        'DELETE FROM participantes_gasto WHERE id = ? AND deuda_id IS NULL;',
        [id],
      );
      return resultado.changes > 0;
    }, conexion),
  );
}

export const participantesGastoRepositorio = Object.freeze({
  ...repositorioParticipantes,
  eliminar,
});
