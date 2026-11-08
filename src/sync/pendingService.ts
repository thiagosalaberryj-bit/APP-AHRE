import {ejecutarLecturaConConexion} from '../database/connectionQueue';
import {obtenerSesionActual} from '../authentication/sessionService';
import {consultarAutorizacion,esPruebaLocal} from './deviceAuthorization';
import type {Conexion} from '../database/types';
import type {CambioSync,TablaSync} from './protocol';

const AGRUPACION=`SELECT json_extract(cambio,'$.tabla') tabla,json_extract(cambio,'$.datos.id') id,MIN(secuencia) orden,MAX(secuencia) ultima FROM sync_outbox WHERE usuario_id=? GROUP BY tabla,id`;
export const contarRegistrosPendientes=(usuarioId:string,conexion:Conexion|null=null)=>ejecutarLecturaConConexion(async c=>Number((await c.getFirstAsync<{n:number}>(`SELECT COUNT(*) n FROM (${AGRUPACION})`,[usuarioId]))?.n||0),conexion);
export const formatearCantidadPendientes=(cantidad:number)=>cantidad>999?'...':String(Math.max(0,cantidad));
const NOMBRES:Record<TablaSync,string>={usuarios:'Perfil',depositos:'Depósito',historial_saldos_deposito:'Ajuste de saldo',preferencias:'Preferencias',recurrencias:'Recurrencia',ejecuciones_recurrencia:'Ejecución recurrente',transferencias:'Transferencia',movimientos:'Movimiento',personas:'Persona',salas:'Sala',personas_sala:'Participante de sala',gastos_compartidos:'Gasto compartido',participantes_gasto:'Reparto de gasto',deudas:'Deuda',pagos_sociales:'Pago'};
export interface RegistroPendiente {id:string;titulo:string;descripcion:string;accion:string;fecha:string;importe:number|null;}
export interface DatosPendientes {total:number;registros:RegistroPendiente[];soloLocal:boolean;ultimaSincronizacion:string|null;}
export async function consultarPendientes(limite=30,desplazamiento=0):Promise<DatosPendientes>{
  const {usuario}=await obtenerSesionActual();
  if(!usuario)return {total:0,registros:[],soloLocal:false,ultimaSincronizacion:null};
  if(esPruebaLocal(await consultarAutorizacion(usuario.id),usuario.correo_electronico))return {total:0,registros:[],soloLocal:true,ultimaSincronizacion:null};
  const cantidad=Math.min(100,Math.max(1,limite)),inicio=Math.max(0,desplazamiento);
  const {total,ultima,filas,sociales}=await ejecutarLecturaConConexion(async c=>({
    total:await contarRegistrosPendientes(usuario.id,c),
    sociales:await consultarPendientesSociales(usuario.id,c),
    ultima:await c.getFirstAsync<{fecha:string}>('SELECT fecha FROM sync_last_success WHERE usuario_id=?',[usuario.id]),
    filas:await c.getAllAsync<{tabla:TablaSync;id:string;cambio:string;fecha:string|null}>(`SELECT g.tabla,g.id,o.cambio,d.fecha FROM (${AGRUPACION}) g JOIN sync_outbox o ON o.secuencia=g.ultima LEFT JOIN sync_local_dates d ON d.secuencia=o.secuencia ORDER BY COALESCE(d.fecha,'') DESC,g.ultima DESC LIMIT ? OFFSET ?`,[usuario.id,inicio+cantidad,0])}));
  const privados:RegistroPendiente[]=filas.map(f=>{
    const {datos,accion}=JSON.parse(f.cambio) as CambioSync;
    const nombre=typeof datos.nombre==='string'?datos.nombre:typeof datos.descripcion==='string'?datos.descripcion:undefined;
    const etiqueta=f.tabla==='movimientos'?(datos.tipo==='ingreso'?'Ingreso':datos.tipo==='egreso'?'Egreso':'Movimiento'):NOMBRES[f.tabla];
    const importe=[datos.monto,datos.monto_total,f.tabla==='depositos'?datos.saldo_actual:undefined].find(v=>typeof v==='number');
    const accionVisible=accion==='eliminar'?'Eliminación':datos.activo===0||datos.activa===0?'Desactivación':datos.estado==='cancelada'||datos.estado==='cancelado'?'Cancelación':datos.estado==='anulado'||datos.anulado===1?'Anulación':datos.estado==='cerrada'?'Cierre':'Actualización';
    return {id:`${f.tabla}:${f.id}`,titulo:nombre?`${etiqueta}: ${nombre}`:etiqueta,accion:accionVisible,descripcion:`${accionVisible} pendiente de confirmar en el servidor.`,fecha:f.fecha??'',importe:typeof importe==='number'?importe:null};
  });
  return {total:total+sociales.length,soloLocal:false,ultimaSincronizacion:ultima?.fecha??null,registros:[...privados,...sociales].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(inicio,inicio+cantidad)};
}

async function consultarPendientesSociales(usuarioId:string,c:Conexion):Promise<RegistroPendiente[]>{
  const comandos=await c.getAllAsync<{id:string;datos:string;error:string|null;fecha_creacion:string}>('SELECT id,datos,error,fecha_creacion FROM comandos_sociales_locales WHERE usuario_id=? ORDER BY secuencia DESC',[usuarioId]);
  const solicitudes=await c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'solicitud-pendiente:%'",[usuarioId]);
  return [...comandos.map(f=>{const d=JSON.parse(f.datos) as import('../social/online/types').ComandoOnline;return {id:'social:'+f.id,titulo:d.gasto?'Gasto de sala: '+d.gasto.descripcion:d.tipo==='guardar_lista'?'Lista de gastos de sala':d.tipo==='cerrar'?'Cierre de sala':d.tipo==='integrantes'?'Personas de sala':'Cambio de sala',descripcion:f.error||'Cambio compartido pendiente de confirmar en el servidor.',accion:f.error?'Requiere revisión':'Envío social',fecha:f.fecha_creacion,importe:d.gasto?.monto??null};}),...solicitudes.map(f=>{const d=JSON.parse(f.datos) as {datos:{texto:string};fecha?:string;error?:string};return {id:'social:'+f.clave,titulo:'Solicitud: '+d.datos.texto,descripcion:d.error||'Solicitud pendiente de enviar al administrador.',accion:d.error?'Requiere revisión':'Solicitud',fecha:d.fecha||'',importe:null};})];
}
