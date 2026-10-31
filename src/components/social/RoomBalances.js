import { useDatosSociales } from '../../social/SocialDataContext';
import { View, Text, Pressable } from 'react-native';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import EstadoVacio from './SocialEmptyState';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import ResumenImporteSocial from './SocialAmountSummary';
export default function BalancesSala(propiedades) {
  const {
    obtenerPersona
  } = useDatosSociales();
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
  const pendientes = sala.gastos.flatMap(gasto => gasto.partes.filter(parte => parte.tipo !== 'saldado' && !parte.cancelada).map(parte => ({
    gasto,
    parte
  })));
  return <View style={estilos.grupo}>
      <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Tu balance en esta sala</Text>
        <View style={estilos.totalesPanel}>
          <ResumenImporteSocial etiqueta={provisional ? 'Por cobrar al cerrar' : 'Te deben'} valor={sala.porCobrar} icono="arrow-up-outline" color={tema.foco} {...aspecto} />
          <ResumenImporteSocial etiqueta={provisional ? 'Por pagar al cerrar' : 'Debés'} valor={sala.porPagar} icono="arrow-down-outline" color={tema.error} {...aspecto} />
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
                {!tePagan && !pagasVos ? <Text ellipsizeMode="tail" numberOfLines={1} style={estilosGlobales.texto}>A {nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}</Text> : null}
                <Text ellipsizeMode="tail" numberOfLines={1} style={estilosGlobales.textoSecundario}>{gasto.descripcion}</Text>
              </View>
              <View style={estilos.franjaImporteHistorial}>
                <View style={estilos.filaCampos}><Text style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, {
                color
              }]}>{estado}</Text><Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /></View>
                <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{parte.pendiente || parte.monto}</Text>
              </View>
            </View>
          </Pressable>;
    }) : <EstadoVacio icono="checkmark-circle-outline" titulo="Sin balances pendientes" descripcion={sala.gastos.length ? 'Todos pagaron su parte. No quedó ninguna deuda pendiente.' : 'Todavía no hay gastos ni deudas en esta sala.'} {...aspecto} />}
    </View>;
}
