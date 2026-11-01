import type { AspectoSocial } from '../../social/types';
import { View, Text } from 'react-native';
import AccionesDeuda from './DebtActions';
import EnlaceRelacionadoSocial from './SocialRelatedLink';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';
export default function TarjetaDeuda(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({deuda:import('../../social/types').DeudaVista} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'|'abrirSala'>)) {
  const {
    deuda,
    abrirSala,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales
  } = aspecto;
  return <><View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <View style={estilos.filaTituloDeuda}>
        <View style={estilos.textoFlexible}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{deuda.descripcion}</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.origen}</Text>
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.monto, estilos.importeDeuda]}>{deuda.saldada ? '$ 0' : deuda.pendiente}</Text>
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.saldada ? 'Saldado' : deuda.tipo === 'debo' ? 'Le debés' : 'Te debe'} · Original: {deuda.monto}</Text>
      {!deuda.saldada ? <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.estado}</Text> : null}
      <AccionesDeuda deuda={deuda} abrirRegistro={abrirRegistro} {...aspecto} />
    </View>
    {deuda.salaId ? <EnlaceRelacionadoSocial texto="Ver sala de origen" icono="people-outline" alAbrir={() => abrirSala(deuda.salaId!)} {...aspecto} /> : null}
  </>;
}
