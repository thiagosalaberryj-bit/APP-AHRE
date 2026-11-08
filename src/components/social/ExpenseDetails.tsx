import {obtenerColorCategoria,obtenerColorIconoCategoria} from '../../styles/categoryColors';
import AccionesOnline from './ExpenseOnlineActions';
import { useDatosSociales } from '../../social/SocialDataContext';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIAS_EGRESO } from '../../constants/movimientos';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/ExpenseDetailsStyles';
export default function DetalleGasto(propiedades: import('../../social/types').AspectoSocial & ({gasto:import('../../social/types').GastoVista;sala:import('../../social/types').SalaVista} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const {
    obtenerPersona
  } = useDatosSociales();
  const {
    gasto,
    sala,
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
    estilosGlobales,
    tema
  } = aspecto;
  return <>
      <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
        <View style={estilos.filaCampos}>
          <View style={[estilos.iconoCategoria,{backgroundColor:obtenerColorCategoria(gasto.categoriaId,tema,'egreso')+'26'}]}><Ionicons color={obtenerColorIconoCategoria(gasto.categoriaId,tema,'egreso')} name={CATEGORIAS_EGRESO.find(c=>c.id===gasto.categoriaId)?.icono||'receipt-outline'} size={22} /></View>
          <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{gasto.descripcion}</Text><Text style={estilosGlobales.textoSecundario}>{gasto.fecha} · {CATEGORIAS_EGRESO.find(c => c.id === gasto.categoriaId)?.nombre}</Text></View>
          {sala.estado === 'abierta' && sala.puedeEditarGastos && !sala.cierrePendiente ? <Pressable accessibilityRole="button" accessibilityLabel="Editar gasto" onPress={() => abrirRegistro('gasto', {
          salaId: sala.id,
          gastoId: gasto.id
        })} style={estilos.editarPersona}><Ionicons color={tema.foco} name="create-outline" size={24} /></Pressable> : <Text style={estilosGlobales.textoSecundario}>Solo lectura</Text>}
        </View>
        <View style={estilos.resumenImportesPersona}>
          <View style={estilos.importePersona}><Text style={estilosGlobales.textoSecundario}>Importe</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.titulo}>{gasto.monto}</Text></View>
          <View style={estilos.importePersona}><Text style={estilosGlobales.textoSecundario}>Pagó</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}</Text></View>
        </View>
        <Text style={estilosGlobales.etiqueta}>{gasto.distribucion}</Text>
        {gasto.depositosAsociados ? <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>Depósitos asociados: {gasto.depositosAsociados}</Text> : null}
        {sala.estado === 'abierta' ? <Text style={estilosGlobales.textoAyuda}>Reparto provisional · Los movimientos se aplican al cerrar</Text> : null}
      </View>
      <View style={estilos.ticket}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Partes y pagos</Text>
        {sala.online?<AccionesOnline sala={sala} gasto={gasto} seccion="partes" {...aspecto}/>:gasto.partes.map(parte => <View key={parte.personaId} style={estilos.lineaDetalleGasto}>
          <View style={estilos.filaCampos}>
            <Ionicons color={parte.tipo === 'saldado' ? tema.exito : tema.error} name={parte.tipo === 'saldado' ? 'checkmark-circle-outline' : 'time-outline'} size={20} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{nombreCompletoPersona(obtenerPersona(parte.personaId))}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.etiqueta}>{parte.monto}</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{parte.resumen}</Text>
        </View>)}
      </View>
      <AccionesOnline sala={sala} gasto={gasto} seccion="movimientos" {...aspecto}/>
    </>;
}
