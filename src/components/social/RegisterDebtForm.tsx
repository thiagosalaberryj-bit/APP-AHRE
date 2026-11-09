import {ContextoAvisos} from '../../contexts/ToastContext';
import type {VinculoOnline} from '../../social/online/types';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useContext, useEffect, useRef, useState } from 'react';
import { generarIdentificador } from '../../database/identifiers';
import { previsualizarDeudaPersonal, crearDeudaPersonal, leerDatosOnline, observarSocialOnline, proponerDeudaOnline, sesionOnline, obtenerVistaSincronizacion, observarSincronizacion } from '../../social/socialService';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import MontoSocial from './SocialAmountInput';
import CampoFormulario from './SocialTextField';
import SelectorPersonas from './PeopleSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioRegistrarDeuda({
  parametros,
  abrirRegistro,
  ...aspecto
}: import('../../social/types').AspectoSocial & ({parametros:import('../../social/types').ParametrosSociales} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const social=useDatosSociales();
  const {mostrarAviso}=useContext(ContextoAvisos);
  const {
    personasActivas: personasSociales,
    obtenerPersona
  } = social;
  const {
    tema,
    estilosGlobales
  } = aspecto;
  const estilos = crearEstilosCompartidos(tema),estilosOnline=crearEstilosSocialOnline(tema);
  const [compartir,cambiarCompartir]=useState(false),[vinculos,cambiarVinculos]=useState<VinculoOnline[]>([]);
  const [conexion,cambiarConexion]=useState(obtenerVistaSincronizacion);
  const compartirSolicitud=useRef(false);
  useEffect(()=>observarSincronizacion(cambiarConexion),[]);
  useEffect(()=>{
    let activo=true;
    const cargar=()=>{void leerDatosOnline<VinculoOnline[]>(social.usuarioId,'vinculos',[]).then(datos=>{if(activo)cambiarVinculos(datos);}).catch(()=>{});};
    cargar();const dejar=observarSocialOnline(cargar);
    return()=>{activo=false;dejar();};
  },[social.usuarioId]);
  const [personaId, establecerPersonaId] = useState(parametros.personaId || null);
  const [direccion, establecerDireccion] = useState('me_deben');
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const id = useRef(generarIdentificador());
  const solicitud = useRef<import('../../social/types').DatosDeuda | null>(null);
  const vinculada=vinculos.some(v=>v.persona_id===personaId&&v.estado==='confirmado'&&v.cuenta_id);
  const sinConexion=['offline','sesion','revocado'].includes(conexion.estado);
  const disponible=!!personaId&&vinculada&&!sinConexion;
  const persona = obtenerPersona(personaId || undefined);
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}><Ionicons color={direccion === 'debo' ? tema.error : tema.foco} name="swap-horizontal-outline" size={22} /><Text style={estilosGlobales.encabezadoSeccion}>¿Quién debe?</Text></View>
      <OpcionesSeleccion enLinea opciones={[{
        id: 'me_deben',
        nombre: 'Me debe'
      }, {
        id: 'debo',
        nombre: 'Le debo'
      }]} elegida={direccion} alElegir={establecerDireccion} {...aspecto} />
      <SelectorPersonas etiqueta="Persona" personas={personasSociales} seleccionadas={personaId ? [personaId] : []} alCambiar={ids => {establecerPersonaId(ids[0]);cambiarCompartir(false);}} alRegistrar={() => abrirRegistro('persona')} {...aspecto} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona ? direccion === 'debo' ? `Vos le debés a ${nombreCompletoPersona(persona)}.` : `${nombreCompletoPersona(persona)} te debe a vos.` : 'Elegí una persona de tu agenda o registrá una nueva.'}</Text>
    </View>
    <MontoSocial etiqueta="Monto de la deuda" valor={monto} alCambiar={establecerMonto} {...aspecto} />
    <CampoFormulario etiqueta="Descripción" ejemplo="Ej.: Almuerzo, compra, préstamo" valor={descripcion} alCambiar={establecerDescripcion} limite={500} {...aspecto} />
    {direccion === 'me_deben' ? <>
      <Text style={estilosGlobales.textoAyuda}>Registraremos el dinero que adelantaste como un egreso. Podés elegir el depósito o vincular un egreso existente para no duplicarlo.</Text>
    </> : <Text style={estilosGlobales.textoAyuda}>Registrar lo que debés no genera un ingreso ni modifica tus depósitos. Al pagar, elegirás el depósito y se registrará el egreso.</Text>}
    <View style={estilosOnline.grupo}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel="Proponer deuda online al registrar" accessibilityState={{checked:compartir,disabled:!disponible&&!compartir}} disabled={!disponible&&!compartir} onPress={()=>cambiarCompartir(!compartir)} style={[estilosOnline.opcionCompartir,!disponible&&estilosOnline.deshabilitado]}>
        <Ionicons name={compartir?'checkbox':'square-outline'} color={tema.foco} size={23}/><Text style={estilosGlobales.etiqueta}>Proponer deuda online</Text>
      </Pressable>
      <Text style={estilosGlobales.textoAyuda}>{!personaId?'Elegí una persona para compartir la deuda.':!vinculada?'La persona necesita una cuenta vinculada y confirmada.':sinConexion?'Necesitás conexión para enviar la propuesta.':compartir?'Se enviará al guardar y esperará la aceptación de la otra persona.':'Opcional. Si no lo activás, queda solo en tus registros.'}</Text>
    </View>
    <AccionesFormulario texto="Registrar deuda" preparar={async () => {
      compartirSolicitud.current=compartir;
      if(compartir&&!disponible)throw new Error('Para compartir necesitás conexión y una cuenta vinculada y confirmada.');
      if(compartirSolicitud.current)await sesionOnline();
      solicitud.current = { id: id.current, personaId: personaId || '', direccion, monto, descripcion };
      return previsualizarDeudaPersonal(solicitud.current!);
    }} alGuardar={(financiaciones) => crearDeudaPersonal(solicitud.current!, financiaciones.origen || undefined)} alExito={async deuda=>{
      if(compartirSolicitud.current){
        try{await proponerDeudaOnline(deuda.id);}
        catch(error){
          mostrarAviso('La deuda quedó guardada. No se pudo confirmar la propuesta: '+(error instanceof Error?error.message:'Intentá nuevamente desde el detalle.'),{tipo:'error'});
          await social.recargar();abrirRegistro('detalleDeuda',{deudaId:deuda.id});return;
        }
      }
      social.volver();
    }} {...aspecto} />
  </>;
}
