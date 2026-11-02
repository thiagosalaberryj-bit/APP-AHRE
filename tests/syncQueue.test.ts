import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import { randomUUID } from 'node:crypto';
import { preparar } from './helpers/localDatabase.ts';
import type { LoteSync } from '../src/sync/protocol.ts';

async function escenario(prueba:TestContext) {
  let revision=0,offline=false,perderRespuesta=false,conflicto=false;
  const recibidos:LoteSync[]=[],aceptados=new Map<string,number>();
  const transporte:typeof fetch=async(_url,opciones)=>{
    if(offline)throw new Error('sin red');
    if(opciones?.method==='POST') {
      const lote=JSON.parse(String(opciones.body)) as LoteSync;recibidos.push(lote);
      const previa=aceptados.get(lote.id);
      if(previa)return Response.json({revision:previa});
      if(conflicto||lote.base!==revision)return Response.json({error:'Conflicto de revisión.'},{status:409});
      revision++;aceptados.set(lote.id,revision);
      if(perderRespuesta){perderRespuesta=false;throw new Error('respuesta perdida');}
      return Response.json({revision});
    }return Response.json({lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'http://127.0.0.1:4000/api/v1',fetch:transporte});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Sincronización',correo_electronico:'sync@example.test',activo:1});
  await e.crearSesion(usuario.id,false);
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario},false);
  await e.sincronizarCuenta(usuario.id);recibidos.length=0;
  const deposito=()=>e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Nuevo',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00.000Z'});
  const movimiento=(depositoId:string)=>e.movimientosRepositorio.crear({deposito_id:depositoId,tipo:'egreso',categoria:'alimentacion',monto:50,descripcion:'Compra offline',fecha_hora:new Date().toISOString()});
  const cola=()=>e.base.prepare('SELECT lote,cambio FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia').all(usuario.id);
  return {...e,usuario,deposito,movimiento,cola,recibidos,aceptados,desconectar:()=>{offline=true;},conectar:()=>{offline=false;},perderRespuesta:()=>{perderRespuesta=true;},crearConflicto:()=>{conflicto=true;}};
}

test('la cola sube primero el depósito y luego el movimiento, con el saldo en su mismo lote',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const deposito=await e.deposito();await e.movimiento(deposito.id);
  await e.sincronizarCuenta(e.usuario.id);assert.ok(e.cola().length>0);
  e.conectar();await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.cola().length,0);assert.equal(e.recibidos.length,2);
  assert.equal(e.recibidos[0].cambios[0].tabla,'depositos');
  assert.ok(e.recibidos[1].cambios.some(c=>c.tabla==='movimientos'));
  assert.ok(e.recibidos[1].cambios.some(c=>c.tabla==='depositos'&&c.datos.saldo_actual===950));
  assert.equal(e.recibidos[1].base,e.recibidos[0].base+1);
});
test('una respuesta perdida conserva el lote y reintenta el mismo envío sin duplicarlo',async prueba=>{
  const e=await escenario(prueba);await e.deposito();e.perderRespuesta();
  await e.sincronizarCuenta(e.usuario.id);const antes=e.cola().length;assert.ok(antes>0);
  const n=e.aceptados.size;await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.cola().length,0);assert.equal(e.aceptados.size,n);
  assert.deepEqual(e.recibidos[0],e.recibidos[1]);
});
test('un conflicto detiene el orden y conserva ese lote y todos los siguientes',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();await e.movimiento(deposito.id);
  const n=e.cola().length;e.crearConflicto();let estado='';const dejar=e.observarSincronizacion(v=>{estado=v.estado;});
  await e.sincronizarCuenta(e.usuario.id);dejar();
  assert.equal(estado,'conflicto');assert.equal(e.recibidos.length,1);assert.equal(e.cola().length,n);
});
test('un rollback no deja registros ni eventos de una transacción incompleta',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();const antes=e.cola().length;
  e.base.exec("CREATE TRIGGER fallo_saldo BEFORE UPDATE OF saldo_actual ON depositos BEGIN SELECT RAISE(ABORT,'fallo');END;");
  await assert.rejects(e.movimiento(deposito.id));
  assert.equal(e.cola().length,antes);assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()!.n,0);
});
test('la cola persiste en SQLite y el orden no depende del reloj del dispositivo',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();await e.movimiento(deposito.id);
  const antes=JSON.stringify(e.cola());
  await e.sincronizarCuenta('');assert.equal(JSON.stringify(e.cola()),antes);
  const secuencias=e.base.prepare('SELECT secuencia FROM sync_outbox ORDER BY secuencia').all().map(f=>Number(f.secuencia));
  assert.ok(secuencias.every((n,i)=>i===0||n>secuencias[i-1]));
  await e.sincronizarCuenta(e.usuario.id);assert.equal(e.cola().length,0);
});
test('una cuenta creada offline conserva cada evento antes de su primera sincronización',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const usuario=await e.registrarUsuario({nombre:'Sin señal',correo:'nueva@example.test',contrasena:'ClaveNueva123!',confirmacion:'ClaveNueva123!'});
  await e.iniciarSesion({correo:'nueva@example.test',contrasena:'ClaveNueva123!',recordar:false});
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Antes',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00.000Z'});
  await e.depositosRepositorio.actualizar(deposito.id,{nombre:'Después'});
  const leer=()=>e.base.prepare('SELECT cambio FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia').all(usuario.id);
  const antes=JSON.stringify(leer());await e.sincronizarCuenta(usuario.id);
  assert.equal(JSON.stringify(leer()),antes);
  const cambios=leer().map(f=>JSON.parse(String(f.cambio)) as LoteSync['cambios'][number]).filter(c=>c.tabla==='depositos');
  assert.deepEqual(cambios.map(c=>c.datos.nombre),['Antes','Después']);
});
test('un servidor sin desplegar o en mantenimiento no impide el registro ni el ingreso local',async prueba=>{
  for(const codigo of [404,503]) {
    const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>Response.json({error:'no disponible'},{status:codigo})});
    const usuario=await e.registrarUsuario({nombre:'Local',correo:`local${codigo}@example.test`,contrasena:'ClaveLocal123!',confirmacion:'ClaveLocal123!'});
    await e.iniciarSesion({correo:`local${codigo}@example.test`,contrasena:'ClaveLocal123!',recordar:false});
    assert.equal((await e.obtenerSesionActual()).usuario!.id,usuario.id);
    let estado='';const dejar=e.observarSincronizacion(v=>{estado=v.estado;});await e.sincronizarCuenta(usuario.id);dejar();
    assert.equal(estado,'offline');assert.ok(Number(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox').get()!.n)>0);
  }
});
