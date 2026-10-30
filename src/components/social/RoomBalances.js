import { View, Text, Pressable } from 'react-native';
import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import EstadoVacio from './SocialEmptyState';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function BalancesSala(propiedades) {
  const {
    sala,
    alAbrirGasto,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    tema
  } = aspecto;
  const provisional = sala.estado === 'abierta';
  const pendientes = sala.gastos.flatMap(gasto => gasto.partes.filter(parte => parte.tipo !== 'saldado').map(parte => ({
    gasto,
    parte
  })));
  return <View style={estilos.grupo}>
      <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Tu balance en esta sala</Text>
        <View style={estilos.totalesPanel}>
          <View style={estilos.totalPanel}><Text style={estilosGlobales.textoSecundario}>{provisional ? 'Por cobrar al cerrar' : 'Te deben'}</Text><Text style={estilosGlobales.titulo}>{sala.porCobrar}</Text></View>
          <View style={estilos.totalPanel}><Text style={estilosGlobales.textoSecundario}>{provisional ? 'Por pagar al cerrar' : 'Debés'}</Text><Text style={estilosGlobales.titulo}>{sala.porPagar}</Text></View>
        </View>
        {provisional ? <Text style={estilosGlobales.textoAyuda}>Reparto provisional. Al cerrar la sala, las partes sin pagar quedarán como deudas.</Text> : null}
      </View>
      <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Quién le debe a quién</Text>
      {pendientes.length ? pendientes.map(({
      gasto,
      parte
    }) => {
      const tePagan = gasto.pagadorId === 'vos';
      const pagasVos = parte.personaId === 'vos';
      const persona = obtenerPersona(pagasVos ? gasto.pagadorId : parte.personaId);
      const color = pagasVos ? tema.error : tema.foco;
      const estado = tePagan ? provisional ? 'Te pagaría' : 'Te debe' : pagasVos ? provisional ? 'Pagarías' : 'Le debés' : 'Pendiente';
      return <Pressable key={`${gasto.id}-${parte.personaId}`} accessibilityRole="button" accessibilityLabel={`${nombreCompletoPersona(obtenerPersona(parte.personaId))} a ${nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}, ${parte.pendiente || parte.monto}, por ${gasto.descripcion}`} accessibilityHint="Abre el ítem y sus pagos." onPress={() => alAbrirGasto(gasto.id)} style={({
        pressed: presionado
      }) => [estilosGlobales.tarjeta, estilos.deudaHistorial, presionado && estilos.deudaHistorialPresionada]}>
            <View style={estilos.filaCampos}>
              <View style={[estilos.iconoHistorialDeuda, {
            backgroundColor: `${color}18`
          }]}><Ionicons color={color} name="swap-horizontal-outline" size={20} /></View>
              <View style={estilos.textoFlexible}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{nombreCompletoPersona(persona)}</Text>
                {!tePagan && !pagasVos ? <Text numberOfLines={1} style={estilosGlobales.texto}>A {nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}</Text> : null}
                <Text numberOfLines={1} style={estilosGlobales.textoSecundario}>{gasto.descripcion}</Text>
              </View>
              <View style={estilos.franjaImporteHistorial}>
                <View style={estilos.filaCampos}><Text style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, {
                color
              }]}>{estado}</Text><Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /></View>
                <Text style={estilosGlobales.encabezadoSeccion}>{parte.pendiente || parte.monto}</Text>
              </View>
            </View>
          </Pressable>;
    }) : <EstadoVacio icono="checkmark-circle-outline" titulo="Sin balances pendientes" descripcion={sala.gastos.length ? 'Todos pagaron su parte. No quedó ninguna deuda pendiente.' : 'Todavía no hay gastos ni deudas en esta sala.'} {...aspecto} />}
    </View>;
}
