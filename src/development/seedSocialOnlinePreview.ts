import type { Conexion, Deposito } from '../database/types';
import type { RespuestaSala, DeudaOnline, VinculoOnline } from '../social/online/types';
/** Ejemplos visuales privados de la cuenta local de pruebas; nunca se publican. */
export async function prepararVistaSocialOnline(usuarioId: string, c: Conexion, depositos: Map<string, Deposito>) {
    const prefijo = 'demo-social:' + usuarioId, marca = prefijo + ':v1';
    if (await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?', [usuarioId, marca])) {
        await prepararEjemploDeudaDemo(usuarioId,c);await prepararEscenariosRecibidosDemo(usuarioId,c);await prepararDeudaInteractivaDemo(usuarioId,c);return;
    }
    const personas = await c.getAllAsync<{
        id: string;
        nombre: string;
    }>('SELECT id,nombre FROM personas WHERE usuario_id=? AND es_usuario_actual=0 ORDER BY nombre', [usuarioId]);
    const propia = await c.getFirstAsync<{
        id: string;
    }>('SELECT id FROM personas WHERE usuario_id=? AND es_usuario_actual=1', [usuarioId]);
    if (!propia || personas.length < 3)
        return;
    const [ana, bruno, carla] = personas, ahora = new Date().toISOString(), antes = new Date(Date.now() - 5 * 86400000).toISOString(), deposito = [...depositos.values()][0];
    const participantes = [{ id: propia.id, nombre: 'Vos', activa: true }, ...personas.map(p => ({ ...p, activa: true }))];
    const gasto = (id: string, descripcion: string, monto: number, categoriaId: string, pagadorId: string, pagaron: string[] = []) => ({ id, descripcion, monto, categoriaId, pagadorId, pagaron, fecha: antes, version: 1, reparto: 'iguales' as const, estado: 'vigente' as const, partes: participantes.map((p, orden) => ({ personaId: p.id, monto: monto / 4, orden })) });
    const abierta: RespuestaSala = { sala: { id: prefijo + ':abierta', nombre: 'Demo · Viaje con amigos', descripcion: 'Ejemplo local: solicitudes, pagos y depósitos. No conectado a un servidor.', icono: 'people-outline', color: '#BED5C8', fecha: ahora.slice(0, 10), estado: 'abierta', revision: 1, participantes, gastos: [gasto(prefijo + ':cena', 'Cena compartida', 12000, 'alimentacion', propia.id, [ana.id]), gasto(prefijo + ':taxi', 'Taxi del viaje', 6000, 'transporte', bruno.id), gasto(prefijo + ':compras', 'Compras para la casa', 8000, 'compras', carla.id, [propia.id])] }, personaPropiaId: propia.id, administrador: true, puedeEditarGastos: true, editores: [bruno.id], identidades: [{ personaId: ana.id, conCuenta: false, conAcceso: true }, { personaId: bruno.id, conCuenta: true, conAcceso: true }, { personaId: carla.id, conCuenta: true, conAcceso: true }], admisiones: [{ id: prefijo + ':ingreso', nombre: 'Lucía · Invitada nueva', estado: 'pendiente', fecha: ahora }], solicitudes: [{ id: prefijo + ':aviso', personaId: bruno.id, gasto_id: prefijo + ':cena', tipo: 'parte_pagada', monto_parte: 3000, texto: 'Ya pagué mi parte', estado: 'pendiente', fecha: ahora }, { id: prefijo + ':observacion', personaId: ana.id, gasto_id: prefijo + ':taxi', texto: 'Revisar quién participó del taxi', estado: 'pendiente', fecha: ahora }, { id: prefijo + ':resuelta', personaId: carla.id, gasto_id: prefijo + ':compras', texto: 'Corregir la descripción', estado: 'resuelta', fecha: antes }], misFinanzas: [{ clave: 'compra:' + prefijo + ':cena', gastoId: prefijo + ':cena', salaId: prefijo + ':abierta', tipo: 'egreso', categoria: 'alimentacion', monto: 12000, descripcion: 'Compra: Cena compartida', fecha: antes, seleccion: { depositoId: deposito.id } }] };
    const cerrada: RespuestaSala = { ...abierta, sala: { ...abierta.sala, id: prefijo + ':cerrada', nombre: 'Demo · Cena cerrada', estado: 'cerrada', gastos: [gasto(prefijo + ':cerrado', 'Cena con pago parcial', 8000, 'alimentacion', propia.id, [ana.id, carla.id])], obligaciones: [{ id: prefijo + ':deuda', participacionId: prefijo + ':cerrado:' + bruno.id, pendiente: 1500 }] }, admisiones: [], solicitudes: [], misFinanzas: [] };
    const participante: RespuestaSala = { ...abierta, sala: { ...abierta.sala, id: prefijo + ':participante', nombre: 'Demo · Como participante' }, administrador: false, puedeEditarGastos: false, admisiones: [], misFinanzas: abierta.misFinanzas, solicitudes: [] };
    for (const respuesta of [abierta, cerrada, participante])
        await c.runAsync('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?)', [usuarioId, respuesta.sala.id, JSON.stringify(respuesta), respuesta.administrador ? 1 : 0, propia.id, ahora]);
    const deudas: DeudaOnline[] = [{ id: prefijo + ':deuda', salaId: cerrada.sala.id, otraPersonaId: bruno.id, otraPersonaNombre: bruno.nombre, descripcion: 'Cena con pago parcial', fecha: antes, monto: 2000, pendiente: 1500, estado: 'aceptada', esAcreedor: true, esDeudor: false, puedeDecidir: false, pagos: [{ id: prefijo + ':pago', monto: 500, estado: 'confirmado', fecha: ahora, fecha_decision: ahora }, { id: prefijo + ':por-confirmar', monto: 250, estado: 'informado', fecha: ahora }] }, { id: prefijo + ':propuesta', salaId: null, otraPersonaId: carla.id, otraPersonaNombre: carla.nombre, descripcion: 'Entradas para el cine', fecha: ahora, monto: 4500, pendiente: 4500, estado: 'pendiente', esDeudor: true, esAcreedor: false, puedeDecidir: true, pagos: [] }, { id: prefijo + ':saldada', salaId: null, otraPersonaId: ana.id, otraPersonaNombre: ana.nombre, descripcion: 'Compra devuelta', fecha: antes, monto: 1200, pendiente: 0, estado: 'aceptada', esDeudor: false, esAcreedor: true, puedeDecidir: false, pagos: [{ id: prefijo + ':pago-total', monto: 1200, estado: 'confirmado', fecha: antes }] }];
    const vinculos: VinculoOnline[] = [{ id: prefijo + ':vinculo', persona_id: bruno.id, estado: 'confirmado', cuenta_id: prefijo + ':cuenta-bruno', nombre: bruno.nombre }, { id: prefijo + ':pendiente', persona_id: carla.id, estado: 'solicitado', cuenta_id: prefijo + ':cuenta-carla', nombre: carla.nombre }];
    for (const [clave, datos] of [['deudas', deudas], ['vinculos', vinculos], [marca, true]] as const)
        await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos', [usuarioId, clave, JSON.stringify(datos)]);
    await prepararEjemploDeudaDemo(usuarioId,c);
    await prepararEscenariosRecibidosDemo(usuarioId,c);await prepararDeudaInteractivaDemo(usuarioId,c);
}

export async function prepararEjemploDeudaDemo(usuarioId:string,c:Conexion){
  const marca='demo-deuda-escenarios:v1';
  if(!await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,'demo-social:'+usuarioId+':v1'])||await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,marca]))return false;
  const persona=await c.getFirstAsync<{id:string;nombre:string}>('SELECT id,nombre FROM personas WHERE usuario_id=? AND nombre=? AND es_usuario_actual=0',[usuarioId,'Bruno']);
  if(!persona)return false;
  const fila=await c.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[usuarioId]);
  const deudas:DeudaOnline[]=fila?JSON.parse(fila.datos):[],id='demo-social:'+usuarioId+':escenarios',fecha=new Date().toISOString();
  if(!deudas.some(d=>d.id===id))deudas.push({id,salaId:null,otraPersonaId:persona.id,otraPersonaNombre:persona.nombre,descripcion:'Demo · Pagos y perdón',fecha,monto:1000,pendiente:800,estado:'aceptada',esAcreedor:true,esDeudor:false,puedeDecidir:false,pagos:[{id:id+':confirmado',monto:200,estado:'confirmado',fecha,fecha_decision:fecha},{id:id+':informado',monto:150,estado:'informado',fecha}]});
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos',[usuarioId,'deudas',JSON.stringify(deudas)]);
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuarioId,marca,'true']);
  return true;
}

/** La misma cuenta de pruebas ve ahora decisiones tomadas por la otra persona. */
export async function prepararEscenariosRecibidosDemo(usuarioId:string,c:Conexion){
  const marca='demo-deudas-recibidas:v1';
  if(!await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,'demo-social:'+usuarioId+':v1'])||await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,marca]))return false;
  const otra=await c.getFirstAsync<{id:string;nombre:string;apellido:string}>('SELECT id,nombre,apellido FROM personas WHERE usuario_id=? AND nombre=? AND es_usuario_actual=0',[usuarioId,'Bruno']);
  const propia=await c.getFirstAsync<{id:string}>('SELECT id FROM personas WHERE usuario_id=? AND es_usuario_actual=1',[usuarioId]);
  if(!otra||!propia)return false;
  const prefijo='demo-social:'+usuarioId+':recibidos',salaId=prefijo+':sala',fecha=new Date(Date.now()-86400000*3).toISOString(),decision=new Date().toISOString();
  const ejemplos=[
    {clave:'perdon',descripcion:'Demo · Me perdonaron la deuda',pendiente:0,pago:0,estado:'',perdon:1000},
    {clave:'rechazado',descripcion:'Demo · Rechazaron mi pago',pendiente:1000,pago:250,estado:'rechazado',perdon:0},
    {clave:'informado',descripcion:'Demo · Mi pago espera confirmación',pendiente:1000,pago:300,estado:'informado',perdon:0},
    {clave:'confirmado',descripcion:'Demo · Confirmaron mi pago',pendiente:0,pago:1000,estado:'confirmado',perdon:0},
  ];
  const respuesta:RespuestaSala={sala:{id:salaId,nombre:'Demo · Del lado de quien debe',descripcion:'Bruno administra: te perdonó una deuda, rechazó un pago, confirmó otro y todavía revisa un aviso.',icono:'people-outline',color:'#BED5C8',fecha:fecha.slice(0,10),estado:'cerrada',revision:1,participantes:[{id:otra.id,nombre:otra.nombre+' '+otra.apellido,activa:true},{id:propia.id,nombre:'Vos',activa:true}],gastos:ejemplos.map(e=>({id:prefijo+':gasto:'+e.clave,pagadorId:otra.id,categoriaId:'alimentacion',descripcion:e.descripcion.replace('Demo · ',''),monto:2000,fecha,version:1,reparto:'iguales',partes:[{personaId:otra.id,monto:1000,orden:0},{personaId:propia.id,monto:1000,orden:1}],pagaron:[],estado:'vigente'})),obligaciones:ejemplos.map(e=>({id:prefijo+':deuda:'+e.clave,participacionId:prefijo+':gasto:'+e.clave+':'+propia.id,pendiente:e.pendiente,perdonado:e.perdon}))},personaPropiaId:propia.id,administrador:false,puedeEditarGastos:false,identidades:[{personaId:otra.id,conCuenta:true,conAcceso:true},{personaId:propia.id,conCuenta:true,conAcceso:true}],solicitudes:[],admisiones:[],misFinanzas:[]};
  await c.runAsync('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?)',[usuarioId,salaId,JSON.stringify(respuesta),0,propia.id,decision]);
  const fila=await c.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[usuarioId]);
  const deudas:DeudaOnline[]=fila?JSON.parse(fila.datos):[];
  for(const e of ejemplos){const id=prefijo+':deuda:'+e.clave;if(deudas.some(d=>d.id===id))continue;deudas.push({id,salaId,otraPersonaId:otra.id,otraPersonaNombre:otra.nombre+' '+otra.apellido,descripcion:e.descripcion,fecha,monto:1000,pendiente:e.pendiente,estado:'aceptada',esAcreedor:false,esDeudor:true,puedeDecidir:false,perdon:e.perdon?{monto:e.perdon,fecha:decision}:null,pagos:e.pago?[{id:prefijo+':pago:'+e.clave,monto:e.pago,estado:e.estado,fecha,fecha_decision:e.estado==='informado'?null:decision}]:[]});}
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos',[usuarioId,'deudas',JSON.stringify(deudas)]);
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuarioId,marca,'true']);
  return true;
}

/** Deuda sin resolver para recorrer varias respuestas de Bruno sobre el mismo historial. */
export async function prepararDeudaInteractivaDemo(usuarioId:string,c:Conexion) {
  const prefijo='demo-social:'+usuarioId+':recibidos',salaId=prefijo+':sala',id=prefijo+':interactiva';
  const marca='demo-deuda-interactiva:v1';
  if(await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,marca]))return false;
  const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuarioId,salaId]);
  if(!fila)return false;
  const detalle:RespuestaSala=JSON.parse(fila.datos),otra=detalle.sala.participantes.find(p=>p.id!==detalle.personaPropiaId);
  if(!otra)return false;
  const cache=await c.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[usuarioId]);
  const deudas:DeudaOnline[]=cache?JSON.parse(cache.datos):[],fecha=new Date().toISOString();
  if(!deudas.some(d=>d.id===id)){
    deudas.push({id,salaId,otraPersonaId:otra.id,otraPersonaNombre:otra.nombre,descripcion:'Demo · Compra compartida con Bruno',fecha,monto:1000,pendiente:1000,estado:'aceptada',esAcreedor:false,esDeudor:true,puedeDecidir:false,pagos:[]});
    detalle.sala.gastos.push({id:id+':gasto',pagadorId:otra.id,categoriaId:'compras',descripcion:'Compra compartida con Bruno',monto:2000,fecha,version:1,reparto:'iguales',partes:[{personaId:otra.id,monto:1000,orden:0},{personaId:detalle.personaPropiaId,monto:1000,orden:1}],pagaron:[],estado:'vigente'});
    detalle.sala.obligaciones!.push({id,participacionId:id+':gasto:'+detalle.personaPropiaId,pendiente:1000});
    await c.runAsync('UPDATE salas_online_locales SET datos=?,fecha_actualizacion=? WHERE usuario_id=? AND sala_id=?',[JSON.stringify(detalle),fecha,usuarioId,salaId]);
    await c.runAsync('UPDATE datos_sociales_online SET datos=? WHERE usuario_id=? AND clave=?',[JSON.stringify(deudas),usuarioId,'deudas']);
  }
  await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuarioId,marca,'true']);
  return true;
}
