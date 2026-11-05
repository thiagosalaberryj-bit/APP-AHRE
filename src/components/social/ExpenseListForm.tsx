import { crearEstilosEditorGastos } from '../../styles/social/ExpenseEditorStyles';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosLista from '../../styles/social/ExpenseListRowStyles';
import { convertirMontoMovimiento } from '../../utils/movementValidation';
import type { AspectoSocial } from '../../social/types';
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
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
  const social = useDatosSociales(), estilos = { ...crearEstilosCompartidos(aspecto.tema), ...crearEstilosLista(aspecto.tema) };
  const estilosEditor = crearEstilosEditorGastos(aspecto.tema);
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
    <View style={estilos.listaGastos}>
      <View style={estilos.resumenLista}>
        <Text style={estilos.cantidadItems}>{filas.length} {filas.length === 1 ? 'ítem' : 'ítems'}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={estilos.totalLista}>Total $ { (filas.reduce((total, fila) => total + Math.round((convertirMontoMovimiento(fila.monto) || 0) * 100), 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</Text>
      </View>
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
    </View>
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
      <KeyboardAvoidingView style={estilosEditor.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={estilosEditor.fondo}>
        <Pressable accessibilityRole="button" accessibilityLabel="Descartar edición del ítem" onPress={() => establecerEditando(null)} style={estilosEditor.cierre} />
        <View accessibilityViewIsModal style={estilosEditor.panel}>
          <View style={estilosEditor.cabecera}>
            <View style={estilosEditor.datosCabecera}>
              <Text accessibilityRole="header" style={estilosEditor.titulo}>Ajustar ítem {filas.findIndex(fila => fila.id === editando.id) + 1}</Text>
              <Text numberOfLines={1} style={estilosEditor.ayuda}>{editando.descripcion || 'Los cambios afectan solo a este ítem.'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar edición del ítem" onPress={() => establecerEditando(null)} style={estilosEditor.cerrar}><Ionicons color={aspecto.tema.textoSecundario} name="close" size={22} /></Pressable>
          </View>
          <ScrollView style={estilosEditor.scroll} contentContainerStyle={estilosEditor.contenido} keyboardShouldPersistTaps="handled">
            <FormularioGasto borradorInicial={individual.current as import('../../social/types').EditorGasto} participantes={participantes} alCambiar={(datos) => { individual.current = { ...individual.current, ...datos }; }} {...aspecto} />
            <View style={estilosEditor.seccion}>
              <SelectorDeposito depositos={social.depositos} seleccionadoId={editando.depositoId || depositoId} alSeleccionar={id => establecerEditando(actual => actual ? { ...actual, depositoId: id } : actual)} {...aspecto} />
              {!social.depositos.length ? <BotonSocial texto="Crear depósito" alPresionar={() => { establecerEditando(null); social.abrirDeposito(); }} {...aspecto} /> : null}
            </View>
          </ScrollView>
          <View style={estilosEditor.pie}>
            <View style={estilosEditor.acciones}>
              <Pressable accessibilityRole="button" accessibilityLabel="Aplicar al ítem" onPress={() => {
                cambiar(editando.id, { ajustes: individual.current, descripcion: individual.current.descripcion, monto: individual.current.monto, depositoId: editando.depositoId });
                establecerEditando(null);
              }} style={estilosEditor.aplicar}><Text style={estilosEditor.textoAplicar}>Aplicar al ítem</Text></Pressable>
            </View>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal> : null}
  </>;
}
