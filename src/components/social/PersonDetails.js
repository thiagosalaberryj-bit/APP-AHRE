import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AvatarPersona from './PersonAvatar';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import TarjetaDeuda from './DebtCard';
import ModalPersona from './PersonModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function DetallePersona(propiedades) {
  const {
    deudas: deudasSociales
  } = useDatosSociales();
  const {
    persona,
    abrirSala,
    abrirRegistro,
    abrirPersona,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const [editando, establecerEditando] = useState(false);
  const deudas = deudasSociales.filter(deuda => deuda.personaId === persona.id);
  return <>
      <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
        <View style={estilos.filaCampos}>
          <AvatarPersona persona={persona} estilos={estilos} />
          <View style={estilos.textoFlexible}>
            <Text accessibilityLabel={nombreCompletoPersona(persona)} numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.subtitulo}>{nombreCompletoPersona(persona)}</Text>
            <Text accessibilityLabel={persona.apodo} numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona.apodo}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar persona" onPress={() => establecerEditando(true)} style={estilos.editarPersona}>
            <Ionicons color={tema.foco} name="create-outline" size={24} />
          </Pressable>
        </View>
        <View style={estilos.resumenImportesPersona}>
          <View style={estilos.importePersona}><View style={estilos.etiquetaImportePersona}><Ionicons color={tema.exito} name="arrow-up-circle-outline" size={20} /><Text style={estilosGlobales.textoSecundario}>Te debe</Text></View><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.monto}>{persona.porCobrar}</Text></View>
          <View style={estilos.importePersona}><View style={estilos.etiquetaImportePersona}><Ionicons color={tema.error} name="arrow-down-circle-outline" size={20} /><Text style={estilosGlobales.textoSecundario}>Le debés</Text></View><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.monto}>{persona.porPagar}</Text></View>
        </View>
        <BotonSocial texto="Registrar deuda" deshabilitado={!persona.activa} alPresionar={() => abrirRegistro('deuda', {
        personaId: persona.id
      })} {...aspecto} />
      </View>
      {['me_deben', 'debo'].map(tipo => <View key={tipo} style={estilos.grupo}>
          <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>{tipo === 'me_deben' ? 'Lo que te debe' : 'Lo que le debés'}</Text>
          {deudas.some(deuda => deuda.tipo === tipo && !deuda.saldada) ? deudas.filter(deuda => deuda.tipo === tipo && !deuda.saldada).map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} abrirSala={abrirSala} abrirRegistro={abrirRegistro} {...aspecto} />) : <Text style={estilosGlobales.textoSecundario}>Sin deudas pendientes en esta dirección.</Text>}
        </View>)}
      {deudas.some(deuda => deuda.saldada) ? <View style={estilos.grupo}><Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Pagos saldados</Text>{deudas.filter(deuda => deuda.saldada).map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} abrirSala={abrirSala} abrirRegistro={abrirRegistro} {...aspecto} />)}</View> : null}
      <ModalPersona visible={editando} personaInicial={persona} alCerrar={() => establecerEditando(false)} abrirPersona={abrirPersona} {...aspecto} />
    </>;
}
