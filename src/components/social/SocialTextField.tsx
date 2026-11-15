import {BORDES} from '../../styles/globalStyles';
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosCampo from '../../styles/social/SocialTextFieldStyles';
export default function CampoFormulario(propiedades: import('../../social/types').AspectoSocial & ({etiqueta:string;ejemplo?:string;valor:string;alCambiar:(valor:string)=>void;limite?:number;multilinea?:boolean;secreto?:boolean;bordeDiscreto?:boolean;error?:string})) {
  const {
    etiqueta,
    ejemplo,
    valor: valorExterno,
    alCambiar,
    limite,
    multilinea = false,secreto=false,bordeDiscreto=false,error,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    tema,
    estilosGlobales,
    estilosMovimiento
  } = aspecto;
  const estilosCampo = crearEstilosCampo();
  const [mostrarSecreto,cambiarMostrarSecreto]=useState(false);
  const [valor, establecerValor] = useState('');
  const [enfocado, establecerEnfocado] = useState(false);
  return <View style={estilosMovimiento.grupo}>
      <View style={estilosGlobales.encabezadoCampo}>
        <Text style={[estilosGlobales.etiqueta,estilosGlobales.etiquetaCampo]}>{etiqueta}</Text>
        {limite!==undefined?<Text style={estilosGlobales.contadorCampo}>{(valorExterno ?? valor).length}/{limite}</Text>:null}
      </View>
      <View style={[estilosGlobales.campo, estilosMovimiento.filaDescripcion, enfocado && estilosGlobales.campoEnfocado, error && estilosGlobales.campoError, multilinea && estilosCampo.campoMultilinea, bordeDiscreto && {borderWidth:BORDES.anchos.fino,borderColor:error?tema.error:enfocado?tema.foco:'transparent'}]}>
        <Ionicons color={tema.textoSecundario} name={secreto?"lock-closed-outline":"document-text-outline"} size={20} />
        <TextInput secureTextEntry={secreto&&!mostrarSecreto} autoCapitalize={secreto?'none':'sentences'} autoCorrect={!secreto} accessibilityLabel={etiqueta} maxLength={limite} multiline={multilinea} textAlignVertical={multilinea?'top':'center'} value={valorExterno === undefined ? valor : valorExterno} onChangeText={alCambiar || establecerValor} onFocus={() => establecerEnfocado(true)} onBlur={() => establecerEnfocado(false)} placeholder={ejemplo || etiqueta} placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion,multilinea && estilosCampo.entradaMultilinea]} />
        {secreto?<Pressable accessibilityRole="button" accessibilityLabel={mostrarSecreto?'Ocultar contraseña':'Mostrar contraseña'} style={estilosCampo.ojoContrasena} onPress={()=>cambiarMostrarSecreto(v=>!v)}><Ionicons name={mostrarSecreto?'eye-off-outline':'eye-outline'} size={22} color={tema.textoSecundario}/></Pressable>:null}
      </View>
      {error?<Text accessibilityLiveRegion="polite" style={estilosGlobales.textoError}>{error}</Text>:null}
    </View>;
}
