import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ICONOS_ADICIONALES_DEPOSITO } from '../constants/deposits';
import type { Tema } from '../styles/colors';
import type { crearEstilosDeposito } from '../styles/DepositScreenStyles';
import type { VarianteFormularioDeposito } from './DepositForm';

export default function ModalIconosDeposito({
  tema, estilos, variante, visible, icono, alCerrar, alSeleccionar, deshabilitado, estiloFondo,
}: {
  tema: Tema;
  estilos: Pick<ReturnType<typeof crearEstilosDeposito>,
    'fondoModal' | 'encabezadoModal' | 'tituloModal' | 'botonCerrarModal' |
    'opcionIconoModal' | 'opcionIconoModalSeleccionada' | 'nombreOpcionIcono'> & {
      tarjetaModal: StyleProp<ViewStyle>;
    };
  variante: VarianteFormularioDeposito;
  visible: boolean;
  icono?: string;
  alCerrar: () => void;
  alSeleccionar: (icono: string) => void;
  deshabilitado?: boolean;
  estiloFondo?: StyleProp<ViewStyle>;
}) {
  return (
    <Modal animationType="fade" onRequestClose={alCerrar} transparent visible={visible}>
      <Pressable accessibilityLabel="Cerrar selector de íconos" onPress={conRespuestaVisual(alCerrar)} style={estiloFondo ?? estilos.fondoModal}>
        <Pressable android_ripple={RETROALIMENTACION_PULSACION} onPress={conRespuestaVisual(() => {})} style={estilos.tarjetaModal}>
          <View style={estilos.encabezadoModal}>
            <Text style={estilos.tituloModal}>Más íconos</Text>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION}
              accessibilityLabel={variante === 'creacion' ? 'Cerrar' : 'Cerrar selector de íconos'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={conRespuestaVisual(alCerrar)}
              style={estilos.botonCerrarModal}
            >
              <Ionicons color={tema.textoPrincipal} name="close" size={22} />
            </Pressable>
          </View>
          {ICONOS_ADICIONALES_DEPOSITO.map(opcion => {
            const seleccionado = icono === opcion.id;
            return (
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                key={opcion.id}
                accessibilityLabel={`Ícono ${opcion.nombre}`}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
                disabled={deshabilitado}
                onPress={conRespuestaVisual(() => alSeleccionar(opcion.id))}
                style={[estilos.opcionIconoModal, seleccionado && estilos.opcionIconoModalSeleccionada]}
              >
                <Ionicons color={tema.foco} name={opcion.id} size={22} />
                <Text style={estilos.nombreOpcionIcono}>{opcion.nombre}</Text>
                {variante === 'creacion' ? (
                  <Ionicons color={seleccionado ? tema.foco : tema.borde} name={seleccionado ? 'radio-button-on' : 'radio-button-off'} size={20} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
