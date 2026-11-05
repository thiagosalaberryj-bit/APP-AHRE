import usarPanelInferior from '../../utils/useBottomSheet';
import SelectorSegmentado from '../SegmentedSelector';
import type { AspectoSocial } from '../../social/types';
import { useState } from 'react';
import { Animated, Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SelectorPersonas from './PeopleSelector';
import SelectorDeposito from '../DepositSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import BotonSocial from './SocialButton';
import { crearEstilosEditorGastos } from '../../styles/social/ExpenseEditorStyles';

export default function OpcionesRapidasGastos({ valores, depositoId, depositos, participantes, alAplicar, alCerrar, alCrearDeposito, ...aspecto }: import('../../social/types').AspectoSocial & {valores:import('../../social/types').EditorGasto;depositoId:string|null;depositos:import('../../database/types').Deposito[];participantes:import('../../social/types').PersonaVista[];alAplicar:(campos:string[],datos:import('../../social/types').EditorGasto & {depositoId:string|null;pago:string})=>void;alCerrar:()=>void;alCrearDeposito:()=>void}) {
  const { opacidadOverlay, desplazamientoPanel, responderManija, cerrarPanel, confirmarCierre } = usarPanelInferior(true, alCerrar);
  const estilos = crearEstilosEditorGastos(aspecto.tema);
  const [campos, establecerCampos] = useState<string[]>([]), [datos, establecerDatos] = useState({ ...valores, depositoId, pago: 'pendiente' });
  const cambiar = (campo: string, valor: string | string[] | undefined) => {
    establecerDatos(actual => ({ ...actual, [campo]: valor }));
    establecerCampos(actual => actual.includes(campo) ? actual : [...actual, campo]);
  };
  const titulos = { pagadorId: 'Pagador', involucradas: 'Personas', reparto: 'Reparto', depositoId: 'Depósito', pago: 'Pagos' };
  const puedeAplicar = campos.length > 0 && (!campos.includes('depositoId') || !!datos.depositoId) && (!campos.includes('involucradas') || datos.involucradas.length > 0);
  return <Modal visible transparent animationType="none" onRequestClose={cerrarPanel}>
    <KeyboardAvoidingView style={estilos.teclado} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={estilos.fondoAnimado}>
      <Animated.View pointerEvents="none" style={[estilos.overlay, { opacity: opacidadOverlay }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Descartar opciones rápidas" onPress={cerrarPanel} style={estilos.cierre} />
      <Animated.View accessibilityViewIsModal style={[estilos.panel, { transform: [{ translateY: desplazamientoPanel }] }]}>
      <View accessibilityLabel="Deslizar hacia abajo para cerrar opciones rápidas" style={estilos.zonaManija} {...responderManija.panHandlers}><View style={estilos.manija} /></View>
      <View style={estilos.cabecera}>
        <View style={estilos.datosCabecera}><Text accessibilityRole="header" style={estilos.titulo}>Opciones rápidas</Text><Text style={estilos.ayuda}>Cambiá los valores que quieras aplicar a toda la lista.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones rápidas" onPress={cerrarPanel} style={estilos.cerrar}><Ionicons color={aspecto.tema.textoSecundario} name="close" size={22} /></Pressable>
      </View>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {Object.entries(titulos).map(([campo, titulo]) => <View key={campo} style={[estilos.seccion, campos.includes(campo) && estilos.seccionActiva]}>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Aplicar ${titulo.toLowerCase()} a todos`} accessibilityState={{ checked: campos.includes(campo) }} style={estilos.activar} onPress={() => establecerCampos(actual => actual.includes(campo) ? actual.filter(c => c !== campo) : [...actual, campo])}>
            <Ionicons name={campos.includes(campo) ? 'checkbox' : 'square-outline'} size={22} color={aspecto.tema.foco} /><Text style={estilos.nombreCampo}>{titulo}</Text><Text style={estilos.estadoCampo}>{campos.includes(campo) ? 'Se aplicará' : 'Sin cambios'}</Text>
          </Pressable>
          {campo === 'pagadorId' ? <SelectorPersonas compacto desplegable etiqueta="Quién pagó" personas={participantes} seleccionadas={[datos.pagadorId]} alCambiar={ids => cambiar(campo, ids[0])} {...aspecto} />
            : campo === 'involucradas' ? <SelectorPersonas compacto desplegable multiple etiqueta="Personas involucradas" personas={participantes} seleccionadas={datos.involucradas} alCambiar={ids => cambiar(campo, ids)} {...aspecto} />
            : campo === 'depositoId' ? <SelectorDeposito depositos={depositos} seleccionadoId={datos.depositoId} alSeleccionar={id => cambiar(campo, id)} {...aspecto} />
            : campo === 'reparto' ? <SelectorSegmentado tema={aspecto.tema} opciones={[{ id: 'iguales', nombre: 'Iguales' }, { id: 'manual', nombre: 'Manual' }]} valor={datos.reparto} alSeleccionar={valor => cambiar(campo, valor)} etiqueta="Cómo se reparte" />
            : <OpcionesSeleccion enLinea opciones={[{ id: 'pendiente', nombre: 'Pendientes' }, { id: 'pagado', nombre: 'Ya pagados' }]} elegida={datos.pago} alElegir={valor => cambiar(campo, valor)} {...aspecto} />}
        </View>)}
        {campos.includes('reparto') && datos.reparto === 'manual' ? <Text style={aspecto.estilosGlobales.textoAyuda}>Completá los montos manuales desde la edición de cada ítem.</Text> : null}
        {!depositos.length && campos.includes('depositoId') ? <BotonSocial texto="Crear depósito" alPresionar={alCrearDeposito} {...aspecto} /> : null}
      </ScrollView>
      <View style={estilos.pie}>
        <Text accessibilityLiveRegion="polite" style={estilos.ayuda}>{campos.length ? 'Se aplicará: ' + Object.entries(titulos).filter(([campo]) => campos.includes(campo)).map(([,titulo]) => titulo).join(' · ') : 'Sin cambios seleccionados. Los demás datos se conservan.'}</Text>
        <View style={estilos.acciones}>
          <Pressable accessibilityRole="button" accessibilityLabel="Aplicar a todos" disabled={!puedeAplicar} onPress={() => confirmarCierre(() => alAplicar(campos, datos))} style={[estilos.aplicar, !puedeAplicar && estilos.deshabilitado]}><Text style={estilos.textoAplicar}>Aplicar a todos</Text></Pressable>
        </View>
      </View>
      </Animated.View>
    </View>
    </KeyboardAvoidingView>
  </Modal>;
}
