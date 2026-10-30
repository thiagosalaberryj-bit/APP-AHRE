import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarTransaccion } from '../database/transactions';
import { personasRepositorio, salasRepositorio, gastosCompartidosRepositorio, participantesGastoRepositorio, pagosSocialesRepositorio, deudasRepositorio, personasSalaRepositorio, depositosRepositorio } from '../database/repositories';
import { exigir } from './socialValidation';
import { normalizarNombrePersona } from './socialHelpers';

const repositoriosSociales = { personas: personasRepositorio, salas: salasRepositorio, gastos: gastosCompartidosRepositorio,
  partes: participantesGastoRepositorio, pagos: pagosSocialesRepositorio, deudas: deudasRepositorio, integrantes: personasSalaRepositorio };

export async function conSocial(operacion) {
  const { usuario } = await obtenerSesionActual();
  exigir(usuario, 'Iniciá sesión para utilizar Social.');
  return ejecutarTransaccion(async conexion => {
    const activo = await conexion.getFirstAsync('SELECT id FROM usuarios WHERE id = ? AND activo = 1;', [usuario.id]);
    exigir(activo, 'La sesión ya no está disponible.');
    let propia = (await personasRepositorio.consultar({ usuario_id: usuario.id, es_usuario_actual: 1 }, {}, conexion))[0];
    if (!propia) propia = await personasRepositorio.crear({ usuario_id: usuario.id, nombre: usuario.nombre, nombre_normalizado: normalizarNombrePersona(usuario.nombre), es_usuario_actual: 1, activa: 1 }, conexion);
    return operacion({ usuario, propia, conexion });
  });
}

export const idPersistente = (id, contexto) => id === 'vos' ? contexto.propia.id : id;
export const idVisible = (id, contexto) => id === contexto.propia.id ? 'vos' : id;

export async function registroPropio(repositorio, id, contexto) {
  const fila = await repositorio.consultarPorId(idPersistente(id, contexto), contexto.conexion);
  exigir(fila && fila.usuario_id === contexto.usuario.id, 'El registro ya no está disponible para esta cuenta.');
  return fila;
}

export async function leerSocial(contexto) {
  const datos = {};
  for (const [clave, repositorio] of Object.entries(repositoriosSociales)) {
    datos[clave] = await repositorio.consultar({ usuario_id: contexto.usuario.id }, {}, contexto.conexion);
  }
  datos.depositos = await depositosRepositorio.consultar({ usuario_id: contexto.usuario.id, activo: 1 }, {}, contexto.conexion);
  return datos;
}

export async function salaAbierta(id, contexto) {
  const sala = await registroPropio(salasRepositorio, id, contexto);
  exigir(sala.estado === 'abierta', 'La sala está cerrada y su reparto es de solo lectura.');
  return sala;
}

export async function exigirDepositoConDinero(contexto) {
  const deposito = await contexto.conexion.getFirstAsync('SELECT id FROM depositos WHERE usuario_id = ? AND activo = 1 AND saldo_actual > 0 LIMIT 1;', [contexto.usuario.id]);
  exigir(deposito, 'Para crear registros en Social necesitás un depósito activo con dinero.');
}
