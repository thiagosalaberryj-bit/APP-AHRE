import { useState } from 'react';
import { PERSONA_ACTUAL, SECCIONES_SALA } from '../../social/socialMockData';
import { obtenerPersona } from '../../social/socialHelpers';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import { CATEGORIAS_EGRESO } from '../../constants/movimientos';
import BalancesSala from './RoomBalances';
import PersonasSala from './RoomPeople';
import EstadoVacio from './SocialEmptyState';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/RoomDetailsStyles';
export default function DetalleSala(propiedades) {
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
  const [personasSala, establecerPersonasSala] = useState(sala.participantes);
  const cerrada = sala.estado === 'cerrada';
  const participantes = [PERSONA_ACTUAL, ...personasSala.map(obtenerPersona)];
  return <>
      <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
        <View style={estilos.filaCampos}><View style={[estilos.iconoLista, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono} size={24} /></View><View style={estilos.textoFlexible}><Text style={estilosGlobales.subtitulo}>{sala.nombre}</Text><Text style={estilosGlobales.textoSecundario}>{CATEGORIAS_EGRESO.find(categoria => categoria.id === sala.categoriaId)?.nombre}</Text></View></View>
        <Text style={estilosGlobales.textoSecundario}>{sala.fecha} · {cerrada ? 'Cerrada · Solo lectura' : 'Activa'} · {participantes.length} participantes</Text>
        <Text style={estilosGlobales.textoSecundario}>{sala.descripcion}</Text>
        <View style={estilos.resumenGastosSala}>
          <View style={estilos.textoFlexible}>
            <Text style={estilosGlobales.textoSecundario}>Total gastado</Text>
            <Text style={estilosGlobales.titulo}>{sala.totalGastado}</Text>
            <Text style={estilosGlobales.textoSecundario}>{sala.gastos.length} gastos</Text>
          </View>
          {!cerrada ? <Pressable accessibilityRole="button" accessibilityLabel="Agregar gasto" onPress={() => abrirRegistro('gasto', {
          salaId: sala.id,
          personasIds: personasSala
        })} style={estilos.agregarGastoSala}><Ionicons color={tema.botonPrincipalTexto} name="add-circle-outline" size={22} /><Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoCentrado]}>Agregar gasto</Text></Pressable> : null}
        </View>
        {cerrada ? <Text style={estilosGlobales.texto}>No se puede modificar. Las deudas pendientes siguen activas en Personas y deudas.</Text> : null}
      </View>
      <View accessibilityRole="tablist" style={estilos.filaSimple}>
        {SECCIONES_SALA.map(opcion => <Pressable key={opcion.id} accessibilityLabel={opcion.nombre} accessibilityRole="tab" accessibilityState={{
        selected: seccion === opcion.id
      }} onPress={() => establecerSeccion(opcion.id)} style={[estilos.seccionSala, seccion === opcion.id && estilos.pestanaActiva]}><Ionicons color={seccion === opcion.id ? tema.botonPrincipalTexto : tema.textoSecundario} name={opcion.icono} size={22} /><Text numberOfLines={2} style={[estilos.textoPestana, estilos.nombreSeccionSala, seccion === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text></Pressable>)}
      </View>
      {seccion === 'balances' ? <BalancesSala sala={sala} alAbrirGasto={alAbrirGasto} {...aspecto} /> : seccion === 'participantes' ? <PersonasSala personasSala={personasSala} gastos={sala.gastos} alCambiar={establecerPersonasSala} cerrada={cerrada} alCrearPersona={() => abrirRegistro('persona')} {...aspecto} /> : <View style={estilos.grupo}>
          {sala.gastos.length ? sala.gastos.map(gasto => <Pressable key={gasto.id} accessibilityRole="button" accessibilityLabel={`Ver gasto ${gasto.descripcion}`} accessibilityHint="Abre el reparto y los pagos de este gasto." onPress={() => alAbrirGasto(gasto.id)} style={({
        pressed: presionado
      }) => [estilosGlobales.tarjeta, estilos.tarjetaCompacta, presionado && estilos.deudaHistorialPresionada]}>
              <View style={estilos.filaCampos}>
                <Ionicons color={tema.foco} name="receipt-outline" size={22} />
                <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{gasto.descripcion}</Text>
                <Ionicons color={tema.foco} name="chevron-forward" size={20} />
              </View>
              <View style={estilos.filaTitulo}><Text style={estilosGlobales.texto}>Pagó {obtenerPersona(gasto.pagadorId).nombre}</Text><Text style={estilosGlobales.encabezadoSeccion}>{gasto.monto}</Text></View>
              <Text numberOfLines={1} style={estilosGlobales.textoSecundario}>{gasto.fecha} · {gasto.distribucion}</Text>
            </Pressable>) : <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Registrá quién pagó y cómo se reparten las partes." {...aspecto} />}
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
