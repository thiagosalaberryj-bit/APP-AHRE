import { useDatosSociales } from '../../social/SocialDataContext';
import { useEffect, useState } from 'react';
import { montoParaEntrada } from '../../social/socialHelpers';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MontoSocial from './SocialAmountInput';
import CampoFormulario from './SocialTextField';
import SelectorPersonas from './PeopleSelector';
import FilaMontoManual from './ManualShareRow';
import OpcionPersona from './PaymentPersonOption';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/ExpenseFormStyles';
export default function FormularioGasto(propiedades) {
  const {
    obtenerPersona
  } = useDatosSociales();
  const {
    participantes,
    gastoInicial,
    borradorInicial,
    alCambiar,
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
  const [monto, establecerMonto] = useState(borradorInicial?.monto || (gastoInicial ? montoParaEntrada(gastoInicial.montoNumero) : ''));
  const [descripcion, establecerDescripcion] = useState(borradorInicial?.descripcion || gastoInicial?.descripcion || '');
  const [pagadorId, establecerPagadorId] = useState(borradorInicial?.pagadorId || gastoInicial?.pagadorId || 'vos');
  const [reparto, establecerReparto] = useState(borradorInicial?.reparto || gastoInicial?.reparto || 'iguales');
  const [involucradas, establecerInvolucradas] = useState(borradorInicial?.involucradas || (gastoInicial ? gastoInicial.partes.map(parte => parte.personaId) : participantes.map(persona => persona.id)));
  const [pagaron, establecerPagaron] = useState(borradorInicial?.pagaron || gastoInicial?.partes.filter(parte => parte.tipo === 'saldado').map(parte => parte.personaId) || []);
  const [montosManuales, establecerMontosManuales] = useState(() => borradorInicial?.montosManuales || Object.fromEntries((gastoInicial?.partes || []).map(parte => [parte.personaId, montoParaEntrada(parte.montoNumero)])));
  useEffect(() => { alCambiar({ monto, descripcion, pagadorId, reparto, involucradas, pagaron, montosManuales }); },
    [alCambiar, monto, descripcion, pagadorId, reparto, involucradas, pagaron, montosManuales]);
  const [mostrarPagos, establecerMostrarPagos] = useState(false);
  const personasGasto = participantes.filter(persona => involucradas.includes(persona.id));
  const pagador = obtenerPersona(pagadorId);
  const partesPagadas = personasGasto.filter(persona => persona.id === pagadorId || pagaron.includes(persona.id)).length;
  const todasPagaron = personasGasto.length > 0 && partesPagadas === personasGasto.length;
  const alternar = (lista, id) => lista.includes(id) ? lista.filter(actual => actual !== id) : [...lista, id];
  const estadoPago = persona => {
    if (persona.id === pagadorId) return 'Su parte ya está pagada';
    if (pagaron.includes(persona.id)) return pagadorId === 'vos' ? 'Ya te dio su parte' : `Ya le dio su parte a ${pagador.nombre}`;
    if (pagadorId === 'vos') return 'Todavía te debe su parte';
    return persona.id === 'vos' ? `Le debés tu parte a ${pagador.nombre}` : `Debe su parte a ${pagador.nombre}`;
  };
  return <View style={estilos.grupo}>
      <MontoSocial etiqueta="Importe del ítem" valor={monto} alCambiar={establecerMonto} {...aspecto} />
      <CampoFormulario etiqueta="Qué se pagó" ejemplo="Ej.: Pizzas, bebidas, taxi" valor={descripcion} alCambiar={establecerDescripcion} {...aspecto} />
      <View style={estilos.filaCampos}>
        <SelectorPersonas etiqueta="Quién pagó" etiquetaCorta="Pagó" compacto personas={participantes} seleccionadas={[pagadorId]} alCambiar={ids => {
        establecerPagadorId(ids[0]);
        establecerPagaron([]);
      }} {...aspecto} />
        <SelectorPersonas etiqueta="Personas involucradas" etiquetaCorta="Participan" compacto personas={participantes} multiple seleccionadas={involucradas} alCambiar={establecerInvolucradas} {...aspecto} />
      </View>
      <View style={estilos.grupoCampo}>
        <Text style={estilosGlobales.etiqueta}>¿Cómo se reparte?</Text>
        <View style={estilos.repartoEnLinea}>
          {[{
          id: 'iguales',
          nombre: 'Iguales',
          etiqueta: 'Partes iguales'
        }, {
          id: 'manual',
          nombre: 'Manual',
          etiqueta: 'Montos manuales'
        }].map(opcion => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={opcion.etiqueta} accessibilityState={{
          checked: reparto === opcion.id
        }} onPress={() => establecerReparto(opcion.id)} style={[estilos.opcionReparto, reparto === opcion.id && estilos.pestanaActiva]}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[estilos.textoPestana, estilos.textoCentrado, reparto === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text>
            </Pressable>)}
        </View>
      </View>
      {reparto === 'iguales' ? <Text style={estilosGlobales.textoAyuda}>La misma parte para cada persona. Puede quedar todo pagado desde el inicio.</Text> : null}
      {reparto === 'manual' ? <View style={estilos.ticket}>
          <View style={estilos.encabezadoTicket}><Text style={[estilosGlobales.etiqueta, estilos.textoFlexible]}>Persona</Text><Text style={estilosGlobales.etiqueta}>Su parte</Text></View>
          {personasGasto.map(persona => <FilaMontoManual key={persona.id} persona={persona} valor={montosManuales[persona.id] || ''} alCambiar={valor => establecerMontosManuales(anteriores => ({
        ...anteriores,
        [persona.id]: valor
      }))} {...aspecto} />)}
        </View> : null}
      <View style={estilos.ticket}>
        <Pressable accessibilityRole="button" accessibilityLabel={mostrarPagos ? 'Ocultar pagos' : 'Ver pagos'} accessibilityState={{
        expanded: mostrarPagos
      }} onPress={() => establecerMostrarPagos(!mostrarPagos)} style={estilos.filaTactil}>
          <View style={estilos.textoFlexible}><Text style={estilosGlobales.etiqueta}>Pagos y pendientes</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoAyuda}>{partesPagadas} de {personasGasto.length} partes pagadas · {pagadorId === 'vos' ? 'Cobrás vos' : `Cobra ${pagador.nombre}`}</Text></View>
          <Ionicons color={tema.textoSecundario} name={mostrarPagos ? 'chevron-up' : 'chevron-down'} size={20} />
        </Pressable>
        {mostrarPagos ? <>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoAyuda}>{pagadorId === 'vos' ? '¿Quién ya te dio su parte?' : `¿Quién ya le dio su parte a ${pagador.nombre}?`}</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{
          checked: todasPagaron
        }} onPress={() => establecerPagaron(todasPagaron ? [] : personasGasto.map(persona => persona.id))} style={estilos.opcionPersona}>
              <Ionicons color={tema.foco} name={todasPagaron ? 'checkbox' : 'square-outline'} size={24} /><Text style={[estilosGlobales.texto, estilos.textoFlexible]}>Todos ya pagaron su parte</Text>
            </Pressable>
            {personasGasto.map(persona => <OpcionPersona key={persona.id} persona={persona} marcada={persona.id === pagadorId || pagaron.includes(persona.id)} deshabilitada={persona.id === pagadorId} detalle={estadoPago(persona)} alPresionar={() => establecerPagaron(alternar(pagaron, persona.id))} {...aspecto} />)}
          </> : null}
        {todasPagaron ? <Text style={estilosGlobales.texto}>Sin deudas pendientes. El gasto queda repartido y saldado.</Text> : null}
      </View>
    </View>;
}
