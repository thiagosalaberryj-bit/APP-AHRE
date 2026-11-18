import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
import {TEMAS} from '../src/styles/colors.ts';

function nodos(v:any):any[]{return Array.isArray(v)?v.flatMap(nodos):v?.props?[v,...nodos(v.props.children)]:[];}
for(const nombre of ['claro','oscuro'] as const)test('la ayuda abre un modal independiente y permite cerrarlo por los tres controles en '+nombre,()=>{
 let abierto=false;
 const {cargar}=crearCargadorComponentes(process.cwd(),{react:{useState:()=>[abierto,(valor:boolean)=>{abierto=valor;}]}});
 const Aviso=cargar<typeof import('../src/components/FormNotice.tsx')>('src/components/FormNotice.tsx').default;
 const tema=TEMAS[nombre],titulo='Cómo afecta al saldo',mensaje='Este movimiento queda en el historial.';
 const renderizar=()=>nodos(Aviso({tema,titulo,children:mensaje}));
 const abrir=()=>renderizar().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===titulo).props.onPress();
 const inicial=renderizar();assert.ok(!inicial.some(n=>n.type==='Modal'));assert.ok(!inicial.some(n=>n.props.children===mensaje));
 const encabezado=inicial.find(n=>n.type==='Text'&&n.props.children===titulo);
 assert.equal(encabezado.props.style.at(-1).color,nombre==='oscuro'?tema.botonPrincipal:tema.botonPrincipalTexto);
 for(const etiqueta of ['Cerrar información','Cerrar información tocando fuera','Atrás']){
  abrir();const contenido=renderizar(),modal=contenido.find(n=>n.type==='Modal');assert.ok(modal);
  assert.ok(contenido.some(n=>n.type==='Text'&&n.props.children===mensaje));
  assert.ok(contenido.some(n=>n.props.accessibilityRole==='header'&&n.props.children===titulo));
  assert.ok(contenido.some(n=>n.type==='ScrollView'),'La explicación larga conserva desplazamiento');
  if(etiqueta==='Atrás')modal.props.onRequestClose();
  else contenido.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===etiqueta).props.onPress();
  assert.equal(abierto,false);assert.ok(!renderizar().some(n=>n.type==='Modal'));
 }
});
