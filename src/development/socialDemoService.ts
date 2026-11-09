import type { Conexion, Usuario } from '../database/types';
import {prepararEjemploDeudaDemo,prepararEscenariosRecibidosDemo,prepararDeudaInteractivaDemo} from './seedSocialOnlinePreview';
import { obtenerSesionActual } from '../authentication/sessionService';
import { consultarAutorizacion, esPruebaLocal } from '../sync/deviceAuthorization';
import { ejecutarTransaccion } from '../database/transactions';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { depositosRepositorio, movimientosRepositorio } from '../database/repositories';
import { generarIdentificador } from '../database/identifiers';
import { exigir } from '../social/socialValidation';
import {leerPlanGasto} from '../social/socialRoomDraft';
import { avisarSocialOnline } from '../social/online/onlineStore';
import type { ComandoOnline, DeudaOnline, OperacionPersonal, RespuestaSala } from '../social/online/types';

export const esRecursoDemo = (id: string | null | undefined) => !!id?.startsWith('demo-social:');
export const esRutaDemo = (ruta: string) => ruta.split('/').some(id => esRecursoDemo(decodeURIComponent(id)));

// La cuenta y la autorización se comprueban además del prefijo del recurso.
// Una cuenta real o una build release nunca puede usar este transporte local.
export async function usuarioDemoActual(): Promise<Usuario | null> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  const { usuario } = await obtenerSesionActual();
  if (!usuario) return null;
  const permiso = await consultarAutorizacion(usuario.id);
  return permiso && !permiso.revocada && esPruebaLocal(permiso, usuario.correo_electronico) ? usuario : null;
}

async function conDemo<T>(accion: (c: Conexion, usuarioId: string) => Promise<T>) {
  const usuario = await usuarioDemoActual();
  exigir(usuario, 'Esta simulación solo está disponible en la cuenta local de pruebas.');
  const resultado = await ejecutarTransaccion(async c => {
    const permiso = await c.getFirstAsync<{generacion:number;revocada:number}>('SELECT generacion,revocada FROM sync_authorization WHERE usuario_id=?', [usuario.id]);
    exigir(permiso?.generacion === 0 && !permiso.revocada, 'La cuenta dejó de ser local.');
    return accion(c, usuario.id);
  });
  avisarSocialOnline();
  return resultado;
}

async function leer<T>(c: Conexion, usuarioId: string, clave: string, defecto: T): Promise<T> {
  const fila = await c.getFirstAsync<{datos:string}>('SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave=?', [usuarioId, clave]);
  return fila ? JSON.parse(fila.datos) : defecto;
}
async function guardar(c: Conexion, usuarioId: string, clave: string, datos: unknown) {
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos', [usuarioId, clave, JSON.stringify(datos)]);
}
async function salas(c: Conexion, usuarioId: string) {
  return (await c.getAllAsync<{datos:string}>("SELECT datos FROM salas_online_locales WHERE usuario_id=?", [usuarioId])).map(f => JSON.parse(f.datos) as RespuestaSala);
}
async function guardarSala(c: Conexion, usuarioId: string, detalle: RespuestaSala) {
  await c.runAsync('UPDATE salas_online_locales SET datos=?,fecha_actualizacion=? WHERE usuario_id=? AND sala_id=?', [JSON.stringify(detalle), new Date().toISOString(), usuarioId, detalle.sala.id]);
}

export function finanzasDemo<T extends RespuestaSala>(detalle: T, simulacion=false): T {
  if (!esRecursoDemo(detalle.sala.id)&&!simulacion) return detalle;
  const opciones: OperacionPersonal[] = [], propia = detalle.personaPropiaId;
  for (const g of detalle.sala.gastos.filter(g => g.estado === 'vigente')) {
    const agregar = (clave: string, tipo: 'ingreso'|'egreso', monto: number, descripcion: string) => {
      const anterior = detalle.misFinanzas?.find(o => o.clave === clave || o.gastoId === g.id && o.tipo === tipo && o.clave.startsWith('compra:') === clave.startsWith('compra:'));
      opciones.push({clave, tipo, monto, descripcion, categoria: tipo === 'ingreso' ? 'devoluciones' : g.categoriaId, fecha: g.fecha, gastoId: g.id, salaId: detalle.sala.id, seleccion: anterior?.seleccion});
    };
    if (g.pagadorId === propia) {
      agregar(`compra:${detalle.sala.id}:${g.id}`, 'egreso', g.monto, 'Compra: ' + g.descripcion);
      for (const p of g.partes.filter(p => p.personaId !== propia && g.pagaron.includes(p.personaId)))
        agregar(`parte:${detalle.sala.id}:${g.id}:${p.personaId}`, 'ingreso', p.monto, 'Parte recibida: ' + g.descripcion);
    } else {
      const parte = g.partes.find(p => p.personaId === propia);
      if (parte) agregar(`parte:${detalle.sala.id}:${g.id}:${propia}`, 'egreso', parte.monto, 'Mi parte: ' + g.descripcion);
    }
  }
  return {...detalle, misFinanzas: opciones};
}

async function incorporar(c: Conexion, usuarioId: string, operacion: OperacionPersonal, seleccion: NonNullable<OperacionPersonal['seleccion']>) {
  const anterior = await c.getFirstAsync('SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=? AND clave=?', [usuarioId, operacion.clave]);
  if (anterior) { operacion.incorporada = true; return; }
  exigir(Boolean(seleccion.depositoId) !== Boolean(seleccion.movimientoId), 'Elegí un depósito o un movimiento existente.');
  let movimientoId = seleccion.movimientoId;
  if (movimientoId) {
    const m = await movimientosRepositorio.consultarPorId(movimientoId, c), d = m && await depositosRepositorio.consultarPorId(m.deposito_id, c);
    exigir(m && d?.usuario_id === usuarioId && !m.anulado && !m.transferencia_id && !m.reversion_de_id && m.tipo === operacion.tipo && Math.round(m.monto * 100) === Math.round(operacion.monto * 100), 'El movimiento debe ser propio y coincidir en importe y dirección.');
    exigir(!await c.getFirstAsync('SELECT clave FROM incorporaciones_sociales_locales WHERE movimiento_id=?', [movimientoId]), 'El movimiento ya está vinculado.');
  } else {
    const d = await depositosRepositorio.consultarPorId(seleccion.depositoId!, c);
    exigir(d?.usuario_id === usuarioId && d.activo, 'Elegí un depósito propio activo.');
    movimientoId = (await movimientosRepositorio.crear({deposito_id:d.id, tipo:operacion.tipo, categoria:operacion.categoria, monto:operacion.monto, descripcion:'Demo · ' + operacion.descripcion, fecha_hora:operacion.fecha}, c)).id;
  }
  await c.runAsync('INSERT INTO incorporaciones_sociales_locales(usuario_id,clave,movimiento_id,confirmada) VALUES(?,?,?,1)', [usuarioId, operacion.clave, movimientoId]);
  operacion.incorporada = true;
}

async function cerrar(c: Conexion, usuarioId: string, detalle: RespuestaSala) {
  const deudas = await leer<DeudaOnline[]>(c, usuarioId, 'deudas', []);
  detalle.sala.estado = 'cerrada';
  detalle.sala.obligaciones = [];
  for (const g of detalle.sala.gastos.filter(g => g.estado === 'vigente')) for (const p of g.partes.filter(p => p.personaId !== g.pagadorId)) {
    const id = `demo-social:${usuarioId}:${detalle.sala.id}:deuda:${g.id}:${p.personaId}`, pendiente = g.pagaron.includes(p.personaId) ? 0 : p.monto;
    detalle.sala.obligaciones.push({id, participacionId:g.id + ':' + p.personaId, pendiente});
    if (!pendiente || g.pagadorId !== detalle.personaPropiaId && p.personaId !== detalle.personaPropiaId) continue;
    const esAcreedor = g.pagadorId === detalle.personaPropiaId, otraPersonaId = esAcreedor ? p.personaId : g.pagadorId;
    deudas.push({id, salaId:detalle.sala.id, otraPersonaId, otraPersonaNombre:detalle.sala.participantes.find(p => p.id === otraPersonaId)?.nombre, descripcion:g.descripcion, fecha:g.fecha, monto:p.monto, pendiente, estado:'aceptada', esAcreedor, esDeudor:!esAcreedor, puedeDecidir:false, pagos:[]});
  }
  await guardar(c, usuarioId, 'deudas', deudas);
  const operaciones = await leer<OperacionPersonal[]>(c, usuarioId, 'operaciones', []);
  for (const o of finanzasDemo(detalle,true).misFinanzas || []) {
    const g = detalle.sala.gastos.find(g => g.id === o.gastoId)!;
    if (!o.clave.startsWith('compra:') && o.tipo === 'egreso' && !g.pagaron.includes(detalle.personaPropiaId)) continue;
    if (o.seleccion) await incorporar(c, usuarioId, o, o.seleccion);
    if (!operaciones.some(p => p.clave === o.clave)) operaciones.push(o);
  }
  await guardar(c, usuarioId, 'operaciones', operaciones);
}

export async function comandoDemo(salaId: string, comando: Omit<ComandoOnline, 'versionBase'>) {
  return conDemo(async (c, usuarioId) => {
    const marca = 'demo-comando:' + comando.idOperacion;
    if (await leer(c, usuarioId, marca, false)) return;
    const detalle = (await salas(c, usuarioId)).find(s => s.sala.id === salaId);
    exigir(detalle && detalle.sala.estado === 'abierta', 'La sala demo no está abierta.');
    exigir(detalle.administrador || detalle.puedeEditarGastos && ['guardar_gasto','guardar_lista','cancelar_gasto'].includes(comando.tipo), 'No tenés permiso para esta acción.');
    if (comando.tipo === 'guardar_gasto' || comando.tipo === 'guardar_lista') {
      for (const g of comando.gastos || (comando.gasto ? [comando.gasto] : [])) {
        const i = detalle.sala.gastos.findIndex(p => p.id === g.id);
        exigir(i < 0 || detalle.sala.gastos[i].version === g.version, 'El gasto cambió. Volvé a abrirlo.');
        const guardado = {...g, version:i < 0 ? 1 : g.version + 1};
        if (i < 0) detalle.sala.gastos.push(guardado); else detalle.sala.gastos[i] = guardado;
      }
    } else if (comando.tipo === 'parte_pagada') {
      const g = detalle.sala.gastos.find(g => g.id === comando.gastoId);
      exigir(g && g.partes.some(p => p.personaId === comando.personaId), 'La parte no existe.');
      g.pagaron = g.pagaron.filter(id => id !== comando.personaId);
      if (comando.pagada) g.pagaron.push(comando.personaId!);
      g.version++;
    } else if (comando.tipo === 'integrantes') {
      const ids = new Set(comando.personas?.map(p => p.id));
      exigir(ids.has(detalle.personaPropiaId), 'El administrador debe permanecer en la sala.');
      for (const p of detalle.sala.participantes) p.activa = ids.has(p.id);
      for (const p of comando.personas || []) if (!detalle.sala.participantes.some(a => a.id === p.id)) detalle.sala.participantes.push({...p, activa:true});
    } else if (comando.tipo === 'permisos') {
      const editores = new Set(detalle.editores);
      if (comando.puedeEditar) editores.add(comando.personaId!); else editores.delete(comando.personaId!);
      detalle.editores = [...editores];
    } else if (comando.tipo === 'cancelar_gasto') {
      const gasto = detalle.sala.gastos.find(g => g.id === comando.gastoId);
      exigir(gasto, 'El gasto no existe.'); gasto.estado = 'cancelado';
    } else if (comando.tipo === 'cerrar') await cerrar(c, usuarioId, detalle);
    else throw new Error('Acción no disponible en la simulación local.');
    detalle.sala.revision++;
    await guardarSala(c, usuarioId, finanzasDemo(detalle,true));
    await guardar(c, usuarioId, marca, true);
  });
}

export async function accionDemo(ruta: string, datos: Record<string, unknown>): Promise<unknown> {
  return conDemo(async (c, usuarioId) => {
    const partes = ruta.split('/').filter(Boolean).map(decodeURIComponent), id = partes[1], ahora = new Date().toISOString();
    const listaSalas = await salas(c, usuarioId), deudas = await leer<DeudaOnline[]>(c, usuarioId, 'deudas', []);
    const detalle = listaSalas.find(s => s.sala.id === id || s.solicitudes.some(q => q.id === id) || s.admisiones?.some(a => a.id === id));
    if (partes[0] === 'salas' && partes[2] === 'acceso') {
      exigir(detalle?.administrador && detalle.sala.estado === 'abierta', 'Solo el administrador puede cambiar el acceso de una sala abierta.');
      exigir(detalle.acceso || String(datos.contrasena || '').length >= 8, 'La contraseña debe tener al menos ocho caracteres.');
      if(datos.contrasena)exigir(String(datos.contrasena).length>=8&&String(datos.contrasena).length<=128,'La contraseña debe tener entre 8 y 128 caracteres.');
      if(datos.contrasena)await guardar(c,usuarioId,'demo-clave:'+detalle.sala.id,String(datos.contrasena));
      if (!detalle.acceso || datos.renovar) detalle.acceso = {codigo:(generarIdentificador() + generarIdentificador()).replace(/-/g, ''), habilitado:1};
      if (typeof datos.habilitado === 'boolean') detalle.acceso.habilitado = datos.habilitado ? 1 : 0;
    } else if (partes[0] === 'salas' && partes[2] === 'solicitudes') {
      exigir(detalle && detalle.sala.estado === 'abierta', 'La sala no está abierta.');
      const gasto = detalle.sala.gastos.find(g => g.id === datos.gastoId), parte = gasto?.partes.find(p => p.personaId === detalle.personaPropiaId);
      exigir(datos.tipo !== 'parte_pagada' || parte && gasto?.pagadorId !== detalle.personaPropiaId, 'No hay una parte propia por informar.');
      exigir(!detalle.solicitudes.some(q => q.gasto_id === gasto?.id && q.personaId === detalle.personaPropiaId && q.tipo === datos.tipo && q.estado === 'pendiente'), 'Ya tenés un aviso pendiente.');
      detalle.solicitudes.push({id:'demo-social:' + generarIdentificador(), gasto_id:gasto?.id || null, personaId:detalle.personaPropiaId, tipo:String(datos.tipo || 'observacion'), monto_parte:parte?.monto, texto:datos.tipo === 'parte_pagada' ? 'Ya pagué mi parte' : String(datos.texto || ''), estado:'pendiente', fecha:ahora});
    } else if (partes[0] === 'solicitudes') {
      exigir(detalle?.administrador && detalle.sala.estado === 'abierta', 'Solo el administrador de una sala abierta puede responder.');
      const q = detalle.solicitudes.find(q => q.id === id)!;
      exigir(['resuelta','rechazada'].includes(String(datos.decision)), 'Decisión inválida.');
      if (q.estado === 'pendiente') {
        q.estado = String(datos.decision); q.fecha_decision = ahora;
        const g = detalle.sala.gastos.find(g => g.id === q.gasto_id);
        if (q.estado === 'resuelta' && q.tipo === 'parte_pagada' && g && q.personaId && !g.pagaron.includes(q.personaId)) { g.pagaron.push(q.personaId); g.version++; }
      }
    } else if (partes[0] === 'ingresos') {
      exigir(detalle?.administrador && detalle.sala.estado === 'abierta', 'No podés resolver este ingreso.');
      const a = detalle.admisiones!.find(a => a.id === id)!;
      exigir(a.estado === 'pendiente' && ['aceptada','rechazada'].includes(String(datos.decision)), 'El ingreso ya fue resuelto.');
      if (datos.decision === 'aceptada') {
        const p = await c.getFirstAsync<{id:string;nombre:string;apellido:string}>('SELECT id,nombre,apellido FROM personas WHERE usuario_id=? AND id=? AND activa=1', [usuarioId, String(datos.personaId)]);
        const vinculos = await leer<import('../social/online/types').VinculoOnline[]>(c, usuarioId, 'vinculos', []);
        exigir(p && !detalle.identidades?.some(i => i.personaId === p.id && i.conCuenta) && !vinculos.some(v => v.persona_id === p.id && v.estado === 'confirmado' && v.cuenta_id), 'Elegí una ficha disponible sin cuenta asignada.');
        const existente = detalle.sala.participantes.find(i => i.id === p.id);
        if (existente) existente.activa = true; else detalle.sala.participantes.push({id:p.id, nombre:p.nombre + ' ' + p.apellido, activa:true});
        exigir(!detalle.identidades?.some(i=>i.personaId===p.id&&i.conAcceso)||datos.recuperar===true,'La persona ya tiene acceso. Confirmá si querés reemplazarlo.');
        detalle.identidades = [...(detalle.identidades || []).filter(i => i.personaId !== p.id), {personaId:p.id, conCuenta:false, conAcceso:true}];
      }
      a.estado = String(datos.decision);
    } else if (partes[0] === 'deudas' && partes[2] === 'perdonar') {
      const d=deudas.find(d=>d.id===id);exigir(d?.esAcreedor&&d.estado==='aceptada','Solo quien cobra puede perdonar una deuda aceptada.');
      if(d.perdon&&d.pendiente===0&&d.perdon.monto===Number(datos.pendienteEsperado))return {};
      exigir(d.pendiente>0&&Math.round(d.pendiente*100)===Math.round(Number(datos.pendienteEsperado)*100),'El pendiente cambió. Revisá la deuda.');
      const monto=d.pendiente;d.perdon={monto,fecha:ahora};d.pendiente=0;
      for(const p of d.pagos)if(p.estado==='informado'){p.estado='rechazado';p.fecha_decision=ahora;}
      for(const s of listaSalas){const o=s.sala.obligaciones?.find(o=>o.id===d.id);if(o){o.pendiente=0;o.perdonado=monto;await guardarSala(c,usuarioId,s);}}
      await guardar(c,usuarioId,'deudas',deudas);return {};
    } else if (partes[0] === 'deudas' && partes[2] === 'decidir') {
      const d = deudas.find(d => d.id === id);
      exigir(d?.puedeDecidir && ['aceptada','rechazada'].includes(String(datos.decision)), 'Esta propuesta no puede decidirse.');
      d.estado = String(datos.decision); d.puedeDecidir = false;
      await guardar(c, usuarioId, 'deudas', deudas);
    } else if (partes[0] === 'deudas' && partes[2] === 'pagos' || partes[0] === 'pagos' && partes[2] === 'decidir') {
      const d = partes[0] === 'deudas' ? deudas.find(d => d.id === id) : deudas.find(d => d.pagos.some(p => p.id === id));
      exigir(d?.estado === 'aceptada', 'La deuda todavía no fue aceptada.');
      const operaciones = await leer<OperacionPersonal[]>(c, usuarioId, 'operaciones', []);
      let pago: DeudaOnline['pagos'][number];
      if (partes[0] === 'deudas') {
        const monto = Number(datos.monto), reservado = d.esAcreedor?0:d.pagos.filter(p => p.estado === 'informado').reduce((s, p) => s + Math.round(p.monto * 100), 0);
        exigir((d.esDeudor||d.esAcreedor) && Number.isFinite(monto) && monto > 0 && Math.round(monto * 100) <= Math.round(d.pendiente * 100) - reservado, 'El importe supera lo pendiente o ya informado.');
        pago = {id:'demo-social:' + generarIdentificador(), monto, estado:d.esAcreedor?'confirmado':'informado', fecha:ahora}; d.pagos.push(pago);
        if(d.esAcreedor){pago.fecha_decision=ahora;d.pendiente=(Math.round(d.pendiente*100)-Math.round(monto*100))/100;for(const s of listaSalas){const o=s.sala.obligaciones?.find(o=>o.id===d.id);if(o){o.pendiente=d.pendiente;await guardarSala(c,usuarioId,s);}}}
      } else {
        pago = d.pagos.find(p => p.id === id)!;
        exigir(d.esAcreedor && pago.estado === 'informado' && ['confirmado','rechazado'].includes(String(datos.decision)), 'No podés decidir este pago.');
        pago.estado = String(datos.decision); pago.fecha_decision = ahora;
        if (pago.estado === 'confirmado') {
          exigir(Math.round(pago.monto * 100) <= Math.round(d.pendiente * 100), 'El pago supera el pendiente.');
          d.pendiente = (Math.round(d.pendiente * 100) - Math.round(pago.monto * 100)) / 100;
          for (const s of listaSalas) { const o = s.sala.obligaciones?.find(o => o.id === d.id); if (o) { o.pendiente = d.pendiente; await guardarSala(c, usuarioId, s); } }
        }
      }
      if (pago.estado !== 'rechazado') {
        const o: OperacionPersonal = {clave:'pago:' + pago.id, deudaId:d.id, pagoId:pago.id, salaId:d.salaId, tipo:d.esDeudor?'egreso':'ingreso', categoria:d.esDeudor?'deudas':'devoluciones', monto:pago.monto, descripcion:'Pago: ' + d.descripcion, fecha:ahora};
        exigir(typeof datos.depositoId === 'string'||typeof datos.movimientoId==='string', 'Elegí tu depósito o movimiento antes de registrar el pago.');
        await incorporar(c, usuarioId, o, {depositoId:typeof datos.depositoId==='string'?datos.depositoId:undefined,movimientoId:typeof datos.movimientoId==='string'?datos.movimientoId:undefined}); operaciones.push(o);
      }
      await guardar(c, usuarioId, 'operaciones', operaciones); await guardar(c, usuarioId, 'deudas', deudas);
      return {pagoId:pago.id};
    } else throw new Error('Este botón todavía no tiene simulación local.');
    if (detalle) { detalle.sala.revision++; await guardarSala(c, usuarioId, finanzasDemo(detalle,true)); }
    return {};
  });
}

export async function seleccionarFinanzasDemo(salaId: string, opcion: OperacionPersonal, seleccion: NonNullable<OperacionPersonal['seleccion']>, quitar: boolean) {
  return conDemo(async (c, usuarioId) => {
    const detalle = (await salas(c, usuarioId)).find(s => s.sala.id === salaId);
    exigir(detalle?.sala.estado === 'abierta', 'La sala ya cerró.');
    const actualizado = finanzasDemo(detalle,true), operacion = actualizado.misFinanzas!.find(o => o.clave === opcion.clave);
    exigir(operacion, 'La operación ya no está disponible.');
    if (!quitar) {
      exigir(Boolean(seleccion.depositoId) !== Boolean(seleccion.movimientoId), 'Elegí un depósito o un movimiento existente.');
      if (seleccion.depositoId) {const d = await depositosRepositorio.consultarPorId(seleccion.depositoId, c); exigir(d?.usuario_id === usuarioId && d.activo, 'Elegí un depósito propio activo.');}
    }
    operacion.seleccion = quitar ? undefined : seleccion;
    await guardarSala(c, usuarioId, actualizado);
  });
}

export async function incorporarDemo(opcion: OperacionPersonal, seleccion: NonNullable<OperacionPersonal['seleccion']>) {
  return conDemo(async (c, usuarioId) => {
    const operaciones = await leer<OperacionPersonal[]>(c, usuarioId, 'operaciones', []), operacion = operaciones.find(o => o.clave === opcion.clave);
    exigir(operacion, 'La operación no está disponible en esta cuenta.');
    const deuda = (await leer<DeudaOnline[]>(c,usuarioId,'deudas',[])).find(d=>d.id===operacion.deudaId);
    exigir(!deuda?.pagos.some(p=>p.id===operacion.pagoId&&p.estado==='rechazado'), 'El pago fue rechazado. No se genera un movimiento desde ese registro.');
    await incorporar(c, usuarioId, operacion, seleccion); await guardar(c, usuarioId, 'operaciones', operaciones);
  });
}

/** Responde como la contraparte sin cambiar de sesión, solo en la cuenta demo local. */
export function simularRespuestaDemo(deudaId:string,respuesta:{decision:'confirmado'|'rechazado'|'perdonado';pagoId?:string;pendienteEsperado:number}) {
  return conDemo(async(c,usuarioId)=>{
    const deudas=await leer<DeudaOnline[]>(c,usuarioId,'deudas',[]),deuda=deudas.find(d=>d.id===deudaId);
    exigir(esRecursoDemo(deudaId)&&deuda?.esDeudor&&deuda.estado==='aceptada','Elegí una deuda demo en la que vos debés.');
    const ahora=new Date().toISOString();
    if(respuesta.decision==='perdonado'){
      if(deuda.perdon&&deuda.pendiente===0&&deuda.perdon.monto===respuesta.pendienteEsperado)return;
      exigir(deuda.pendiente>0&&deuda.pendiente===respuesta.pendienteEsperado,'El pendiente cambió. Volvé a revisar la simulación.');
      deuda.perdon={monto:deuda.pendiente,fecha:ahora};deuda.pendiente=0;
      for(const pago of deuda.pagos)if(pago.estado==='informado'){pago.estado='rechazado';pago.fecha_decision=ahora;}
    }else{
      exigir(['confirmado','rechazado'].includes(respuesta.decision),'Respuesta inválida.');
      const pago=deuda.pagos.find(p=>p.id===respuesta.pagoId);
      exigir(pago,'El pago ya no está disponible.');
      if(pago.estado===respuesta.decision)return;
      exigir(pago.estado==='informado','Este pago ya tiene una respuesta.');
      if(respuesta.decision==='confirmado'){
        exigir(deuda.pendiente===respuesta.pendienteEsperado&&pago.monto<=deuda.pendiente,'El pendiente cambió. Revisá la deuda.');
        deuda.pendiente=(Math.round(deuda.pendiente*100)-Math.round(pago.monto*100))/100;
      }
      pago.estado=respuesta.decision;pago.fecha_decision=ahora;
    }
    for(const sala of await salas(c,usuarioId)){
      const obligacion=sala.sala.obligaciones?.find(o=>o.id===deuda.id);
      if(obligacion){obligacion.pendiente=deuda.pendiente;obligacion.perdonado=deuda.perdon?.monto||0;sala.sala.revision++;await guardarSala(c,usuarioId,sala);}
    }
    await guardar(c,usuarioId,'deudas',deudas);
  });
}

export async function leerSalaDemo(id: string) {
  const usuario = await usuarioDemoActual(); exigir(usuario, 'Iniciá sesión con la cuenta local de pruebas.');
  return ejecutarLecturaConConexion(async c => {const detalle = (await salas(c, usuario.id)).find(s => s.sala.id === id); exigir(detalle, 'La sala demo no está disponible.'); return finanzasDemo(detalle,true);});
}

export async function prepararOperacionesDemo() {
  const usuario = await usuarioDemoActual(); if (!usuario) return;
  const cambio = await ejecutarTransaccion(async c => {
    const ejemploNuevo=await prepararEjemploDeudaDemo(usuario.id,c);
    const escenariosRecibidos=await prepararEscenariosRecibidosDemo(usuario.id,c);
    const operaciones = await leer<OperacionPersonal[]>(c, usuario.id, 'operaciones', []);
    const interactiva=await prepararDeudaInteractivaDemo(usuario.id,c);
    let cambio = ejemploNuevo||escenariosRecibidos||interactiva;
    const deudas=await leer<DeudaOnline[]>(c,usuario.id,'deudas',[]);
    for(const sala of await salas(c,usuario.id))if(!sala.administrador&&sala.sala.estado==='abierta'&&!sala.acceso){
      sala.acceso={codigo:(generarIdentificador()+generarIdentificador()).replace(/-/g,''),habilitado:1};
      await guardar(c,usuario.id,'demo-clave:'+sala.sala.id,'ahre1234');await guardarSala(c,usuario.id,sala);cambio=true;
    }
    for(const d of deudas.filter(d=>d.estado==='aceptada'))for(const p of d.pagos.filter(p=>d.esDeudor&&p.estado!=='rechazado'||p.estado==='confirmado')){
      const clave='pago:'+p.id;
      if(!operaciones.some(o=>o.clave===clave)){operaciones.push({clave,pagoId:p.id,deudaId:d.id,salaId:d.salaId,tipo:d.esDeudor?'egreso':'ingreso',categoria:d.esDeudor?'deudas':'devoluciones',monto:p.monto,descripcion:'Pago: '+d.descripcion,fecha:p.fecha});cambio=true;}
    }
    for (const s of (await salas(c, usuario.id)).filter(s => s.sala.estado === 'cerrada')) for (const o of finanzasDemo(s,true).misFinanzas || []) {
      const g = s.sala.gastos.find(g => g.id === o.gastoId)!;
      if (!o.clave.startsWith('compra:') && o.tipo === 'egreso' && !g.pagaron.includes(s.personaPropiaId)) continue;
      if (!operaciones.some(p => p.clave === o.clave)) { operaciones.push(o); cambio = true; }
    }
    if (cambio) await guardar(c, usuario.id, 'operaciones', operaciones);
    return cambio;
  });
  if (cambio) avisarSocialOnline();
}

/** Publica en SQLite conservando el identificador de la sala local. */
export function publicarSalaDemo(salaId:string) {
  return conDemo(async(c,usuarioId)=>{
    if((await salas(c,usuarioId)).some(s=>s.sala.id===salaId))return {id:salaId};
    const sala=await c.getFirstAsync<import('../database/types').Sala>('SELECT * FROM salas WHERE usuario_id=? AND id=? AND estado=?',[usuarioId,salaId,'abierta']);
    exigir(sala,'La sala local no está disponible.');
    const personas=await c.getAllAsync<import('../database/types').Persona>('SELECT p.* FROM personas p JOIN personas_sala i ON i.persona_id=p.id WHERE i.usuario_id=? AND i.sala_id=? AND i.activa=1',[usuarioId,salaId]);
    const propia=personas.find(p=>p.es_usuario_actual);exigir(propia,'No se encontró tu participación.');
    const gastos=await c.getAllAsync<import('../database/types').GastoCompartido>('SELECT * FROM gastos_compartidos WHERE usuario_id=? AND sala_id=?',[usuarioId,salaId]);
    const partes=await c.getAllAsync<import('../database/types').ParticipanteGasto>('SELECT p.* FROM participantes_gasto p JOIN gastos_compartidos g ON g.id=p.gasto_compartido_id WHERE g.usuario_id=? AND g.sala_id=? ORDER BY p.orden',[usuarioId,salaId]);
    const detalle:RespuestaSala={sala:{id:salaId,nombre:sala.nombre,descripcion:sala.descripcion||'',icono:sala.icono,color:sala.color,fecha:sala.fecha,estado:'abierta',revision:1,participantes:personas.map(p=>({id:p.id,nombre:[p.nombre,p.apellido].filter(Boolean).join(' '),activa:true})),gastos:gastos.map(g=>({id:g.id,pagadorId:g.pagador_id,categoriaId:g.categoria,descripcion:g.descripcion,monto:g.monto_total,fecha:g.fecha,version:g.version,reparto:g.reparto,estado:g.estado,partes:partes.filter(p=>p.gasto_compartido_id===g.id).map(p=>({personaId:p.persona_id,monto:p.monto_correspondiente,orden:p.orden})),pagaron:(JSON.parse(g.plan_pagos) as {pagaron:string[]}).pagaron||[]}))},personaPropiaId:propia.id,administrador:true,puedeEditarGastos:true,identidades:[],solicitudes:[],admisiones:[],misFinanzas:[]};
    const preparado=finanzasDemo(detalle,true);
    for(const operacion of preparado.misFinanzas||[]){
      const gasto=gastos.find(g=>g.id===operacion.gastoId)!;
      const clave=operacion.clave.startsWith('compra:')?'compra':'parte:'+operacion.clave.slice(('parte:'+salaId+':'+gasto.id+':').length);
      const seleccion=leerPlanGasto(gasto).financiaciones[clave];
      if(seleccion)operacion.seleccion={depositoId:seleccion.depositoId||undefined,movimientoId:seleccion.movimientoId||undefined};
    }
    await c.runAsync('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?)',[usuarioId,salaId,JSON.stringify(preparado),1,propia.id,new Date().toISOString()]);
    await c.runAsync('UPDATE salas SET publicada=1 WHERE usuario_id=? AND id=?',[usuarioId,salaId]);
    return {id:salaId};
  });
}

export function simularIngresoDemo(salaId:string,nombre:string) {
  return conDemo(async(c,usuarioId)=>{
    const detalle=(await salas(c,usuarioId)).find(s=>s.sala.id===salaId);
    exigir(detalle?.administrador&&detalle.sala.estado==='abierta','Elegí una sala demo abierta que administres.');
    exigir(nombre.trim().length>0&&nombre.trim().length<=100,'Ingresá el nombre del invitado.');
    detalle.admisiones??=[];
    detalle.admisiones.push({id:'demo-social:'+generarIdentificador(),nombre:nombre.trim(),estado:'pendiente',fecha:new Date().toISOString()});
    await guardarSala(c,usuarioId,detalle);
  });
}

export function simularRespuestaSalaDemo(salaId:string,solicitudId:string,decision:'resuelta'|'rechazada') {
  return conDemo(async(c,usuarioId)=>{
    const detalle=(await salas(c,usuarioId)).find(s=>s.sala.id===salaId);
    exigir(detalle&&!detalle.administrador&&detalle.sala.estado==='abierta','Elegí la vista de participante de una sala demo abierta.');
    exigir(['resuelta','rechazada'].includes(decision),'Decisión inválida.');
    const solicitud=detalle.solicitudes.find(s=>s.id===solicitudId&&s.personaId===detalle.personaPropiaId);
    exigir(solicitud?.estado==='pendiente','Esta solicitud ya se resolvió.');
    solicitud.estado=decision;solicitud.fecha_decision=new Date().toISOString();
    const gasto=detalle.sala.gastos.find(g=>g.id===solicitud.gasto_id);
    if(decision==='resuelta'&&solicitud.tipo==='parte_pagada'&&gasto&&!gasto.pagaron.includes(detalle.personaPropiaId)){gasto.pagaron.push(detalle.personaPropiaId);gasto.version++;}
    detalle.sala.revision++;await guardarSala(c,usuarioId,detalle);
  });
}

export function solicitarIngresoDemo(codigo:string,nombre:string,contrasena:string) {
  return conDemo(async(c,usuarioId)=>{
    const detalle=(await salas(c,usuarioId)).find(s=>s.acceso?.codigo===codigo);
    exigir(detalle?.acceso?.habilitado&&detalle.sala.estado==='abierta','Este enlace demo no está disponible.');
    exigir(await leer(c,usuarioId,'demo-clave:'+detalle.sala.id,'')===contrasena,'La contraseña es incorrecta.');
    exigir(nombre.trim().length>0,'Ingresá tu nombre.');
    return {id:null,estado:'aceptada',salaId:detalle.sala.id};
  });
}

export function simularPermisoSalaDemo(salaId:string,permitido:boolean) {
  return conDemo(async(c,usuarioId)=>{
    const detalle=(await salas(c,usuarioId)).find(s=>s.sala.id===salaId);
    exigir(detalle&&!detalle.administrador&&detalle.sala.estado==='abierta','Elegí una sala demo abierta como participante.');
    detalle.puedeEditarGastos=permitido;
    detalle.editores=(detalle.editores||[]).filter(id=>id!==detalle.personaPropiaId);
    if(permitido)detalle.editores.push(detalle.personaPropiaId);
    detalle.sala.revision++;await guardarSala(c,usuarioId,detalle);
  });
}
