import type { AspectoSocial } from '../../social/types';
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, ScrollView } from 'react-native';
import { generarIdentificador } from '../../database/identifiers';
import { previsualizarListaGastos, guardarListaGastos } from '../../social/socialService';
import { exigir } from '../../social/socialValidation';
import { montoParaEntrada } from '../../social/socialHelpers';
import { useDatosSociales } from '../../social/SocialDataContext';
import SelectorDeposito from '../DepositSelector';
import FilaListaGastos from './ExpenseListRow';
import BarraListaGastos from './ExpenseListToolbar';
import OpcionesRapidasGastos from './ExpenseBulkOptions';
import FormularioGasto from './ExpenseForm';
import BotonSocial from './SocialButton';
import AccionesFormulario from './SocialFormActions';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

const nuevaFila = (descripcion = '', monto = ''): import('../../social/types').FilaGasto => ({ id: generarIdentificador(), claveOperacion: generarIdentificador(), descripcion, monto });

export default function FormularioListaGastos({ sala, participantes, ticket, borrador, ...aspecto }: import('../../social/types').AspectoSocial & ({sala:import('../../social/types').SalaVista;participantes:import('../../social/types').PersonaVista[];ticket?:import('../../social/types').TicketSocial;borrador:import('react').RefObject<import('../../social/types').BorradorLista | null>})) {
  const social = useDatosSociales(), estilos = crearEstilosCompartidos(aspecto.tema);
  const [filas, establecerFilas] = useState(() => borrador.current?.filas || [nuevaFila()]);
  const [depositoId, establecerDepositoId] = useState(borrador.current?.depositoId || null);
  const [editando, establecerEditando] = useState<import('../../social/types').FilaGasto | null>(null);
  const [opciones, establecerOpciones] = useState(false);
  const comun = useRef<import('../../social/types').EditorGasto>(borrador.current?.comun || { monto:'',descripcion:'',pagadorId: 'vos', reparto: 'iguales', involucradas: participantes.map(p => p.id), pagaron: [], montosManuales: {} }), individual = useRef<import('../../social/types').EditorGasto>(comun.current), solicitud = useRef<{lista:import('../../social/types').BorradorGasto[];fondos:import('../../social/types').Financiaciones[]} | null>(null), ultimoTicket = useRef(borrador.current?.ultimoTicket);
  useEffect(() => { borrador.current = { filas, depositoId, comun: comun.current, ultimoTicket: ultimoTicket.current }; }, [filas, depositoId, borrador]);
  useEffect(() => {
    if (!ticket || ultimoTicket.current === ticket.id) return;
    ultimoTicket.current = ticket.id;
    establecerFilas(actuales => [...actuales.filter((f) => f.descripcion.trim() || f.monto.trim()), ...ticket.items.map((i) => nuevaFila(i.descripcion, i.monto ? montoParaEntrada(i.monto) : ''))]);
  }, [ticket]);
  const cambiar = (id: string, cambios: Partial<import('../../social/types').FilaGasto>) => establecerFilas(actuales => actuales.map(f => f.id === id ? { ...f, ...cambios } : f));
  return <>
    <BarraListaGastos llena={filas.length >= 100 || !social.habilitadoParaCrear} alAgregar={() => establecerFilas(actuales => [...actuales, nuevaFila()])} alOpciones={() => establecerOpciones(true)} alEscanear={() => social.abrirOcrSala(sala.id)} tema={aspecto.tema} />
    {filas.map((fila, indice) => {
      const ajustes = { ...comun.current, ...fila.ajustes };
      const pagador = social.obtenerPersona(ajustes.pagadorId);
      const deposito = social.depositos.find(d => d.id === (fila.depositoId || depositoId));
      const nombreDeposito = deposito?.nombre || 'Sin depósito';
      const resumen = `Pagó ${pagador?.nombre || 'Vos'} · ${ajustes.reparto === 'manual' ? 'Manual' : 'Iguales'} · ${ajustes.involucradas?.length || 0} personas · ${nombreDeposito}`;
      return <FilaListaGastos key={fila.id} fila={fila} indice={indice} resumen={resumen}
        alCambiar={cambios => cambiar(fila.id, cambios)}
        alEditar={() => { individual.current = { ...ajustes, monto: fila.monto, descripcion: fila.descripcion }; establecerEditando(fila); }}
        alQuitar={() => establecerFilas(actuales => actuales.filter(f => f.id !== fila.id))} {...aspecto} />;
    })}
    <AccionesFormulario texto="Guardar lista" preparar={async () => {
      const lista = filas.map(f => ({ ...comun.current, ...f.ajustes, id: f.id, claveOperacion: f.claveOperacion, monto: f.monto, descripcion: f.descripcion, salaId: sala.id }));
      const plan = await previsualizarListaGastos(lista), fondos = lista.map((): import('../../social/types').Financiaciones => ({}));
      for (const operacion of plan.operaciones) {
        const deposito = filas[operacion.indice].depositoId || depositoId;
        exigir(deposito, `Elegí un depósito para el ítem ${operacion.indice + 1}.`);
        fondos[operacion.indice][operacion.clave] = { depositoId: deposito, fecha: new Date().toISOString() };
      }
      solicitud.current = { lista, fondos };
      return { operaciones: [] };
    }} alGuardar={() => guardarListaGastos(solicitud.current!.lista, solicitud.current!.fondos)} {...aspecto} />
    {opciones ? <OpcionesRapidasGastos valores={comun.current} depositoId={depositoId} depositos={social.depositos} participantes={participantes}
      alCerrar={() => establecerOpciones(false)} alCrearDeposito={() => { establecerOpciones(false); social.abrirDeposito(); }}
      alAplicar={(campos, datos) => {
        const cambios = Object.fromEntries(campos.filter((c) => c !== 'depositoId' && c !== 'pago').map((c) => [c, datos[c as keyof typeof datos]]));
        if (campos.includes('reparto')) cambios.montosManuales = {};
        establecerFilas(actuales => actuales.map(f => {
          const ajustes = { ...comun.current, ...f.ajustes, ...cambios };
          if (campos.includes('pago')) ajustes.pagaron = datos.pago === 'pagado' ? [...ajustes.involucradas] : [];
          return { ...f, ajustes, depositoId: campos.includes('depositoId') ? datos.depositoId : f.depositoId };
        }));
        comun.current = { ...comun.current, ...cambios };
        if (campos.includes('pago')) comun.current.pagaron = datos.pago === 'pagado' ? [...comun.current.involucradas] : [];
        if (campos.includes('depositoId')) establecerDepositoId(datos.depositoId);
        establecerOpciones(false);
      }} {...aspecto} /> : null}
    {editando ? <Modal transparent visible animationType="fade" onRequestClose={() => establecerEditando(null)}>
      <View style={estilos.fondoModal}><View accessibilityViewIsModal style={estilos.tarjetaModal}>
        <Text style={aspecto.estilosGlobales.encabezadoSeccion}>Ajustar ítem</Text>
        <ScrollView style={estilos.desplazamientoModal} keyboardShouldPersistTaps="handled">
          <FormularioGasto borradorInicial={individual.current as import('../../social/types').EditorGasto} participantes={participantes} alCambiar={(datos) => { individual.current = { ...individual.current, ...datos }; }} {...aspecto} />
          <SelectorDeposito depositos={social.depositos} seleccionadoId={editando.depositoId || depositoId} alSeleccionar={id => establecerEditando(actual => actual ? { ...actual, depositoId: id } : actual)} {...aspecto} />
        </ScrollView>
        {!social.depositos.length ? <BotonSocial texto="Crear depósito" alPresionar={() => { establecerEditando(null); social.abrirDeposito(); }} {...aspecto} /> : null}
        <BotonSocial texto="Aplicar al ítem" alPresionar={() => {
          cambiar(editando.id, { ajustes: individual.current, descripcion: individual.current.descripcion, monto: individual.current.monto, depositoId: editando.depositoId });
          establecerEditando(null);
        }} {...aspecto} />
        <BotonSocial texto="Volver a la lista" simple alPresionar={() => establecerEditando(null)} {...aspecto} />
      </View></View>
    </Modal> : null}
  </>;
}
