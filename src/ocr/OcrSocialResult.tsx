import AvisoFormulario from '../components/FormNotice';
import { View, Text } from 'react-native';
import { useRef } from 'react';
import BotonSocial from '../components/social/SocialButton';
import { RUTAS } from '../constants/routes';
import { generarIdentificador } from '../database/identifiers';
import { formatearMontoSocial } from '../social/socialHelpers';

export default function ResultadoOcrSocial({ resultado, salaId, navegacion, tema, estilosGlobales }: Omit<import('../social/types').AspectoSocial, 'estilosMovimiento'> & {resultado:Awaited<ReturnType<typeof import('./ocrService').reconocerComprobante>>;salaId?:string;navegacion:import('../navigation/types').NavegacionRaiz}) {
  const items = resultado.items || [];
  const id = useRef(generarIdentificador()), enviado = useRef(false);
  return <View style={estilosGlobales.tarjeta}>
    <Text style={estilosGlobales.subtitulo}>Ítems para la sala</Text>
    <AvisoFormulario tema={tema} titulo="Antes de usar la lista">Revisá los productos, sus importes y el reparto. Escanear no registra un egreso.</AvisoFormulario>
    {items.length ? items.map((item, indice) => <Text key={indice} numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{item.descripcion} · {item.monto ? formatearMontoSocial(item.monto) : 'Importe a completar'}</Text>) : <AvisoFormulario tema={tema}>No encontramos líneas de productos. Podés completar la lista manualmente.</AvisoFormulario>}
    <BotonSocial texto="Usar lista en la sala" tema={tema} estilosGlobales={estilosGlobales} alPresionar={() => {
      if (enviado.current) return;
      enviado.current = true;
      navegacion.popTo(RUTAS.REGISTRO_SOCIAL, { tipo: 'gasto', salaId, modo: 'lista', ticketSocial: { id: id.current, items } });
    }} />
  </View>;
}
