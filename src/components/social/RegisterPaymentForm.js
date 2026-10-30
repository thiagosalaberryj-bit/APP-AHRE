import { useState } from 'react';
import { View, Text } from 'react-native';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import EstadoVacio from './SocialEmptyState';
import TarjetaResumenDeuda from './DebtSummaryCard';
import OpcionesSeleccion from './SocialChoiceGroup';
import MontoSocial from './SocialAmountInput';
import { DEUDAS_SIMULADAS } from '../../social/socialMockData';
import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FormularioRegistrarPago({ parametros, ...aspecto }) {
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const deuda = DEUDAS_SIMULADAS.find(elemento => elemento.id === parametros.deudaId);
  const [modalidad, establecerModalidad] = useState('todo');
  const [monto, establecerMonto] = useState(deuda?.pendiente?.replace(/\D/g, '') || '');
  if (!deuda) return <RegistroNoDisponible {...aspecto} />;
  if (deuda.saldada) return <EstadoVacio icono="checkmark-circle-outline" titulo="Esta deuda ya está saldada" descripcion="No quedan importes pendientes para registrar otro pago." {...aspecto} />;
  const persona = obtenerPersona(deuda.personaId);
  const esPago = deuda.tipo === 'debo';
  const completo = deuda.pendiente.replace(/\D/g, '');
  return <>
    <View style={estilos.grupoCampo}>
      <Text style={estilosGlobales.encabezadoSeccion}>{esPago ? `Le pagás a ${nombreCompletoPersona(persona)}` : `Recibís de ${nombreCompletoPersona(persona)}`}</Text>
      <TarjetaResumenDeuda deuda={deuda} soloLectura {...aspecto} />
      <Text style={estilosGlobales.textoSecundario}>{deuda.origen} · Original: {deuda.monto}</Text>
      {deuda.estado.startsWith('Pago parcial') ? <Text style={estilosGlobales.textoSecundario}>{deuda.estado}</Text> : null}
    </View>
    <OpcionesSeleccion enLinea opciones={[{ id: 'todo', nombre: 'Saldar todo' }, { id: 'otro', nombre: 'Otro importe' }]} elegida={modalidad} alElegir={valor => { establecerModalidad(valor); establecerMonto(valor === 'todo' ? completo : ''); }} {...aspecto} />
    <MontoSocial etiqueta={esPago ? 'Monto que pagaste' : 'Monto recibido'} valor={monto} alCambiar={valor => { establecerMonto(valor); establecerModalidad(valor === completo ? 'todo' : 'otro'); }} {...aspecto} />
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <Text style={estilosGlobales.etiqueta}>{modalidad === 'todo' ? 'Se marcaría como saldada' : 'Pago de otro importe'}</Text>
      <Text style={estilosGlobales.textoSecundario}>{modalidad === 'todo' ? `Se registraría el pago de ${deuda.pendiente} y no quedaría saldo pendiente.` : 'Si el pago cubre una parte, el resto seguirá pendiente. Esta maqueta no calcula el saldo restante.'}</Text>
    </View>
    <AccionesFormulario texto={esPago ? 'Registrar pago realizado' : 'Registrar pago recibido'} deshabilitado={!monto.trim()} {...aspecto} />
  </>;
}
