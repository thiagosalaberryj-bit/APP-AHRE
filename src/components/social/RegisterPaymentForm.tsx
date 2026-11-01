import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { SetStateAction, useRef, useState } from 'react';
import { generarIdentificador } from '../../database/identifiers';
import { registrarPagoDeuda } from '../../social/socialService';
import { centavos, exigir, unidades } from '../../social/socialValidation';
import { montoParaEntrada } from '../../social/socialHelpers';
import { View, Text } from 'react-native';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import EstadoVacio from './SocialEmptyState';
import TarjetaResumenDeuda from './DebtSummaryCard';
import OpcionesSeleccion from './SocialChoiceGroup';
import MontoSocial from './SocialAmountInput';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioRegistrarPago({
  parametros,
  ...aspecto
}: import('../../social/types').AspectoSocial & ({parametros:import('../../social/types').ParametrosSociales})) {
  const {
    deudas: deudasSociales,
    obtenerPersona,
    irInicioSocial,
    volver
  } = useDatosSociales();
  const {
    tema,
    estilosGlobales
  } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const deuda = deudasSociales.find(elemento => elemento.id === parametros.deudaId);
  const [modalidad, establecerModalidad] = useState('todo');
  const [monto, establecerMonto] = useState(deuda ? montoParaEntrada(deuda.pendienteNumero) : '');
  const clave = useRef(generarIdentificador());
  const solicitud = useRef<import('../../social/types').DatosPago | null>(null);
  if (!deuda) return <RegistroNoDisponible {...aspecto} />;
  if (deuda.saldada) return <EstadoVacio icono="checkmark-circle-outline" titulo="Esta deuda ya está saldada" descripcion="No quedan importes pendientes para registrar otro pago." {...aspecto} />;
  const persona = obtenerPersona(deuda.personaId);
  const esPago = deuda.tipo === 'debo';
  const completo = montoParaEntrada(deuda.pendienteNumero);
  return <>
    <View style={estilos.grupoCampo}>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{esPago ? `Le pagás a ${nombreCompletoPersona(persona)}` : `Recibís de ${nombreCompletoPersona(persona)}`}</Text>
      <TarjetaResumenDeuda deuda={deuda} soloLectura {...aspecto} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.origen} · Original: {deuda.monto}</Text>
      {deuda.estado.startsWith('Pago parcial') ? <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.estado}</Text> : null}
    </View>
    <OpcionesSeleccion enLinea opciones={[{
      id: 'todo',
      nombre: 'Saldar todo'
    }, {
      id: 'otro',
      nombre: 'Otro importe'
    }]} elegida={modalidad} alElegir={(valor) => {
      establecerModalidad(valor);
      establecerMonto(valor === 'todo' ? completo : '');
    }} {...aspecto} />
    <MontoSocial etiqueta={esPago ? 'Monto que pagaste' : 'Monto recibido'} valor={monto} alCambiar={valor => {
      establecerMonto(valor);
      establecerModalidad(valor === completo ? 'todo' : 'otro');
    }} {...aspecto} />
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <Text style={estilosGlobales.etiqueta}>{modalidad === 'todo' ? 'Se marcaría como saldada' : 'Pago de otro importe'}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{modalidad === 'todo' ? `Se registrará el pago de ${deuda.pendiente} y no quedará saldo pendiente.` : 'Si el pago cubre una parte, el resto seguirá pendiente.'}</Text>
    </View>
    <AccionesFormulario texto={esPago ? 'Registrar pago realizado' : 'Registrar pago recibido'} deshabilitado={!monto.trim()}
      preparar={() => {
        const importe = centavos(monto);
        exigir(importe <= unidades(deuda.pendienteNumero), 'El pago no puede superar el importe pendiente.');
        solicitud.current = { deudaId: deuda.id, monto, claveOperacion: clave.current };
        return { operaciones: [{ clave: 'pago', tipo: esPago ? 'egreso' : 'ingreso', monto: importe / 100, descripcion: deuda.descripcion }] };
      }} alGuardar={(datos) => registrarPagoDeuda(solicitud.current!, datos.pago || undefined)}
      mensajeExito={resultado => resultado.saldada ? 'Deuda saldada.' : 'Pago registrado.'}
      alExito={resultado => resultado.saldada ? irInicioSocial() : volver()} {...aspecto} />
  </>;
}
