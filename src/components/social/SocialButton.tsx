import crearEstilosBoton from '../../styles/social/SocialButtonStyles';
import { Pressable, Text } from 'react-native';
import {useEffect,useState} from 'react';
import {operacionFinancieraEnCurso,observarOperacionFinanciera} from '../../social/financialOperation';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function BotonSocial(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({texto:string;alPresionar:()=>void;secundario?:boolean;peligro?:boolean;simple?:boolean;deshabilitado?:boolean})) {
  const [bloqueado,cambiarBloqueado]=useState(operacionFinancieraEnCurso());
  useEffect(()=>observarOperacionFinanciera(()=>cambiarBloqueado(operacionFinancieraEnCurso())),[]);
  const {
    texto,
    alPresionar,
    secundario,
    peligro = false,
    simple,
    deshabilitado: deshabilitadoPropio,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema), ...crearEstilosBoton(propiedades.tema)
    }
  };
  const deshabilitado=deshabilitadoPropio||bloqueado;
  return <Pressable accessibilityRole="button" accessibilityState={{
    disabled: Boolean(deshabilitado)
  }} disabled={deshabilitado} onPress={()=>{if(!operacionFinancieraEnCurso()&&!deshabilitado)alPresionar();}} style={[simple ? estilosGlobales.botonTexto : secundario ? estilosGlobales.botonSecundario : estilosGlobales.botonPrincipal, peligro && estilos.botonPeligro, deshabilitado && estilosGlobales.botonDeshabilitado]}>
      <Text style={[deshabilitado ? estilosGlobales.textoSecundario : simple ? estilosGlobales.textoBotonTexto : secundario ? estilosGlobales.textoBotonSecundario : estilosGlobales.textoBotonPrincipal, estilos.textoCentrado, peligro && estilos.textoPeligro]}>{texto}</Text>
    </Pressable>;
}
