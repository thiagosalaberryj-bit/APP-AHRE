import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';
import type {OperacionPersonal} from '../src/social/online/types.ts';

for(const tipo of ['egreso','ingreso'] as const)test('pago online con depósito: '+tipo+' recupera una respuesta perdida sin duplicar el movimiento',async prueba=>{
  let revision=0,pagoId='pago-recibido',registrado=false,perder=true;
  const solicitudes:string[]=[],resultados=new Map<string,object>();
  const fecha=new Date().toISOString();
  const operacion=():OperacionPersonal=>({clave:'pago:'+pagoId+':'+(tipo==='egreso'?'salida':'entrada'),pagoId,deudaId:'deuda',salaId:null,tipo,monto:15,categoria:tipo==='egreso'?'deudas':'devoluciones',descripcion:'Pago parcial',fecha});
  const transporte:typeof fetch=async(url,opciones)=>{
    const ruta=String(url),datos=opciones?.body?JSON.parse(String(opciones.body)):undefined;
    if(ruta.endsWith('/deudas/deuda/pagos')||ruta.endsWith('/pagos/pago-recibido/decidir')){
      assert.equal(datos.depositoId,undefined); // El depósito queda como dato privado local.
      solicitudes.push(datos.idOperacion);
      if(resultados.has(datos.idOperacion))return Response.json(resultados.get(datos.idOperacion));
      pagoId=datos.pagoId||pagoId;registrado=true;
      const respuesta={pagoId,estado:tipo==='egreso'?'informado':'confirmado'};resultados.set(datos.idOperacion,respuesta);
      if(perder){perder=false;throw new Error('respuesta perdida');}
      return Response.json(respuesta);
    }
    if(ruta.endsWith('/sync')&&opciones?.method==='POST')return Response.json({revision:++revision});
    if(ruta.endsWith('/social/salas'))return Response.json({salas:[]});
    if(ruta.endsWith('/social/deudas'))return Response.json({deudas:[]});
    if(ruta.endsWith('/social/vinculos'))return Response.json({vinculos:[]});
    if(ruta.endsWith('/social/operaciones-personales'))return Response.json({operaciones:registrado?[operacion()]:[]});
    return Response.json({revision,generacion:1,lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'https://ahre.test/api/v1',fetch:transporte});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Pago',correo_electronico:'pago@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
  await e.crearSesion(usuario.id,false);
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Caja',tipo:'efectivo',icono:'cash-outline',saldo_inicial:100,fecha_creacion:'2020-01-01T00:00:00.000Z'});
  const pagar=(id:string)=>tipo==='egreso'?e.informarPagoConDeposito('deuda',15,id):e.confirmarPagoConDeposito('pago-recibido',id);
  await assert.rejects(pagar('no-existe'),/depósito propio/);assert.equal(solicitudes.length,0);
  await assert.rejects(pagar(deposito.id));
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,100);
  await pagar(deposito.id);
  assert.equal(solicitudes.length,2);assert.equal(solicitudes[0],solicitudes[1]);
  await e.incorporarOperacionPersonal(operacion(),{depositoId:deposito.id});
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,tipo==='egreso'?85:115);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos WHERE deposito_id=?').get(deposito.id)?.n,1);
  // Dejar terminar la sincronización solicitada por la incorporación antes de cerrar SQLite.
  await new Promise<void>(resolver=>setImmediate(resolver));
  await e.sincronizarSocialOnline();
  await new Promise<void>(resolver=>setImmediate(resolver));
});
