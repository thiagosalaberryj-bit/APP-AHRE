import { View, Text } from 'react-native';
import { useRef } from 'react';
import BotonSocial from '../components/social/SocialButton';
import { RUTAS } from '../constants/routes';
import { generarIdentificador } from '../database/identifiers';
import { formatearMontoSocial } from '../social/socialHelpers';

export default function ResultadoOcrSocial({ resultado, salaId, navegacion, tema, estilosGlobales }) {
  const items = resultado.items || [];
  const id = useRef(generarIdentificador()), enviado = useRef(false);
  return <View style={estilosGlobales.tarjeta}>
    <Text style={estilosGlobales.subtitulo}>Ítems para la sala</Text>
    <Text style={estilosGlobales.textoSecundario}>Revisá la lista, los importes y los repartos antes de guardarla. Esta lectura no registra un egreso.</Text>
    {items.length ? items.map((item, indice) => <Text key={indice} numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{item.descripcion} · {item.monto ? formatearMontoSocial(item.monto) : 'Importe a completar'}</Text>) : <Text style={estilosGlobales.textoSecundario}>No encontramos líneas de productos. Podés completar la lista manualmente.</Text>}
    <BotonSocial texto="Usar lista en la sala" tema={tema} estilosGlobales={estilosGlobales} alPresionar={() => {
      if (enviado.current) return;
      enviado.current = true;
      navegacion.popTo(RUTAS.REGISTRO_SOCIAL, { tipo: 'gasto', salaId, modo: 'lista', ticketSocial: { id: id.current, items } });
    }} />
  </View>;
}
