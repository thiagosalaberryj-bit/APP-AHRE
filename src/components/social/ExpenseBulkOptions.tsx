import type { AspectoSocial } from '../../social/types';
import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SelectorPersonas from './PeopleSelector';
import SelectorDeposito from '../DepositSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function OpcionesRapidasGastos({ valores, depositoId, depositos, participantes, alAplicar, alCerrar, alCrearDeposito, ...aspecto }: import('../../social/types').AspectoSocial & {valores:import('../../social/types').EditorGasto;depositoId:string|null;depositos:import('../../database/types').Deposito[];participantes:import('../../social/types').PersonaVista[];alAplicar:(campos:string[],datos:import('../../social/types').EditorGasto & {depositoId:string|null;pago:string})=>void;alCerrar:()=>void;alCrearDeposito:()=>void}) {
  const estilos = crearEstilosCompartidos(aspecto.tema);
  const [campos, establecerCampos] = useState<string[]>([]), [datos, establecerDatos] = useState({ ...valores, depositoId, pago: 'pendiente' });
  const cambiar = (campo: string, valor: string | string[] | undefined) => establecerDatos(actual => ({ ...actual, [campo]: valor }));
  const titulos = { pagadorId: 'Pagador', involucradas: 'Personas', reparto: 'Reparto', depositoId: 'Depósito', pago: 'Pagos' };
  return <Modal visible transparent animationType="fade" onRequestClose={alCerrar}>
    <View style={estilos.fondoModal}><View accessibilityViewIsModal style={estilos.tarjetaModal}>
      <Text style={aspecto.estilosGlobales.encabezadoSeccion}>Opciones rápidas</Text>
      <Text style={aspecto.estilosGlobales.textoAyuda}>Marcá solo lo que querés cambiar en todos los ítems.</Text>
      <ScrollView style={estilos.desplazamientoModal} contentContainerStyle={estilos.grupoCampo} keyboardShouldPersistTaps="handled">
        {Object.entries(titulos).map(([campo, titulo]) => <View key={campo}>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Aplicar ${titulo.toLowerCase()} a todos`} accessibilityState={{ checked: campos.includes(campo) }} style={estilos.filaTactil} onPress={() => establecerCampos(actual => actual.includes(campo) ? actual.filter(c => c !== campo) : [...actual, campo])}>
            <Ionicons name={campos.includes(campo) ? 'checkbox' : 'square-outline'} size={22} color={aspecto.tema.foco} /><Text style={aspecto.estilosGlobales.etiqueta}>Cambiar {titulo.toLowerCase()}</Text>
          </Pressable>
          {campos.includes(campo) ? campo === 'pagadorId' ? <SelectorPersonas compacto etiqueta="Quién pagó" personas={participantes} seleccionadas={[datos.pagadorId]} alCambiar={ids => cambiar(campo, ids[0])} {...aspecto} />
            : campo === 'involucradas' ? <SelectorPersonas compacto multiple etiqueta="Personas involucradas" personas={participantes} seleccionadas={datos.involucradas} alCambiar={ids => cambiar(campo, ids)} {...aspecto} />
            : campo === 'depositoId' ? <SelectorDeposito depositos={depositos} seleccionadoId={datos.depositoId} alSeleccionar={id => cambiar(campo, id)} {...aspecto} />
            : <OpcionesSeleccion enLinea opciones={campo === 'reparto' ? [{ id: 'iguales', nombre: 'Iguales' }, { id: 'manual', nombre: 'Manual' }] : [{ id: 'pendiente', nombre: 'Pendientes' }, { id: 'pagado', nombre: 'Ya pagados' }]} elegida={campo === "reparto" ? datos.reparto : datos.pago} alElegir={valor => cambiar(campo, valor)} {...aspecto} /> : null}
        </View>)}
        {campos.includes('reparto') && datos.reparto === 'manual' ? <Text style={aspecto.estilosGlobales.textoAyuda}>Completá los montos manuales desde la edición de cada ítem.</Text> : null}
        {!depositos.length && campos.includes('depositoId') ? <BotonSocial texto="Crear depósito" alPresionar={alCrearDeposito} {...aspecto} /> : null}
      </ScrollView>
      <BotonSocial texto="Aplicar a todos" deshabilitado={!campos.length || campos.includes('depositoId') && !datos.depositoId || campos.includes('involucradas') && !datos.involucradas.length} alPresionar={() => alAplicar(campos, datos)} {...aspecto} />
      <BotonSocial texto="Volver a la lista" simple alPresionar={alCerrar} {...aspecto} />
    </View></View>
  </Modal>;
}
