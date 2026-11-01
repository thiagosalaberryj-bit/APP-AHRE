import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function CampoFormulario(propiedades: import('../../social/types').AspectoSocial & ({etiqueta:string;ejemplo?:string;valor:string;alCambiar:(valor:string)=>void;limite?:number})) {
  const {
    etiqueta,
    ejemplo,
    valor: valorExterno,
    alCambiar,
    limite,
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
  const [valor, establecerValor] = useState('');
  const [enfocado, establecerEnfocado] = useState(false);
  return <View style={estilosMovimiento.grupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <View style={[estilosGlobales.campo, estilosMovimiento.filaDescripcion, enfocado && estilosGlobales.campoEnfocado]}>
        <Ionicons color={tema.textoSecundario} name="document-text-outline" size={20} />
        <TextInput accessibilityLabel={etiqueta} maxLength={limite} value={valorExterno === undefined ? valor : valorExterno} onChangeText={alCambiar || establecerValor} onFocus={() => establecerEnfocado(true)} onBlur={() => establecerEnfocado(false)} placeholder={ejemplo || etiqueta} placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilosMovimiento.entradaDescripcion} />
      </View>
    </View>;
}
