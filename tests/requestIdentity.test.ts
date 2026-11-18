import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
import {TEMAS} from '../src/styles/colors.ts';

function nodos(v:any):any[]{return Array.isArray(v)?v.flatMap(nodos):v?.props?[v,...nodos(v.props.children)]:[];}
for(const nombre of ['claro','oscuro'] as const)test('las solicitudes muestran inicial de nombre y apellido sin duplicar el correo en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(process.cwd());
 const Identidad=cargar<typeof import('../src/components/social/RequestIdentity.tsx')>('src/components/social/RequestIdentity.tsx').default;
 for(const persona of [
  {nombre:'  Ana  ',apellido:' García ',esperada:'AG',completo:'Ana García'},
  {nombre:'Bruno Pérez',esperada:'BP',completo:'Bruno Pérez'},
  {nombre:'Carla',esperada:'C',completo:'Carla'},
  {nombre:null,apellido:null,esperada:'?',completo:'Cuenta sin nombre'},
 ]){
  const arbol=Identidad({...persona,tema:TEMAS[nombre],detalle:'persona@ejemplo.test'}) as any,contenido=nodos(arbol);
  const textos=contenido.filter(n=>n.type==='Text');
  assert.deepEqual(textos.map(n=>n.props.children),[persona.esperada,persona.completo,'persona@ejemplo.test']);
  assert.equal(textos[0].props.style.color,TEMAS[nombre].avatarTexto);
  assert.equal(arbol.props.style.flexDirection,'row');
  assert.equal(textos[2].props.numberOfLines,1);
 }
});
