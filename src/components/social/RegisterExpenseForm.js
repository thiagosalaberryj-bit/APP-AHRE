import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import { PERSONA_ACTUAL } from '../../social/socialMockData';
import { obtenerPersona } from '../../social/socialHelpers';
import FormularioGasto from './ExpenseForm';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioRegistrarGasto(propiedades) {
  const {
    tipo,
    parametros,
    sala,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const gastoInicial = sala?.gastos.find(elemento => elemento.id === parametros.gastoId);
  const personasIds = tipo === 'gasto' && !parametros.gastoId && Array.isArray(parametros.personasIds) ? parametros.personasIds : sala?.participantes || [];
  const participantes = sala ? [PERSONA_ACTUAL, ...personasIds.map(obtenerPersona).filter(Boolean)] : [];
  const etiqueta = parametros.gastoId ? 'Guardar cambios' : 'Agregar gasto';
  if (!sala || sala.estado === 'cerrada' || parametros.gastoId && !gastoInicial) return <RegistroNoDisponible {...aspecto} />;
  return <>
      <FormularioGasto participantes={participantes} gastoInicial={gastoInicial} {...aspecto} />
      <AccionesFormulario texto={etiqueta} {...aspecto} />
    </>;
}
