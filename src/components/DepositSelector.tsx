import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Keyboard, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO } from '../styles/colors';
import type { NombreIcono } from '../constants/movimientos';
import { crearEstilosSelectorDeposito } from '../styles/DepositSelectorStyles';
import type { SelectorDepositoProps } from '../types/ui';

type DepositoSeleccionable = NonNullable<SelectorDepositoProps['depositos']>[number];
const iconoDeposito = (deposito?: DepositoSeleccionable): NombreIcono => (deposito?.icono as NombreIcono) || (deposito?.tipo === 'efectivo' ? 'cash-outline' : deposito?.tipo === 'banco' ? 'business-outline' : deposito?.tipo === 'billetera_virtual' ? 'phone-portrait-outline' : 'wallet-outline');

export default function SelectorDeposito({ tema, etiqueta = 'Depósito', depositos = [], seleccionadoId, alSeleccionar, seleccionMultiple = false, seleccionadasIds = [], alCambiarMulti, impedirSeleccionVacia = false, error }: SelectorDepositoProps) {
  const estilos = crearEstilosSelectorDeposito(tema);
  const control = useRef<View>(null);
  const ventana = useWindowDimensions();
  const dimensionesCapa = useRef({ width: ventana.width, height: ventana.height });
  const aperturaPendiente = useRef(false);
  const modalListo = useRef(false);
  const [visible, establecerVisible] = useState(false), [posicionado, establecerPosicionado] = useState(false);
  const [ancla, establecerAncla] = useState({ left: 12, top: 0, width: 240, maxHeight: 280 });
  const elegidos = depositos.filter(deposito => seleccionMultiple ? seleccionadasIds.includes(deposito.id) : deposito.id === seleccionadoId);
  const elegido = elegidos.length === 1 ? elegidos[0] : undefined;
  const todos = depositos.length > 0 && elegidos.length === depositos.length;
  const titulo = seleccionMultiple ? todos ? 'Todos los depósitos' : elegidos.length ? elegidos.length + (elegidos.length === 1 ? ' depósito' : ' depósitos') : 'Ningún depósito' : elegido?.nombre || (depositos.length ? 'Seleccioná un depósito' : 'No hay depósitos disponibles');
  const detalle = seleccionMultiple ? elegidos.map(deposito => deposito.nombre).join(' · ') : elegido?.saldoTexto;
  const posicionar = () => {
    if (!modalListo.current) return;
    // El modal ocupa la ventana completa. pageX/pageY evita mezclar los
    // desplazamientos de ventanas nativas distintas que agrega measureInWindow.
    control.current?.measure((_x, _y, ancho, alto, pageX, pageY) => {
      if (ancho <= 0 || alto <= 0) return;
      const { width: anchoCapa, height: altoCapa } = dimensionesCapa.current;
      const width = Math.min(Math.max(ancho, 240), 360, anchoCapa - 24);
      const top = pageY + alto + 4;
      const minimo = seleccionMultiple ? 124 : 48;
      const maxHeight = Math.min(320, Math.max(minimo, depositos.length * 52 + (seleccionMultiple ? 76 : 0) + 2), Math.max(minimo, altoCapa - top - 12));
      establecerAncla({ left: Math.max(12, Math.min(pageX, anchoCapa - width - 12)), top, width, maxHeight });
      establecerPosicionado(true);
    });
  };
  useEffect(() => {
    const suscripcion = Keyboard.addListener('keyboardDidHide', () => {
      if (aperturaPendiente.current) {
        aperturaPendiente.current = false;
        establecerVisible(true);
      }
    });
    return () => { aperturaPendiente.current = false; suscripcion.remove(); };
  }, []);
  const abrir = () => {
    modalListo.current = false;
    establecerPosicionado(false);
    if (Keyboard.isVisible()) { aperturaPendiente.current = true; Keyboard.dismiss(); }
    else establecerVisible(true);
  };
  const seleccionar = (id: string) => {
    if (!seleccionMultiple) { alSeleccionar?.(id); establecerVisible(false); return; }
    const activa = seleccionadasIds.includes(id);
    if (activa && impedirSeleccionVacia && elegidos.length === 1) return;
    alCambiarMulti?.(activa ? seleccionadasIds.filter(actual => actual !== id) : [...seleccionadasIds, id]);
  };
  return <View style={estilos.grupo}>
    {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
    <Pressable ref={control} collapsable={false} accessibilityRole="button" accessibilityLabel={etiqueta || 'Depósitos'} accessibilityValue={{ text: detalle ? titulo + '. ' + detalle : titulo }} accessibilityState={{ expanded: visible, disabled: !depositos.length }} disabled={!depositos.length} onPress={abrir}
      style={[estilos.control, visible && estilos.controlAbierto, !!error && estilos.controlError]}>
      <View style={estilos.iconoCampo}><Ionicons color={tema.textoSecundario} name={iconoDeposito(elegido)} size={22} /></View>
      <View style={estilos.textos}><Text numberOfLines={1} style={estilos.nombreCampo}>{titulo}</Text>{detalle ? <Text numberOfLines={1} style={estilos.detalleCampo}>{detalle}</Text> : null}</View>
      <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={22} color={tema.textoSecundario} />
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
    <Modal statusBarTranslucent navigationBarTranslucent transparent visible={visible} animationType="none" onShow={() => { modalListo.current = true; posicionar(); }} onRequestClose={() => establecerVisible(false)}>
      <View collapsable={false} onLayout={evento => { dimensionesCapa.current = evento.nativeEvent.layout; posicionar(); }} style={estilos.capa}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector de depósito" onPress={() => establecerVisible(false)} style={estilos.cierre} />
        <View accessibilityViewIsModal style={[estilos.menu, ancla, !posicionado && estilos.sinPosicion]}>
          {seleccionMultiple ? <View style={estilos.cabeceraLista}><Text style={estilos.detalle}>Elegí los depósitos</Text><Pressable accessibilityRole="button" accessibilityLabel="Seleccionar todos los depósitos" onPress={() => alCambiarMulti?.(depositos.map(deposito => deposito.id))} style={estilos.accion}><Text style={estilos.textoAccion}>Todos</Text></Pressable></View> : null}
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: ancla.maxHeight - (seleccionMultiple ? 76 : 0) }}>
            {depositos.map(deposito => {
              const activa = elegidos.some(elegido => elegido.id === deposito.id);
              const bloqueada = seleccionMultiple && impedirSeleccionVacia && activa && elegidos.length === 1;
              return <Pressable key={deposito.id} accessibilityRole={seleccionMultiple ? 'checkbox' : 'button'} accessibilityState={seleccionMultiple ? { checked: activa, disabled: bloqueada } : { selected: activa }} accessibilityHint={bloqueada ? 'Seleccioná otro depósito antes de quitar este.' : undefined} disabled={bloqueada} onPress={() => seleccionar(deposito.id)} style={[estilos.opcion, activa && estilos.opcionActiva]}>
                <View style={[estilos.icono, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={iconoDeposito(deposito)} size={18} /></View>
                <View style={estilos.textos}><Text numberOfLines={1} style={estilos.nombre}>{deposito.nombre}</Text>{deposito.saldoTexto ? <Text numberOfLines={1} style={estilos.detalle}>{deposito.saldoTexto}</Text> : null}</View>
                <Ionicons color={activa ? tema.foco : tema.textoSecundario} name={seleccionMultiple ? activa ? 'checkbox' : 'square-outline' : 'checkmark'} size={18} style={{ opacity: seleccionMultiple || activa ? 1 : 0 }} />
              </Pressable>;
            })}
          </ScrollView>
          {seleccionMultiple ? <Pressable accessibilityRole="button" accessibilityLabel="Listo" onPress={() => establecerVisible(false)} style={estilos.confirmar}><Text style={estilos.textoAccion}>Listo · {elegidos.length}</Text></Pressable> : null}
        </View>
      </View>
    </Modal>
  </View>;
}
