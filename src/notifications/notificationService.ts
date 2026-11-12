import type { OperacionMp } from '../mercadoPago/types';
import { obtenerSesionRemota, solicitarRemoto, ErrorRemoto } from '../sync/remote';
import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import { avisarIntegraciones, encolarIntegracion, guardarDato, leerDato } from '../integrations/integrationStore';
import { ajustesPredeterminados, validarAjustes, type AjustesAvisos, type Aviso } from './types';

export async function cargarAjustesAvisos() { const { usuario } = await obtenerSesionActual(); return usuario ? leerDato(usuario.id, 'avisos:ajustes', ajustesPredeterminados()) : ajustesPredeterminados(); }
export async function guardarAjustesAvisos(datos: AjustesAvisos) {
  validarAjustes(datos); const { usuario } = await obtenerSesionActual(); if (!usuario) throw new Error('Iniciá sesión.');
  await ejecutarTransaccion(async c => {
    await guardarDato(c, usuario.id, 'avisos:ajustes', datos);
    await c.runAsync("DELETE FROM integraciones_outbox WHERE usuario_id=? AND ruta='/notificaciones/preferencias'", [usuario.id]);
    await encolarIntegracion(c, usuario.id, '/notificaciones/preferencias', { ...datos });
  }); avisarIntegraciones();
}
export async function consultarAvisos(filtro: 'todas' | 'pendientes' | 'no_vistas', limite = 10) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return { avisos: [] as Aviso[], total: 0, noVistas: 0 };
  return ejecutarLecturaConConexion(async c => {
    const condicion = filtro === 'pendientes' ? ' AND resuelta=0' : filtro === 'no_vistas' ? ' AND vista=0' : '';
    const filas = await c.getAllAsync<{ datos: string; vista: number; resuelta: number }>('SELECT datos,vista,resuelta FROM avisos_locales WHERE usuario_id=?' + condicion + ' ORDER BY fecha DESC,id DESC LIMIT ?', [usuario.id, limite]);
    const total = await c.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM avisos_locales WHERE usuario_id=?' + condicion, [usuario.id]);
    const noVistas = await c.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM avisos_locales WHERE usuario_id=? AND vista=0', [usuario.id]);
    return { avisos: filas.map(f => ({ ...JSON.parse(f.datos) as Aviso, vista: !!f.vista, resuelta: !!f.resuelta })), total: Number(total?.n || 0), noVistas: Number(noVistas?.n || 0) };
  });
}
export async function marcarAvisoVisto(id: string) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return;
  await ejecutarTransaccion(async c => {
    const fila = await c.getFirstAsync<{ remota: number; fecha: string }>('SELECT remota,fecha FROM avisos_locales WHERE usuario_id=? AND id=?', [usuario.id, id]);
    const anterior=await c.getFirstAsync<{vista:number;remota:number}>('SELECT vista,remota FROM avisos_locales WHERE usuario_id=? AND id=?',[usuario.id,id]);
    if(anterior?.remota&&!anterior.vista)await guardarDato(c,usuario.id,'avisos:remotas-no-vistas',Math.max(0,(await leerDato<number>(usuario.id,'avisos:remotas-no-vistas',0,c))-1));
    await c.runAsync('UPDATE avisos_locales SET vista=1 WHERE usuario_id=? AND id=?', [usuario.id, id]);
    await guardarDato(c, usuario.id, 'avisos:visto:' + id, fila?.fecha || new Date().toISOString());
    if (fila?.remota || /^[a-f0-9]{64}$/.test(id)) await encolarIntegracion(c, usuario.id, '/notificaciones/vistas', { ids: [id] });
  }); avisarIntegraciones();
}
export async function guardarAvisoLocal(aviso: Aviso) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return;
  await ejecutarTransaccion(c => c.runAsync('INSERT INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta) VALUES(?,?,?,?,?,?) ON CONFLICT(usuario_id,id) DO UPDATE SET datos=excluded.datos,resuelta=excluded.resuelta', [usuario.id, aviso.id, JSON.stringify(aviso), aviso.fecha, aviso.vista ? 1 : 0, aviso.resuelta ? 1 : 0]));
}

export async function contarAvisosNoVistos(){const {usuario}=await obtenerSesionActual();if(!usuario)return 0;return ejecutarLecturaConConexion(async c=>{const fila=await c.getFirstAsync<{total:number;locales:number}>('SELECT COUNT(*) total,SUM(CASE WHEN remota=0 THEN 1 ELSE 0 END) locales FROM avisos_locales WHERE usuario_id=? AND vista=0',[usuario.id]);const remoto=await leerDato<number|null>(usuario.id,'avisos:remotas-no-vistas',null,c);return remoto===null?Number(fila?.total||0):Number(fila?.locales||0)+remoto;});}
export async function cargarPaginaAvisos(filtro:'todas'|'pendientes'|'no_vistas',antes=''){
 const {usuario}=await obtenerSesionActual();if(!usuario)return {avisos:[] as Aviso[],siguiente:null as string|null};
 const remota=await obtenerSesionRemota(usuario.id);
 if(remota)try{
  const pagina=await solicitarRemoto<{avisos:Aviso[];siguiente:string|null;noVistas?:number}>('/notificaciones?limite=10&filtro='+filtro+'&antes='+encodeURIComponent(antes),undefined,remota.token);
  if((await obtenerSesionActual()).usuario?.id!==usuario.id)return {avisos:[],siguiente:null};
  if(!Array.isArray(pagina.avisos)||pagina.avisos.length>10)throw new Error('Actualizá el backend para cargar notificaciones de a diez.');
  await ejecutarTransaccion(async c=>{if(Number.isFinite(pagina.noVistas))await guardarDato(c,usuario.id,'avisos:remotas-no-vistas',pagina.noVistas);for(const aviso of pagina.avisos){const visto=await leerDato<string|null>(usuario.id,'avisos:visto:'+aviso.id,null,c);if(visto&&visto>=aviso.fecha)aviso.vista=true;if(aviso.tipo==='mercado_pago'&&await c.getFirstAsync("SELECT id FROM integraciones_outbox WHERE usuario_id=? AND ruta='/mercado-pago/decisiones' LIMIT 1",[usuario.id])){const ops=await leerDato<OperacionMp[]>(usuario.id,'mp:operaciones',[],c);aviso.pendientes=ops.filter(o=>o.decision==='pendiente'||o.revisionPendiente).length;aviso.resuelta=aviso.pendientes===0;aviso.mensaje=ops.length+' obtenidos · '+aviso.pendientes+' pendientes';}await c.runAsync('INSERT INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta,remota) VALUES(?,?,?,?,?,?,1) ON CONFLICT(usuario_id,id) DO UPDATE SET datos=excluded.datos,fecha=excluded.fecha,vista=CASE WHEN avisos_locales.fecha>=excluded.fecha THEN MAX(avisos_locales.vista,excluded.vista) ELSE excluded.vista END,resuelta=excluded.resuelta',[usuario.id,aviso.id,JSON.stringify(aviso),aviso.fecha,aviso.vista?1:0,aviso.resuelta?1:0]);}});
  const locales=await paginaLocal(usuario.id,filtro,antes,true);
  const combinados=[...pagina.avisos,...locales.avisos]
   .filter(a=>filtro==='pendientes'?!a.resuelta:filtro==='no_vistas'?!a.vista:true)
   .sort((a,b)=>a.fecha+a.id<b.fecha+b.id?1:a.fecha+a.id>b.fecha+b.id?-1:0);
  const avisos=combinados.slice(0,10),ultimo=avisos.at(-1);
  return {avisos,siguiente:ultimo?(combinados.length>10||pagina.siguiente||locales.siguiente?ultimo.fecha+ultimo.id:null):pagina.siguiente};
 }catch(error){if(!(error instanceof ErrorRemoto)||error.estado!==0)throw error;}
 return paginaLocal(usuario.id,filtro,antes);
}

async function paginaLocal(usuarioId:string,filtro:'todas'|'pendientes'|'no_vistas',antes:string,soloLocales=false){
 return ejecutarLecturaConConexion(async c=>{
  const condicion=(soloLocales?' AND remota=0':'')+(filtro==='pendientes'?' AND resuelta=0':filtro==='no_vistas'?' AND vista=0':'');
  const filas=await c.getAllAsync<{datos:string;vista:number;resuelta:number}>('SELECT datos,vista,resuelta FROM avisos_locales WHERE usuario_id=?'+condicion+" AND (?='' OR fecha||id<?) ORDER BY fecha DESC,id DESC LIMIT 11",[usuarioId,antes,antes]);
  const avisos=filas.slice(0,10).map(f=>({...JSON.parse(f.datos) as Aviso,vista:!!f.vista,resuelta:!!f.resuelta})),ultimo=avisos.at(-1);
  return {avisos,siguiente:filas.length>10&&ultimo?ultimo.fecha+ultimo.id:null};
 });
}
