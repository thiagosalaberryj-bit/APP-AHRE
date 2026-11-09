import test from 'node:test';
import assert from 'node:assert/strict';
import {iniciarOperacionFinanciera,operacionFinancieraEnCurso,observarOperacionFinanciera} from '../src/social/financialOperation.ts';
test('el bloqueo financiero es inmediato, excluye otra acción y se libera una sola vez',()=>{
 const estados:boolean[]=[],dejar=observarOperacionFinanciera(()=>estados.push(operacionFinancieraEnCurso()));
 const liberar=iniciarOperacionFinanciera();assert.ok(liberar);
 try{assert.equal(iniciarOperacionFinanciera(),null);assert.equal(operacionFinancieraEnCurso(),true);}finally{liberar();liberar();dejar();}
 assert.deepEqual(estados,[true,false]);assert.equal(operacionFinancieraEnCurso(),false);
});
