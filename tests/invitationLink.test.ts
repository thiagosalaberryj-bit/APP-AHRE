import test from 'node:test';
import assert from 'node:assert/strict';
import {leerEnlaceInvitacion} from '../src/social/online/invitationLink.ts';
const token='a'.repeat(64),origen='https://ahre.example.test/api/v1';
test('el QR HTTPS y el acceso desde la web conservan la misma invitación',()=>{
  assert.deepEqual(leerEnlaceInvitacion('https://ahre.example.test/invitacion/#'+token,origen),{token,canje:undefined});
  assert.deepEqual(leerEnlaceInvitacion('ahre://invitation?token='+token+'&canje=canje-1',origen),{token,canje:'canje-1'});
});
test('el escáner rechaza otros sitios y tokens o canjes inválidos',()=>{
  for(const enlace of ['https://otro.test/invitacion/#'+token,'http://ahre.example.test/invitacion/#'+token,'https://ahre.example.test/otra/#'+token,'https://ahre.example.test/invitacion/#abc','ahre://invitation?token='+token+'&canje=%2Fno','texto'])assert.equal(leerEnlaceInvitacion(enlace,origen),null);
});
