import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
type Nodo={type:unknown;props:Record<string,any>};
function nodos(a:any):Nodo[]{if(Array.isArray(a))return a.flatMap(nodos);if(!a||typeof a!=='object'||!a.props)return [];return [a,...nodos(a.props.children)];}
for(const nombre of ['claro','oscuro'] as const)test('Perfil conserva el toggle de AHRE y usa flecha solo cuando Android deniega permiso en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{react:{}});
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const {crearEstilosPerfil}=cargar<typeof import('../src/styles/ProfileScreenStyles.ts')>('src/styles/ProfileScreenStyles.ts');
 const Opcion=cargar<typeof import('../src/components/ProfileNotificationOption.tsx')>('src/components/ProfileNotificationOption.tsx').default;
 const cambios:boolean[]=[],props={tema:TEMAS[nombre],estilos:crearEstilosPerfil(TEMAS[nombre]),preferencia:true,permiso:'Desactivadas en Ajustes',ocupada:false,alCambiar:(v:boolean)=>cambios.push(v)};
 let vista=Opcion(props),filas=nodos(vista);assert.equal(filas.filter(n=>n.type==='Pressable').length,1);assert.ok(filas.some(n=>n.props.name==='chevron-forward'));assert.ok(!filas.some(n=>n.props.etiquetaAccesibilidad==='Notificaciones'));
 vista.props.onPress();assert.deepEqual(cambios,[true]);assert.ok(nodos(Opcion(props)).some(n=>n.props.name==='chevron-forward'),'Abrir permisos no equivale a concederlos');
 filas=nodos(Opcion({...props,permiso:'Permitidas'}));const conmutador=filas.find(n=>n.props.etiquetaAccesibilidad==='Notificaciones')!;assert.equal(conmutador.props.valor,true);conmutador.props.alCambiar(false);assert.deepEqual(cambios,[true,false]);
 const apagada=nodos(Opcion({...props,permiso:'Permitidas',preferencia:false}));assert.ok(!apagada.some(n=>n.props.name==='chevron-forward'));
 const toggleApagado=apagada.find(n=>n.props.etiquetaAccesibilidad==='Notificaciones')!;assert.equal(toggleApagado.props.valor,false);assert.equal(toggleApagado.props.deshabilitado,false);
 for(const permiso of ['No disponible','Comprobando permisos']){const filas=nodos(Opcion({...props,permiso}));assert.ok(!filas.some(n=>n.props.name==='chevron-forward'));assert.equal(filas.find(n=>n.props.etiquetaAccesibilidad==='Notificaciones')!.props.deshabilitado,true);}
 vista=Opcion({...props,ocupada:true});assert.equal(vista.props.disabled,true);vista.props.onPress();assert.deepEqual(cambios,[true,false]);
});
