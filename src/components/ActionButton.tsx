import {useFinalizacionAccion} from '../hooks/useActionCompletion';
import { useContext, useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ContextoAvisos } from '../contexts/ToastContext';
import type { Tema } from '../styles/colors';
import { crearEstilosGlobales, RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import type {NombreIcono} from '../constants/movimientos';
import ContenidoAccion from './ActionContent';

export default function BotonAccion({tema,texto,variante='principal',cargando=false,completado:completadoExterno,deshabilitado=false,alPresionar,estilo,etiquetaAccesibilidad,icono,ocultarTexto=false}: {
  tema:Tema;texto:string;variante?:'principal'|'secundario'|'peligro'|'texto'|'cancelar'|'contorno';cargando?:boolean;completado?:boolean;deshabilitado?:boolean;
  icono?:NombreIcono;ocultarTexto?:boolean;alPresionar:()=>unknown;estilo?:StyleProp<ViewStyle>;etiquetaAccesibilidad?:string;
}) {
  const estilos=crearEstilosGlobales(tema),{mostrarAviso}=useContext(ContextoAvisos);
  const [enCurso,cambiarEnCurso]=useState(false);
  const finalizacion=useFinalizacionAccion(),completado=finalizacion.completado;
  const bloqueo=useRef(false),montado=useRef(true),textoActual=useRef(texto);
  textoActual.current=texto;
  useEffect(()=>{finalizacion.iniciar();},[texto]);
  useEffect(()=>{montado.current=true;return()=>{montado.current=false;};},[]);
  const ocupado=cargando||enCurso;
  // La promesa del botón sigue pendiente mientras el formulario inicia el cierre.
  const exitoVisible=(completadoExterno&&ocupado)||completado;
  // Bloqueo de interacción y aspecto deshabilitado son estados distintos.
  const bloqueado=deshabilitado&&!ocupado&&!exitoVisible;
  const fondo=variante==='contorno'?estilos.botonContornoPeligro:variante==='texto'?estilos.botonTexto:variante==='cancelar'?estilos.botonCancelar:variante==='peligro'?estilos.botonPeligro:variante==='secundario'?estilos.botonSecundario:estilos.botonPrincipal;
  const colorFondo=variante==='texto'||variante==='contorno'?'transparent':variante==='cancelar'?tema.fondoDeshabilitado:variante==='peligro'?tema.botonPeligro:variante==='secundario'?tema.botonSecundario:tema.botonPrincipal;
  const color=bloqueado?tema.deshabilitado:variante==='contorno'?tema.error:variante==='peligro'?tema.botonPeligroTexto:variante==='secundario'?tema.botonSecundarioTexto:variante==='texto'?tema.foco:variante==='cancelar'?tema.textoPrincipal:tema.botonPrincipalTexto;
  return <Pressable accessibilityRole="button" accessibilityLabel={etiquetaAccesibilidad||texto} accessibilityState={{busy:ocupado,disabled:deshabilitado||ocupado||exitoVisible}} disabled={deshabilitado||ocupado||exitoVisible}
    android_ripple={RETROALIMENTACION_PULSACION} style={({pressed})=>[fondo,estilo,{backgroundColor:colorFondo,overflow:'hidden'},bloqueado&&estilos.botonDeshabilitado,pressed&&estilos.botonPresionado]}
    onPress={async ()=>{
      if(bloqueo.current||deshabilitado||cargando||exitoVisible)return;
      bloqueo.current=true;finalizacion.iniciar();
      const textoInicial=texto;
      try{
        const resultado=alPresionar();
        const promesa=resultado&&typeof (resultado as Promise<unknown>).then==='function';
        if(promesa&&montado.current)cambiarEnCurso(true);
        const exito=promesa?await resultado:resultado;
        // Solo un éxito explícito muestra Listo: un error capturado no lo simula.
        if(promesa&&exito===true&&completadoExterno===undefined&&montado.current&&textoActual.current===textoInicial)await finalizacion.confirmar();
      }catch(error){if(montado.current)mostrarAviso(error instanceof Error?error.message:'No se pudo completar la acción.',{tipo:'error'});}
      finally{bloqueo.current=false;if(montado.current){finalizacion.iniciar();cambiarEnCurso(false);}}
    }}><ContenidoAccion icono={icono} ocultarTexto={ocultarTexto} texto={texto} color={color} cargando={ocupado&&!exitoVisible} completado={exitoVisible}/></Pressable>;
}
