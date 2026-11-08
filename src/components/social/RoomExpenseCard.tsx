import {CATEGORIAS_EGRESO} from '../../constants/movimientos';
import {obtenerColorCategoria,obtenerColorIconoCategoria} from '../../styles/categoryColors';
import crearEstilosSala from '../../styles/social/RoomDetailsStyles';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatosSociales } from '../../social/SocialDataContext';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function TarjetaGastoSala({ gasto, alAbrir, tema, estilosGlobales }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({gasto:import('../../social/types').GastoVista;alAbrir:()=>void})) {
  const { obtenerPersona } = useDatosSociales();
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosSala(tema) };
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver gasto ${gasto.descripcion}`}
    accessibilityHint="Abre el reparto y los pagos de este gasto." onPress={alAbrir}
    style={({ pressed: presionado }) => [estilosGlobales.tarjeta, estilos.tarjetaSala, estilos.deudaHistorial, presionado && estilos.deudaHistorialPresionada]}>
    <View style={estilos.filaCampos}>
      <View style={[estilos.iconoHistorialDeuda, { backgroundColor: obtenerColorCategoria(gasto.categoriaId,tema,'egreso')+'26' }]}>
        <Ionicons color={obtenerColorIconoCategoria(gasto.categoriaId,tema,'egreso')} name={CATEGORIAS_EGRESO.find(c=>c.id===gasto.categoriaId)?.icono||'receipt-outline'} size={20} />
      </View>
      <View style={estilos.textoFlexible}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, estilos.tituloFila]}>{gasto.descripcion}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoSecundario, estilos.metadatosFila]}>Pagó {nombreCompletoPersona(obtenerPersona(gasto.pagadorId))} · {gasto.distribucion}</Text>
      </View>
      <View style={estilos.franjaImporteHistorial}>
        <View style={estilos.filaCampos}>
          <Text numberOfLines={1} style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, { color: tema.foco }]}>Importe</Text>
          <Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} />
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, estilos.tituloFila]}>{gasto.monto}</Text>
      </View>
    </View>
  </Pressable>;
}
