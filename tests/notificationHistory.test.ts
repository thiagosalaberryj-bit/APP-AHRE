import test from 'node:test';
import assert from 'node:assert/strict';
import { preparar } from './helpers/localDatabase.ts';
import { TIPOS_AVISO } from '../src/notifications/types.ts';

test('la demo cubre todos los tipos y pagina 10 + 8 sin repetir ni restablecer las vistas',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const primera=await e.cargarPaginaAvisos('todas');assert.equal(primera.avisos.length,10);assert.ok(primera.siguiente);
 const segunda=await e.cargarPaginaAvisos('todas',primera.siguiente!);assert.equal(segunda.avisos.length,8);assert.equal(segunda.siguiente,null);
 const todas=[...primera.avisos,...segunda.avisos];assert.equal(new Set(todas.map(a=>a.id)).size,18);
 assert.deepEqual([...new Set(todas.map(a=>a.tipo))].sort(),[...TIPOS_AVISO].sort());
 const sinVer=await e.contarAvisosNoVistos();const aviso=todas.find(a=>!a.vista)!;
 await e.marcarAvisoVisto(aviso.id);assert.equal(await e.contarAvisosNoVistos(),sinVer-1);
 await e.prepararDatosPrueba({vistaSocialOnline:true});assert.equal(await e.contarAvisosNoVistos(),sinVer-1);
 const repetida=await e.cargarPaginaAvisos('todas');
 assert.deepEqual(repetida.avisos.map(a=>[a.id,a.fecha]),primera.avisos.map(a=>[a.id,a.fecha]));
 const restantes=await e.cargarPaginaAvisos('todas',repetida.siguiente!);
 assert.deepEqual(restantes.avisos.map(a=>a.id),segunda.avisos.map(a=>a.id));
 const pendientes=await e.cargarPaginaAvisos('pendientes');assert.ok(pendientes.avisos.every(a=>!a.resuelta));
 const noVistas=await e.cargarPaginaAvisos('no_vistas');assert.ok(noVistas.avisos.every(a=>!a.vista));
});

test('combina locales y servidor con un cursor común, filtros actuales y copia offline sin duplicados',async t=>{
 let offline=false,llamadas=0;
 const remoto:import('../src/notifications/types.ts').Aviso[]=Array.from({length:23},(_,i)=>({id:String(i).padStart(64,'0'),tipo:'social',titulo:'Remoto',mensaje:'Prueba',destino:{tipo:'personas'},fecha:new Date(Date.parse('2026-11-12T10:00:00Z')-i*120000).toISOString(),vista:false,resuelta:false}));
 const e=await preparar(t,true,{url:'http://example.test/api/v1',fetch:async entrada=>{
  llamadas++;if(offline)throw Error('sin red');const url=new URL(String(entrada)),antes=url.searchParams.get('antes')||'',filtro=url.searchParams.get('filtro');
  const candidatas=remoto.filter(a=>(!antes||a.fecha+a.id<antes)&&(filtro!=='pendientes'||!a.resuelta)&&(filtro!=='no_vistas'||!a.vista));
  const avisos=candidatas.slice(0,10),ultimo=avisos.at(-1);
  return Response.json({avisos,noVistas:23,siguiente:candidatas.length>10?ultimo!.fecha+ultimo!.id:null});
 }});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);e.base.exec('DELETE FROM sync_outbox');
 await e.guardarSesionRemota(usuario.id,{token:'ab'.repeat(32),vence:Date.now()+3600000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
 const locales=Array.from({length:7},(_,i)=>({...remoto[i],id:'local-'+i,tipo:'debo' as const,fecha:new Date(Date.parse(remoto[i].fecha)-60000).toISOString()}));
 for(const a of locales)await e.guardarAvisoLocal(a);
 const encontrados:import('../src/notifications/types.ts').Aviso[]=[];let cursor='';
 do{const pagina=await e.cargarPaginaAvisos('todas',cursor);assert.ok(pagina.avisos.length<=10);encontrados.push(...pagina.avisos);cursor=pagina.siguiente||'';}while(cursor);
 const esperado=[...remoto,...locales].sort((a,b)=>(b.fecha+b.id).localeCompare(a.fecha+a.id));
 assert.deepEqual(encontrados.map(a=>a.id),esperado.map(a=>a.id));assert.equal(new Set(encontrados.map(a=>a.id)).size,30);assert.ok(llamadas<=4);
 remoto[0].resuelta=true;const pendientes=await e.cargarPaginaAvisos('pendientes');assert.ok(!pendientes.avisos.some(a=>a.id===remoto[0].id));assert.ok(pendientes.avisos.some(a=>a.id.startsWith('local-')));
 offline=true;const copia=await e.cargarPaginaAvisos('todas');assert.deepEqual(copia.avisos.map(a=>a.id),esperado.slice(0,10).map(a=>a.id));
});

test('el historial remoto pide una sola página por acción y conserva la copia para offline',async t=>{
 let llamadas=0,offline=false;
 const avisos=Array.from({length:23},(_,i)=>({id:String(i).padStart(64,'0'),tipo:'social',titulo:'Aviso '+i,mensaje:'Prueba',destino:{tipo:'personas'},fecha:new Date(Date.now()-i*60000).toISOString(),vista:false,resuelta:true}));
 const e=await preparar(t,true,{url:'http://example.test/api/v1',fetch:async entrada=>{
  llamadas++;if(offline)throw Error('sin red');const url=new URL(String(entrada));assert.equal(url.searchParams.get('limite'),'10');
  const antes=url.searchParams.get('antes');const indice=antes?avisos.findIndex(a=>a.fecha+a.id===antes)+1:0;
  const pagina=avisos.slice(indice,indice+10),ultimo=pagina.at(-1)!;
  return Response.json({avisos:pagina,noVistas:23,siguiente:indice+10<avisos.length?ultimo.fecha+ultimo.id:null});
 }});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);e.base.exec('DELETE FROM sync_outbox');
 await e.guardarSesionRemota(usuario.id,{token:'ab'.repeat(32),vence:Date.now()+3600000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
 const primera=await e.cargarPaginaAvisos('todas');assert.equal(llamadas,1);assert.equal(primera.avisos.length,10);assert.equal(await e.contarAvisosNoVistos(),23);
 const segunda=await e.cargarPaginaAvisos('todas',primera.siguiente!);assert.equal(llamadas,2);assert.equal(segunda.avisos.length,10);
 offline=true;const local=await e.cargarPaginaAvisos('todas');assert.equal(local.avisos.length,10);assert.equal(llamadas,3);
});

test('una respuesta antigua de preferencias del backend no pisa un horario que se acaba de guardar',async t=>{
 let servidor:unknown=null;
 let liberar!:(respuesta:Response)=>void,iniciada!:()=>void,esperar=true;
 const inicio=new Promise<void>(r=>iniciada=r);
 let e:Awaited<ReturnType<typeof preparar>>;
 e=await preparar(t,true,{url:'http://example.test/api/v1',fetch:async(entrada,opciones)=>{
  const ruta=new URL(String(entrada)).pathname;
  if(ruta.endsWith('/mercado-pago'))return Response.json(e.ESTADO_MP_INICIAL);
  if(ruta.endsWith('/notificaciones'))return Response.json({avisos:[],siguiente:null});
  if(ruta.endsWith('/notificaciones/preferencias')){
   if(opciones?.method==='POST'){servidor=JSON.parse(String(opciones.body));return new Response(null,{status:204});}
   if(esperar){iniciada();return new Promise<Response>(r=>liberar=r);}
   return Response.json(servidor);
  }
  throw Error('Ruta inesperada: '+ruta);
 }});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);e.base.exec('DELETE FROM sync_outbox');
 await e.guardarSesionRemota(usuario.id,{token:'ab'.repeat(32),vence:Date.now()+3600000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
 const anterior=await e.cargarAjustesAvisos();servidor=anterior;
 const sincronizacion=e.sincronizarIntegraciones(false,false);await inicio;
 const nuevo=JSON.parse(JSON.stringify(anterior));nuevo.tipos.me_deben.hora='16:35';await e.guardarYProgramarAvisos(nuevo);
 liberar(Response.json(anterior));await sincronizacion;assert.equal((await e.cargarAjustesAvisos()).tipos.me_deben.hora,'16:35');
 esperar=false;await e.sincronizarIntegraciones(false,false);assert.equal((await e.cargarAjustesAvisos()).tipos.me_deben.hora,'16:35');
});
