import crearEstilosBoton from '../../styles/social/SocialButtonStyles';
import { ActivityIndicator,Pressable, Text } from 'react-native';
import {useEffect,useState} from 'react';
import {operacionFinancieraEnCurso,observarOperacionFinanciera} from '../../social/financialOperation';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function BotonSocial(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({texto:string;alPresionar:()=>void;secundario?:boolean;peligro?:boolean;simple?:boolean;deshabilitado?:boolean;cargando?:boolean})) {
  const [bloqueado,cambiarBloqueado]=useState(operacionFinancieraEnCurso());
  useEffect(()=>observarOperacionFinanciera(()=>cambiarBloqueado(operacionFinancieraEnCurso())),[]);
  const {
    texto,
    alPresionar,
    secundario,
    peligro = false,
    simple,
    cargando=false,
    deshabilitado: deshabilitadoPropio,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema), ...crearEstilosBoton(propiedades.tema)
    }
  };
  const deshabilitado=deshabilitadoPropio||bloqueado||cargando;
  return <Pressable accessibilityRole="button" accessibilityState={{
    disabled: Boolean(deshabilitado),busy:cargando
  }} disabled={deshabilitado} onPress={()=>{if(!operacionFinancieraEnCurso()&&!deshabilitado)alPresionar();}} style={[simple ? estilosGlobales.botonTexto : secundario ? estilosGlobales.botonSecundario : estilosGlobales.botonPrincipal, estilos.contenido, peligro && estilos.botonPeligro, deshabilitado && estilosGlobales.botonDeshabilitado]}>
      {cargando?<ActivityIndicator size="small" color={secundario||simple?propiedades.tema.foco:propiedades.tema.botonPrincipalTexto}/>:null}
      <Text style={[deshabilitado ? estilosGlobales.textoSecundario : simple ? estilosGlobales.textoBotonTexto : secundario ? estilosGlobales.textoBotonSecundario : estilosGlobales.textoBotonPrincipal, estilos.textoCentrado, peligro && estilos.textoPeligro]}>{texto}</Text>
    </Pressable>;
}
