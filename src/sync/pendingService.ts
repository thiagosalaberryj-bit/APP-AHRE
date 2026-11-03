import {ejecutarLecturaConConexion} from '../database/connectionQueue';
import {obtenerSesionActual} from '../authentication/sessionService';
import {consultarAutorizacion,esPruebaLocal} from './deviceAuthorization';
import type {Conexion} from '../database/types';
import type {CambioSync,TablaSync} from './protocol';

const AGRUPACION=`SELECT json_extract(cambio,'$.tabla') tabla,json_extract(cambio,'$.datos.id') id,MIN(secuencia) orden,MAX(secuencia) ultima FROM sync_outbox WHERE usuario_id=? GROUP BY tabla,id`;
export const contarRegistrosPendientes=(usuarioId:string,conexion:Conexion|null=null)=>ejecutarLecturaConConexion(async c=>Number((await c.getFirstAsync<{n:number}>(`SELECT COUNT(*) n FROM (${AGRUPACION})`,[usuarioId]))?.n||0),conexion);
export const formatearCantidadPendientes=(cantidad:number)=>cantidad>999?'...':String(Math.max(0,cantidad));
const NOMBRES:Record<TablaSync,string>={usuarios:'Perfil',depositos:'Depósito',historial_saldos_deposito:'Ajuste de saldo',preferencias:'Preferencias',recurrencias:'Recurrencia',transferencias:'Transferencia',movimientos:'Movimiento',personas:'Persona',salas:'Sala',personas_sala:'Participante de sala',gastos_compartidos:'Gasto compartido',participantes_gasto:'Reparto de gasto',deudas:'Deuda',pagos_sociales:'Pago'};
export interface RegistroPendiente {id:string;titulo:string;descripcion:string;fecha:string;importe:number|null;}
export async function consultarPendientes(limite=30,desplazamiento=0):Promise<{total:number;registros:RegistroPendiente[];soloLocal:boolean}>{
  const {usuario}=await obtenerSesionActual();
  if(!usuario)return {total:0,registros:[],soloLocal:false};
  if(esPruebaLocal(await consultarAutorizacion(usuario.id),usuario.correo_electronico))return {total:0,registros:[],soloLocal:true};
  const {total,filas}=await ejecutarLecturaConConexion(async c=>({
    total:await contarRegistrosPendientes(usuario.id,c),
    filas:await c.getAllAsync<{tabla:TablaSync;id:string;cambio:string}>(`SELECT g.tabla,g.id,o.cambio FROM (${AGRUPACION}) g JOIN sync_outbox o ON o.secuencia=g.ultima ORDER BY g.orden LIMIT ? OFFSET ?`,[usuario.id,Math.min(100,Math.max(1,limite)),Math.max(0,desplazamiento)])}));
  return {total,soloLocal:false,registros:filas.map(f=>{
    const {datos,accion}=JSON.parse(f.cambio) as CambioSync;
    const nombre=typeof datos.nombre==='string'?datos.nombre:typeof datos.descripcion==='string'?datos.descripcion:undefined;
    const etiqueta=f.tabla==='movimientos'?(datos.tipo==='ingreso'?'Ingreso':datos.tipo==='egreso'?'Egreso':'Movimiento'):NOMBRES[f.tabla];
    const importe=[datos.monto,datos.monto_total,f.tabla==='depositos'?datos.saldo_actual:undefined].find(v=>typeof v==='number');
    const accionVisible=accion==='eliminar'?'Eliminación':datos.activo===0||datos.activa===0?'Desactivación':datos.estado==='cancelada'||datos.estado==='cancelado'?'Cancelación':datos.estado==='anulado'||datos.anulado===1?'Anulación':datos.estado==='cerrada'?'Cierre':'Actualización';
    return {id:`${f.tabla}:${f.id}`,titulo:nombre?`${etiqueta}: ${nombre}`:etiqueta,descripcion:`${accionVisible} pendiente de confirmar en el servidor.`,fecha:String(datos.fecha_actualizacion||datos.fecha_hora||datos.fecha_creacion||datos.fecha||''),importe:typeof importe==='number'?importe:null};
  })};
}
