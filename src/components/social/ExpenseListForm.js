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

const nuevaFila = (descripcion = '', monto = '') => ({ id: generarIdentificador(), claveOperacion: generarIdentificador(), descripcion, monto });

export default function FormularioListaGastos({ sala, participantes, ticket, borrador, editarExistentes = false, ...aspecto }) {
  const social = useDatosSociales(), estilos = crearEstilosCompartidos(aspecto.tema);
  const [filas, establecerFilas] = useState(() => borrador.current?.filas || (editarExistentes ? sala.gastos.map(g => ({ ...nuevaFila(g.descripcion, montoParaEntrada(g.montoNumero)), id: g.id, gastoId: g.id, version: g.version, financiaciones: g.asociaciones,
    ajustes: { pagadorId: g.pagadorId, reparto: g.reparto, involucradas: g.partes.map(p => p.personaId), pagaron: g.partes.filter(p => p.tipo === 'saldado').map(p => p.personaId), montosManuales: Object.fromEntries(g.partes.map(p => [p.personaId, montoParaEntrada(p.montoNumero)])) },
  })) : [nuevaFila()]));
  const [depositoId, establecerDepositoId] = useState(borrador.current?.depositoId || null);
  const [editando, establecerEditando] = useState(null);
  const [opciones, establecerOpciones] = useState(false);
  const comun = useRef(borrador.current?.comun || { pagadorId: 'vos', reparto: 'iguales', involucradas: participantes.map(p => p.id), pagaron: [], montosManuales: {} }), individual = useRef({}), solicitud = useRef(null), ultimoTicket = useRef(borrador.current?.ultimoTicket);
  useEffect(() => { borrador.current = { filas, depositoId, comun: comun.current, ultimoTicket: ultimoTicket.current }; }, [filas, depositoId, borrador]);
  useEffect(() => {
    if (!ticket || ultimoTicket.current === ticket.id) return;
    ultimoTicket.current = ticket.id;
    establecerFilas(actuales => [...actuales.filter(f => f.descripcion.trim() || f.monto.trim()), ...ticket.items.map(i => nuevaFila(i.descripcion, i.monto ? montoParaEntrada(i.monto) : ''))]);
  }, [ticket]);
  const cambiar = (id, cambios) => establecerFilas(actuales => actuales.map(f => f.id === id ? { ...f, ...cambios } : f));
  return <>
    <BarraListaGastos llena={filas.length >= 100 || !social.habilitadoParaCrear} alAgregar={() => establecerFilas(actuales => [...actuales, nuevaFila()])} alOpciones={() => establecerOpciones(true)} alEscanear={editarExistentes ? null : () => social.abrirOcrSala(sala.id)} tema={aspecto.tema} />
    {filas.map((fila, indice) => {
      const ajustes = { ...comun.current, ...fila.ajustes };
      const pagador = social.obtenerPersona(ajustes.pagadorId);
      const deposito = social.depositos.find(d => d.id === (fila.depositoId || depositoId));
      const nombreDeposito = deposito?.nombre || [...new Set(Object.values(fila.financiaciones || {}).map(f => f.depositoNombre).filter(Boolean))].join(', ') || 'Sin depósito';
      const resumen = `Pagó ${pagador?.nombre || 'Vos'} · ${ajustes.reparto === 'manual' ? 'Manual' : 'Iguales'} · ${ajustes.involucradas?.length || 0} personas · ${nombreDeposito}`;
      return <FilaListaGastos key={fila.id} fila={fila} indice={indice} resumen={resumen}
        alCambiar={cambios => cambiar(fila.id, cambios)}
        alEditar={() => { individual.current = { ...ajustes, monto: fila.monto, descripcion: fila.descripcion }; establecerEditando(fila); }}
        alQuitar={fila.gastoId ? null : () => establecerFilas(actuales => actuales.filter(f => f.id !== fila.id))} {...aspecto} />;
    })}
    <AccionesFormulario texto={editarExistentes ? 'Guardar cambios' : 'Guardar lista'} preparar={async () => {
      const lista = filas.map(f => ({ ...comun.current, ...f.ajustes, id: f.id, gastoId: f.gastoId, version: f.version, claveOperacion: f.claveOperacion, monto: f.monto, descripcion: f.descripcion, salaId: sala.id }));
      const plan = await previsualizarListaGastos(lista), fondos = lista.map(() => ({}));
      for (const operacion of plan.operaciones) {
        const deposito = filas[operacion.indice].depositoId || depositoId;
        const previa = filas[operacion.indice].financiaciones?.[operacion.clave];
        exigir(deposito || previa, `Elegí un depósito para el ítem ${operacion.indice + 1}.`);
        fondos[operacion.indice][operacion.clave] = deposito ? { depositoId: deposito, fecha: new Date().toISOString() } : previa;
      }
      solicitud.current = { lista, fondos };
      return { operaciones: [] };
    }} alGuardar={() => guardarListaGastos(solicitud.current.lista, solicitud.current.fondos)} {...aspecto} />
    {opciones ? <OpcionesRapidasGastos valores={comun.current} depositoId={depositoId} depositos={social.depositos} participantes={participantes}
      alCerrar={() => establecerOpciones(false)} alCrearDeposito={() => { establecerOpciones(false); social.abrirDeposito(); }}
      alAplicar={(campos, datos) => {
        const cambios = Object.fromEntries(campos.filter(c => c !== 'depositoId' && c !== 'pago').map(c => [c, datos[c]]));
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
          <FormularioGasto borradorInicial={individual.current} participantes={participantes} alCambiar={datos => { individual.current = { ...individual.current, ...datos }; }} {...aspecto} />
          <SelectorDeposito depositos={social.depositos} seleccionadoId={editando.depositoId || depositoId} alSeleccionar={id => establecerEditando(actual => ({ ...actual, depositoId: id }))} {...aspecto} />
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
