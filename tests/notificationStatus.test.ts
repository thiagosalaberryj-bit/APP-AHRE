import test from 'node:test';
import assert from 'node:assert/strict';
import {avisosHabilitados,estadoEntregaAvisos} from '../src/notifications/notificationStatus.ts';
test('la preferencia activa no se presenta como entrega habilitada cuando Android niega el permiso',()=>{
 assert.equal(estadoEntregaAvisos(true,'Permitidas'),'Activadas');
 for(const permiso of ['Sin permiso','Desactivadas en Ajustes'])assert.equal(estadoEntregaAvisos(true,permiso),'Bloqueadas en Android');
 assert.equal(estadoEntregaAvisos(false,'Permitidas'),'Desactivadas en AHRE');
 assert.equal(estadoEntregaAvisos(true,'Comprobando permisos'),'Comprobando permiso del teléfono…');
 assert.equal(estadoEntregaAvisos(true,'No disponible'),'No disponibles en este dispositivo');
});

test('el interruptor solo se enciende con preferencia y permiso reales; negar o estar comprobando nunca enciende',()=>{
 assert.equal(avisosHabilitados(true,'Permitidas'),true);
 assert.equal(avisosHabilitados(false,'Permitidas'),false);
 for(const permiso of ['Sin permiso','Desactivadas en Ajustes','Comprobando permisos','No disponible']){
  assert.equal(avisosHabilitados(true,permiso),false);assert.equal(avisosHabilitados(false,permiso),false);
 }
});
