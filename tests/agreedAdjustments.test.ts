import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {convertirMontoMovimiento} from '../src/utils/movementValidation.ts';
import {formatearMontoSocial} from '../src/social/socialHelpers.ts';

async function escenario(t:import('node:test').TestContext){
 const e=await preparar(t),usuario=await e.registrarUsuario({nombre:'Juan',apellido:'Pérez',correo:'ajustes@example.test',contrasena:'Prueba12345',confirmacion:'Prueba12345'});
 await e.crearSesion(usuario.id,false);
 const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Efectivo',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00.000Z'});
 const persona=(await e.guardarPersona({nombre:'Sofía',apellido:'Pérez',apodo:'Sofi'}))!;
 return {...e,usuario,deposito,persona,saldo:()=>Number(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual)};
}
test('registro conserva el apellido y la identidad social; homónimos admiten apodos distintos',async t=>{
 const e=await escenario(t);
 assert.equal((await e.usuariosRepositorio.consultarPorId(e.usuario.id))!.apellido,'Pérez');
 assert.equal(e.base.prepare('SELECT apellido FROM personas WHERE es_usuario_actual=1').get()!.apellido,'Pérez');
 const otra=await e.guardarPersona({nombre:'Sofía',apellido:'Pérez',apodo:'Sofi trabajo'});
 assert.notEqual(otra!.id,e.persona.id);
 await assert.rejects(e.guardarPersona({nombre:'Otra',apellido:'Persona',apodo:' sofi '}),/apodo/);
});
test('los importes conservan dos decimales y rechazan precisión adicional sin redondearla',()=>{
 assert.equal(formatearMontoSocial(1.5),'$ 1,50');assert.equal(formatearMontoSocial(1),'$ 1,00');
 assert.equal(convertirMontoMovimiento('1,501'),null);assert.equal(convertirMontoMovimiento(1.501),null);
 assert.equal(convertirMontoMovimiento('1,50'),1.5);assert.equal(convertirMontoMovimiento(0.1+0.2),0.3);
});
for(const direccion of ['debo','me_deben'])for(const pagada of [false,true])test('eliminar deuda personal '+direccion+' '+(pagada?'saldada':'parcial')+' revierte todos sus movimientos una sola vez',async t=>{
 const e=await escenario(t),deuda=await e.crearDeudaPersonal({personaId:e.persona.id,direccion,monto:120,descripcion:'Prueba de eliminación'},direccion==='me_deben'?{depositoId:e.deposito.id}:undefined);
 await e.registrarPagoDeuda({deudaId:deuda.id,monto:pagada?120:30,claveOperacion:'pago'},{depositoId:e.deposito.id});
 if(!(direccion==='me_deben'&&pagada))assert.notEqual(e.saldo(),1000);
 await e.eliminarDeudaPersonal(deuda.id);await e.eliminarDeudaPersonal(deuda.id);
 assert.equal(e.saldo(),1000);assert.equal((await e.cargarSocial()).deudas.length,0);
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM pagos_sociales WHERE deuda_id=? AND estado='vigente'").get(deuda.id)!.n,0);
 assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('eliminar rechaza acuerdos online y revierte todo si falla una corrección',async t=>{
 const e=await escenario(t),deuda=await e.crearDeudaPersonal({personaId:e.persona.id,direccion:'me_deben',monto:100,descripcion:'Préstamo'},{depositoId:e.deposito.id});
 await e.registrarPagoDeuda({deudaId:deuda.id,monto:20,claveOperacion:'pago'},{depositoId:e.deposito.id});
 e.base.prepare('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)').run(e.usuario.id,'deudas',JSON.stringify([{origenLocalId:deuda.id,estado:'pendiente'}]));
 await assert.rejects(e.eliminarDeudaPersonal(deuda.id),/online/);
 e.base.prepare("DELETE FROM datos_sociales_online WHERE clave='deudas'").run();
 const saldo=e.saldo(),movimientos=e.base.prepare('SELECT * FROM movimientos ORDER BY id').all();
 e.base.exec("CREATE TRIGGER prueba_falla_correccion BEFORE INSERT ON movimientos WHEN NEW.reversion_de_id IS NOT NULL BEGIN SELECT RAISE(ABORT,'fallo controlado'); END;");
 await assert.rejects(e.eliminarDeudaPersonal(deuda.id));
 assert.equal(e.saldo(),saldo);assert.deepEqual(e.base.prepare('SELECT * FROM movimientos ORDER BY id').all(),movimientos);
 assert.equal((await e.deudasRepositorio.consultarPorId(deuda.id))!.estado,'parcial');
});
test('el detalle de un movimiento conserva sala y concepto de origen',async t=>{
 const e=await escenario(t),sala=await e.crearSala({nombre:'Cena',fecha:'2026-11-14',icono:'people-outline',color:'#BED5C8',personasIds:[e.persona.id]});
 await e.guardarGasto({id:'gasto',salaId:sala.id,claveOperacion:'compra',descripcion:'Pizza',monto:100,categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]},{compra:{depositoId:e.deposito.id}});
 await e.cerrarSala(sala.id);
 const movimiento=e.base.prepare('SELECT movimiento_id FROM pagos_sociales WHERE clase=?').get('compra')!;
 const detalle=await e.consultarDetalleHistorialMovimiento(String(movimiento.movimiento_id));
 assert.equal(detalle!.origenSala!.sala_nombre,'Cena');assert.equal(detalle!.origenSala!.concepto,'Pizza');
});
