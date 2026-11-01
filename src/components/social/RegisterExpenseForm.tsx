import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useCallback, useRef, useState, useEffect } from 'react';
import FormularioListaGastos from './ExpenseListForm';
import SelectorModoGasto from './ExpenseModeSelector';
import { generarIdentificador } from '../../database/identifiers';
import { previsualizarGasto, guardarGasto } from '../../social/socialService';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import FormularioGasto from './ExpenseForm';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioRegistrarGasto(propiedades: import('../../social/types').AspectoSocial & ({parametros:import('../../social/types').ParametrosSociales;sala:import('../../social/types').SalaVista})) {
  const {
    personaActual,
    obtenerPersona
  } = useDatosSociales();
  const {
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
  const [modo, establecerModo] = useState(parametros.modo || 'uno');
  useEffect(() => { if (parametros.ticketSocial) establecerModo('lista'); }, [parametros.ticketSocial]);
  const version = useRef(gastoInicial?.version);
  const id = useRef(generarIdentificador()), clave = useRef(generarIdentificador());
  const borrador = useRef<import('../../social/types').EditorGasto | null>(null), solicitud = useRef<import('../../social/types').BorradorGasto | null>(null);
  const listaBorrador = useRef<import('../../social/types').BorradorLista | null>(null);
  const alCambiar = useCallback((datos: import('../../social/types').EditorGasto) => { borrador.current = datos; }, []);
  const personasIds = [...new Set<string>([...(sala?.participantes || []), ...(gastoInicial?.partes.map(p => p.personaId) || []), ...(gastoInicial ? [gastoInicial.pagadorId] : [])])].filter(idPersona => idPersona !== 'vos');
  const participantes = sala ? [personaActual, ...personasIds.map(idPersona => obtenerPersona(idPersona)).filter((p): p is NonNullable<typeof p> => !!p && !!(gastoInicial || p.activa))] : [];
  const etiqueta = parametros.gastoId ? 'Guardar cambios' : 'Agregar gasto';
  if (!sala || sala.estado === 'cerrada' || parametros.gastoId && !gastoInicial) return <RegistroNoDisponible {...aspecto} />;
  return <>
      {!parametros.gastoId ? <SelectorModoGasto modo={modo} alElegir={establecerModo} tema={aspecto.tema} /> : null}
      {modo === 'lista' && !parametros.gastoId ? <FormularioListaGastos borrador={listaBorrador} sala={sala} participantes={participantes} ticket={parametros.ticketSocial} {...aspecto} /> : <>
      <FormularioGasto borradorInicial={borrador.current} participantes={participantes} gastoInicial={gastoInicial} alCambiar={alCambiar} {...aspecto} />
      <AccionesFormulario texto={etiqueta} preparar={() => {
        solicitud.current = { ...borrador.current!, id: id.current, claveOperacion: clave.current, salaId: sala.id, gastoId: gastoInicial?.id, version: version.current };
        return previsualizarGasto(solicitud.current);
      }} alGuardar={(financiaciones) => guardarGasto(solicitud.current!, financiaciones)} {...aspecto} />
      </>}
    </>;
}
