import type { Conexion, Persona, Usuario, Tablas } from '../database/types';
import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarTransaccion } from '../database/transactions';
import { personasRepositorio, salasRepositorio, gastosCompartidosRepositorio, participantesGastoRepositorio, pagosSocialesRepositorio, deudasRepositorio, personasSalaRepositorio, depositosRepositorio } from '../database/repositories';
import { exigir } from './socialValidation';
import { normalizarNombrePersona } from './socialHelpers';

export interface ContextoSocial {
  usuario: Usuario;
  propia: Persona;
  conexion: Conexion;
}

export interface DatosSociales {
  personas: Tablas['personas'][];
  salas: Tablas['salas'][];
  gastos: Tablas['gastos_compartidos'][];
  partes: Tablas['participantes_gasto'][];
  pagos: Tablas['pagos_sociales'][];
  deudas: Tablas['deudas'][];
  integrantes: Tablas['personas_sala'][];
  depositos: Tablas['depositos'][];
}

export async function conSocial<Resultado>(operacion: (contexto: ContextoSocial) => Promise<Resultado>): Promise<Resultado> {
  const { usuario } = await obtenerSesionActual();
  exigir(usuario, 'Iniciá sesión para utilizar Social.');
  return ejecutarTransaccion(async (conexion) => {
    const activo = await conexion.getFirstAsync<Pick<Tablas['usuarios'], 'id'>>('SELECT id FROM usuarios WHERE id = ? AND activo = 1;', [usuario.id]);
    exigir(activo, 'La sesión ya no está disponible.');
    let propia = (await personasRepositorio.consultar({ usuario_id: usuario.id, es_usuario_actual: 1 }, {}, conexion))[0];
    if (!propia) propia = await personasRepositorio.crear({ usuario_id: usuario.id, nombre: usuario.nombre, nombre_normalizado: normalizarNombrePersona(usuario.nombre), es_usuario_actual: 1, activa: 1 }, conexion);
    return operacion({ usuario, propia, conexion });
  });
}

export const idPersistente = (id: string, contexto: ContextoSocial) => id === 'vos' ? contexto.propia.id : id;
export const idVisible = (id: string, contexto: ContextoSocial) => id === contexto.propia.id ? 'vos' : id;

export async function registroPropio<Registro extends { id: string; usuario_id?: string }>(repositorio: { consultarPorId: (id: string, conexion: Conexion) => Promise<Registro | null> }, id: string, contexto: ContextoSocial) {
  const fila = await repositorio.consultarPorId(idPersistente(id, contexto), contexto.conexion);
  exigir(fila && fila.usuario_id === contexto.usuario.id, 'El registro ya no está disponible para esta cuenta.');
  return fila;
}

export async function leerSocial(contexto: ContextoSocial) {
  const filtros = { usuario_id: contexto.usuario.id };
  const conexion = contexto.conexion;
  const [personas, salas, gastos, partes, pagos, deudas, integrantes, depositos] = await Promise.all([
    personasRepositorio.consultar(filtros, {}, conexion), salasRepositorio.consultar(filtros, {}, conexion),
    gastosCompartidosRepositorio.consultar(filtros, {}, conexion), participantesGastoRepositorio.consultar(filtros, {}, conexion),
    pagosSocialesRepositorio.consultar(filtros, {}, conexion), deudasRepositorio.consultar(filtros, {}, conexion),
    personasSalaRepositorio.consultar(filtros, {}, conexion), depositosRepositorio.consultar({...filtros, activo:1}, {}, conexion),
  ]);
  const datos: DatosSociales = { personas, salas, gastos, partes, pagos, deudas, integrantes, depositos };
  return datos;
}

export async function salaAbierta(id: string, contexto: ContextoSocial) {
  const sala = await registroPropio(salasRepositorio, id, contexto);
  exigir(sala.estado === 'abierta', 'La sala está cerrada y su reparto es de solo lectura.');
  return sala;
}

export async function exigirDepositoConDinero(contexto: ContextoSocial) {
  const deposito = await contexto.conexion.getFirstAsync<Pick<Tablas['depositos'], 'id'>>('SELECT id FROM depositos WHERE usuario_id = ? AND activo = 1 AND saldo_actual > 0 LIMIT 1;', [contexto.usuario.id]);
  exigir(deposito, 'Para crear registros en Social necesitás un depósito activo con dinero.');
}
