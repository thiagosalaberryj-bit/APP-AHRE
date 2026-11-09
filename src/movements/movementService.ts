import { siguienteEjecucion, partesCalendario } from '../recurrences/recurrenceCalendar';
import { registrarEjecucion } from '../recurrences/recurrenceService';
import type { Conexion } from '../database/types';
import { obtenerSesionActual } from '../authentication/sessionService';
import { ErrorBaseDatos } from '../database/errors';
import { ejecutarTransaccion } from '../database/transactions';
import {
  categoriasRepositorio,
  depositosRepositorio,
  movimientosRepositorio,
  recurrenciasRepositorio,
} from '../database/repositories';
import {
  combinarFechaYHora,
  convertirMontoMovimiento,
  validarDatosMovimiento,
} from '../utils/movementValidation';

const TIPOS_MOVIMIENTO_REGISTRABLES = Object.freeze(['ingreso', 'egreso']);

const MENSAJES_ERROR: Readonly<Record<string, string>> = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de guardar el movimiento.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  deposito_no_disponible: 'El depósito seleccionado ya no está disponible. Elegí otro depósito.',
  categoria_no_disponible: 'La categoría seleccionada ya no está disponible. Elegí otra categoría.',
  tipo_no_disponible: 'No se pudo identificar el tipo de movimiento.',
});

export interface ErrorMovimiento {
  codigo: string;
  errores: Record<string, string> | null;
}

export class ErrorMovimiento extends Error {

  constructor(codigo: string, errores: Record<string,string> | null = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorMovimiento';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function validarTipoMovimiento(tipo: string) {
  if (!TIPOS_MOVIMIENTO_REGISTRABLES.includes(tipo)) {
    throw new ErrorMovimiento('tipo_no_disponible');
  }
}

function formatearSaldo(saldo: number) {
  const saldoNumerico = Number(saldo);
  if (!Number.isFinite(saldoNumerico)) return 'Saldo actual no disponible';

  return `Saldo actual: $${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(saldoNumerico)}`;
}

function prepararDeposito(deposito: import('../database/types').Deposito) {
  return {
    ...deposito,
    saldoTexto: formatearSaldo(deposito.saldo_actual),
  };
}

export async function cargarDatosMovimiento(tipo: string) {
  validarTipoMovimiento(tipo);
  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }

  const [depositos, categorias] = await Promise.all([
    depositosRepositorio.consultar(
      { usuario_id: usuario.id, activo: 1 },
      { ordenarPor: 'fecha_creacion', direccion: 'ASC' },
    ),
    Promise.resolve(categoriasRepositorio.consultar(tipo)),
  ]);

  return {
    usuario,
    depositos: depositos.map(prepararDeposito),
    categorias,
  };
}

async function consultarUsuarioHistorial(usuarioId: string | null = null) {
  const { usuario } = await obtenerSesionActual();
  if (!usuario || (usuarioId && usuario.id !== usuarioId)) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }
  return usuario;
}

export async function cargarOpcionesHistorialMovimientos() {
  const usuario = await consultarUsuarioHistorial();
  const opciones = await movimientosRepositorio.consultarOpcionesHistorial(usuario.id);
  return { usuarioId: usuario.id, ...opciones };
}

export async function cargarPaginaHistorialMovimientos(usuarioId: string, filtros: import('../types/forms').FiltrosHistorial, cursor: {fecha_hora:string;id:string}|null = null) {
  await consultarUsuarioHistorial(usuarioId);
  return movimientosRepositorio.consultarHistorial(
    usuarioId,
    filtros,
    { limite: 50, cursor },
  );
}

export async function cargarMesesHistorialMovimientos(usuarioId: string, filtros: import('../types/forms').FiltrosHistorial) {
  await consultarUsuarioHistorial(usuarioId);
  return movimientosRepositorio.consultarMesesHistorial(usuarioId, filtros);
}

export async function consultarDetalleHistorialMovimiento(movimientoId: string) {
  const usuario = await consultarUsuarioHistorial();
  return movimientosRepositorio.consultarHistorialPorId(usuario.id, movimientoId);
}

async function consultarDepositoDisponible(usuarioId: string, depositoId: string | null, baseDatos: Conexion) {
  const deposito = await depositosRepositorio.consultarPorId(depositoId!, baseDatos);
  if (
    !deposito ||
    deposito.usuario_id !== usuarioId ||
    Number(deposito.activo) !== 1
  ) {
    throw new ErrorMovimiento('deposito_no_disponible');
  }

  return deposito;
}

function consultarCategoriaDisponible(categoriaId: string | null, tipo: string) {
  const categoria = categoriasRepositorio
    .consultar(tipo)
    .find((opcion) => opcion.id === categoriaId);

  if (!categoria) {
    throw new ErrorMovimiento('categoria_no_disponible');
  }

  return categoria;
}

export async function crearMovimiento(datos: import('../types/forms').DatosMovimiento, tipo: 'ingreso' | 'egreso') {
  validarTipoMovimiento(tipo);
  const errores = validarDatosMovimiento(datos, tipo);
  if (Object.keys(errores).length > 0) {
    throw new ErrorMovimiento('datos_invalidos', errores);
  }

  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }

  const monto = convertirMontoMovimiento(datos.monto);
  const descripcion = datos.descripcion.trim();
  const fechaHora = combinarFechaYHora(datos.fecha, datos.hora);

  if (monto === null || !fechaHora) {
    throw new ErrorMovimiento('datos_invalidos', validarDatosMovimiento(datos, tipo));
  }

  try {
    return await ejecutarTransaccion(async (baseDatos) => {
      const deposito = await consultarDepositoDisponible(
        usuario.id,
        datos.deposito_id,
        baseDatos,
      );
      const categoria = consultarCategoriaDisponible(datos.categoria, tipo);
      // El selector solo tiene precisión de minutos. No convertir ese mismo
      // minuto en historial previo por los segundos de creación del depósito.
      const marcaMovimiento = Date.parse(fechaHora);
      const marcaCreacion = Date.parse(deposito.fecha_creacion);
      const fechaHoraRegistro = marcaMovimiento < marcaCreacion
        && Math.floor(marcaMovimiento / 60000) === Math.floor(marcaCreacion / 60000)
        ? deposito.fecha_creacion : fechaHora;
      let recurrenciaId: string | null = null;

      if (datos.recurrente) {
        const recurrencia = await recurrenciasRepositorio.crear({
          deposito_id: deposito.id,
          categoria: categoria.id,
          tipo: tipo as "ingreso" | "egreso",
          monto,
          descripcion,
          frecuencia: datos.frecuencia as import('../database/types').Recurrencia['frecuencia'],
          fecha_inicio: fechaHoraRegistro,
          fecha_fin: null,
          zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dia_ancla: partesCalendario(fechaHoraRegistro, Intl.DateTimeFormat().resolvedOptions().timeZone).dia,
          proxima_ejecucion: siguienteEjecucion({frecuencia: datos.frecuencia as import('../database/types').Recurrencia['frecuencia'], zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone, dia_ancla: partesCalendario(fechaHoraRegistro, Intl.DateTimeFormat().resolvedOptions().timeZone).dia}, fechaHoraRegistro),
          activa: 1,
        }, baseDatos);
        recurrenciaId = recurrencia.id;
      }

      const movimiento = await movimientosRepositorio.crear({
        deposito_id: deposito.id,
        categoria: categoria.id,
        recurrencia_id: recurrenciaId,
        transferencia_id: null,
        tipo,
        monto,
        descripcion,
        fecha_hora: fechaHoraRegistro,
        anulado: 0,
        reversion_de_id: null,
      }, baseDatos);
      if (recurrenciaId) await registrarEjecucion(baseDatos, usuario.id, recurrenciaId, movimiento.id, fechaHoraRegistro);
      return movimiento;
    });
  } catch (error) {
    if (error instanceof ErrorMovimiento) throw error;
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('transaccion');
  }
}

export async function eliminarMovimiento(movimientoId: string, desactivarRecurrencia = false) {
  const usuario = await consultarUsuarioHistorial();
  return ejecutarTransaccion(async conexion => {
    const movimiento = await movimientosRepositorio.consultarPorId(movimientoId, conexion);
    const deposito = movimiento && await depositosRepositorio.consultarPorId(movimiento.deposito_id, conexion);
    if (!movimiento || deposito?.usuario_id !== usuario.id) throw new ErrorMovimiento('deposito_no_disponible');
    const resultado = await movimientosRepositorio.eliminar(movimientoId, conexion);
    if (desactivarRecurrencia && movimiento.recurrencia_id) await recurrenciasRepositorio.actualizar(movimiento.recurrencia_id, {activa: 0}, conexion);
    return resultado;
  });
}

export async function editarMovimiento(id:string,datos:{monto:string;descripcion:string;categoria:string;depositoId:string}){
  const usuario=await consultarUsuarioHistorial(),monto=convertirMontoMovimiento(datos.monto),descripcion=datos.descripcion.trim();
  if(!monto||monto<=0||!descripcion||descripcion.length>500)throw new ErrorMovimiento('datos_invalidos');
  return ejecutarTransaccion(async conexion=>{
    const original=await movimientosRepositorio.consultarPorId(id,conexion),deposito=original&&await depositosRepositorio.consultarPorId(original.deposito_id,conexion);
    if(!original||deposito?.usuario_id!==usuario.id)throw new ErrorMovimiento('deposito_no_disponible');
    await consultarDepositoDisponible(usuario.id,datos.depositoId,conexion);
    consultarCategoriaDisponible(datos.categoria,original.tipo);
    return movimientosRepositorio.actualizar(id,{monto,descripcion,categoria:datos.categoria,deposito_id:datos.depositoId},conexion);
  });
}

export async function corregirMovimiento(id:string,datos:import('../types/forms').DatosMovimiento,tipo:'ingreso'|'egreso',clave:string){
  const errores=validarDatosMovimiento(datos,tipo);
  if(Object.keys(errores).length||datos.recurrente||!clave||clave.length>128)throw new ErrorMovimiento('datos_invalidos',errores);
  const usuario=await consultarUsuarioHistorial(),monto=convertirMontoMovimiento(datos.monto)!,fecha=combinarFechaYHora(datos.fecha,datos.hora)!;
  return ejecutarTransaccion(async c=>{
    const original=await movimientosRepositorio.consultarPorId(id,c),depositoOriginal=original&&await depositosRepositorio.consultarPorId(original.deposito_id,c);
    if(!original||depositoOriginal?.usuario_id!==usuario.id||original.tipo!==tipo)throw new ErrorMovimiento('deposito_no_disponible');
    // La clave identifica este envío y conserva un ID acotado al corregir varias veces.
    const nuevoId='edicion:'+clave,previo=await movimientosRepositorio.consultarPorId(nuevoId,c);
    const fechaRegistro=Math.floor(Date.parse(fecha)/60000)===Math.floor(Date.parse(original.fecha_hora)/60000)?original.fecha_hora:fecha;
    if(previo){if(previo.monto!==monto||previo.deposito_id!==datos.deposito_id||previo.categoria!==datos.categoria||previo.descripcion!==datos.descripcion.trim()||previo.fecha_hora!==fechaRegistro)throw new ErrorMovimiento('datos_invalidos');return previo;}
    if(original.anulado||original.fecha_eliminacion||original.transferencia_id||original.reversion_de_id)throw new ErrorMovimiento('datos_invalidos');
    await consultarDepositoDisponible(usuario.id,datos.deposito_id,c);consultarCategoriaDisponible(datos.categoria,tipo);
    const borradores=await c.getAllAsync<{plan_pagos:string}>("SELECT g.plan_pagos FROM gastos_compartidos g JOIN salas s ON s.id=g.sala_id WHERE g.usuario_id=? AND s.estado='abierta' AND s.publicada=0",[usuario.id]);
    for(const borrador of borradores){const plan=JSON.parse(borrador.plan_pagos||'{}') as {financiaciones?:Record<string,{movimientoId?:string}>};if(Object.values(plan.financiaciones||{}).some(f=>f.movimientoId===id))throw new Error('Desvinculá este movimiento de la sala abierta antes de corregirlo.');}
    if(!await movimientosRepositorio.eliminar(id,c))throw new ErrorMovimiento('datos_invalidos');
    return movimientosRepositorio.crear({id:nuevoId,deposito_id:datos.deposito_id!,tipo,categoria:datos.categoria!,monto,descripcion:datos.descripcion.trim(),fecha_hora:fechaRegistro,recurrencia_id:original.recurrencia_id},c);
  });
}
