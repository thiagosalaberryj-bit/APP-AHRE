import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { cambiarPersonasSala } from '../../social/socialService';
import { SECCIONES_SALA } from "../../social/socialConstants";
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import { CATEGORIAS_EGRESO } from '../../constants/movimientos';
import BalancesSala from './RoomBalances';
import PersonasSala from './RoomPeople';
import EstadoVacio from './SocialEmptyState';
import TarjetaGastoSala from './RoomExpenseCard';
import ResumenImporteSocial from './SocialAmountSummary';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/RoomDetailsStyles';
export default function DetalleSala(propiedades) {
  const {
    personaActual,
    obtenerPersona,
    recargar
  } = useDatosSociales();
  const {
    sala,
    alAbrirGasto,
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
  const [seccion, establecerSeccion] = useState('balances');
  const personasSala = sala.participantes;
  const cerrada = sala.estado === 'cerrada';
  const participantes = [personaActual, ...personasSala.map(obtenerPersona)];
  return <>
      <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
        <View style={estilos.filaCampos}><View style={[estilos.iconoLista, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono} size={24} /></View><View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.subtitulo}>{sala.nombre}</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{CATEGORIAS_EGRESO.find(categoria => categoria.id === sala.categoriaId)?.nombre}</Text></View></View>
        <Text style={estilosGlobales.textoSecundario}>{sala.fecha} · {cerrada ? 'Cerrada · Solo lectura' : 'Activa'} · {participantes.length} participantes</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{sala.descripcion}</Text>
        <View style={estilos.resumenGastosSala}>
          <ResumenImporteSocial etiqueta="Total gastado" valor={sala.totalGastado} icono="receipt-outline" {...aspecto} />
          {!cerrada ? <Pressable accessibilityRole="button" accessibilityLabel="Agregar gasto" onPress={() => abrirRegistro('gasto', {
          salaId: sala.id,
          personasIds: personasSala
        })} style={estilos.accionPanel}><Ionicons color={tema.botonPrincipalTexto} name="add-circle-outline" size={24} /><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoAccionPanel}>Agregar gasto</Text></Pressable> : null}
        </View>
        <Text style={estilosGlobales.textoSecundario}>{sala.gastos.length} gastos</Text>
        {cerrada ? <Text style={estilosGlobales.texto}>No se puede modificar. Las deudas pendientes siguen activas en Personas y deudas.</Text> : null}
      </View>
      <View accessibilityRole="tablist" style={estilos.filaSimple}>
        {SECCIONES_SALA.map(opcion => <Pressable key={opcion.id} accessibilityLabel={opcion.nombre} accessibilityRole="tab" accessibilityState={{
        selected: seccion === opcion.id
      }} onPress={() => establecerSeccion(opcion.id)} style={[estilos.seccionSala, seccion === opcion.id && estilos.pestanaActiva]}><Ionicons color={seccion === opcion.id ? tema.botonPrincipalTexto : tema.textoSecundario} name={opcion.icono} size={22} /><Text ellipsizeMode="tail" numberOfLines={2} style={[estilos.textoPestana, estilos.nombreSeccionSala, seccion === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text></Pressable>)}
      </View>
      {seccion === 'balances' ? <BalancesSala sala={sala} alAbrirGasto={alAbrirGasto} {...aspecto} /> : seccion === 'participantes' ? <PersonasSala personasSala={personasSala} gastos={sala.gastos} alCambiar={async ids => { await cambiarPersonasSala(sala.id, ids); await recargar(); }} cerrada={cerrada} alCrearPersona={() => abrirRegistro('persona')} {...aspecto} /> : <View style={estilos.grupo}>
          {sala.gastos.length ? sala.gastos.map(gasto => <TarjetaGastoSala key={gasto.id} gasto={gasto} alAbrir={() => alAbrirGasto(gasto.id)} {...aspecto} />) : <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Registrá quién pagó y cómo se reparten las partes." {...aspecto} />}
        </View>}
      {!cerrada ? <View style={estilos.grupoCampo}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sala" accessibilityHint="Abre la revisión del cierre y del reparto pendiente." onPress={() => abrirRegistro('cerrar', {
        salaId: sala.id
      })} style={({
        pressed: presionado
      }) => [estilosGlobales.botonSecundario, estilos.filaSimple, presionado && estilos.deudaHistorialPresionada]}>
          <Ionicons color={tema.botonSecundarioTexto} name="lock-closed-outline" size={22} />
          <Text style={estilosGlobales.textoBotonSecundario}>Cerrar sala</Text>
        </Pressable>
        <Text style={[estilosGlobales.textoAyuda, estilos.textoCentrado]}>Confirmá el reparto para pasar la sala al historial.</Text>
      </View> : null}
    </>;
}
