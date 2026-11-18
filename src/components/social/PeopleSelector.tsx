import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/PeopleSelectorStyles';
export default function SelectorPersonas(propiedades: import('../../social/types').AspectoSocial & ({etiqueta:string;personas:import('../../social/types').PersonaVista[];seleccionadas:string[];alCambiar:(ids:string[])=>void;multiple?:boolean;alRegistrar?:()=>void;compacto?:boolean;etiquetaCorta?:string;desplegable?:boolean;ocultarArchivadas?:boolean})) {
  const {
    etiqueta,
    personas,
    seleccionadas,
    alCambiar,
    multiple = false,
    alRegistrar,
    compacto = false,
    etiquetaCorta,
    desplegable = false,ocultarArchivadas=false,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales,
    estilosMovimiento
  } = aspecto;
  const control = useRef<View>(null);
  const capaDesplegable = useRef<View>(null);
  const [archivadas,mostrarArchivadas]=useState(false);
  const visibles=personas.filter(p=>!ocultarArchivadas||p.activa||archivadas||seleccionadas.includes(p.id));
  const alternarArchivadas=ocultarArchivadas&&personas.some(p=>!p.activa)?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityLabel="Incluir personas archivadas" accessibilityState={{checked:archivadas}} onPress={conRespuestaVisual(()=>mostrarArchivadas(!archivadas))} style={estilos.opcionPersona}><Ionicons name={archivadas?'checkbox':'square-outline'} size={22} color={tema.foco}/><Text style={estilosGlobales.texto}>Incluir personas archivadas</Text></Pressable>:null;
  const [visible, establecerVisible] = useState(false);
  const [posicionado, establecerPosicionado] = useState(false);
  const [ancla, establecerAncla] = useState({ left: 12, top: 0, width: 200, maxHeight: 224 });
  const posicionar = () => {
    control.current?.measureInWindow((x, y, ancho, alto) => {
      capaDesplegable.current?.measureInWindow((origenX, origenY, anchoCapa, altoCapa) => {
        const anchoMenu = Math.min(Math.max(ancho, 180), 240, anchoCapa - 24);
        const debajo = y - origenY + alto + 4;
        const altura = Math.min(224, Math.max(48, personas.length * 32 + (multiple ? 36 : 0) + 2), Math.max(48, altoCapa - debajo - 12));
        establecerAncla({ left: Math.max(12, Math.min(x - origenX, anchoCapa - anchoMenu - 12)), top: debajo, width: anchoMenu, maxHeight: altura });
        establecerPosicionado(true);
      });
    });
  };
  const abrir = () => {
    if (visible) { establecerVisible(false); return; }
    if (desplegable) { Keyboard.dismiss(); establecerPosicionado(false); }
    establecerVisible(true);
  };
  useEffect(() => {
    if (!desplegable || !visible) return;
    const suscripcion = Keyboard.addListener('keyboardDidHide', posicionar);
    return () => suscripcion.remove();
  }, [desplegable, visible, personas.length, multiple]);
  const elegidas = personas.filter(persona => seleccionadas.includes(persona.id));
  const nombres = elegidas.map(persona => persona.nombre).join(', ');
  const resumen = elegidas.length ? compacto && multiple ? `${elegidas.length} personas` : nombres : compacto ? 'Elegir' : multiple ? 'Seleccioná participantes' : 'Seleccioná una persona';
  const elegir = (id: string) => {
    if (multiple) alCambiar(seleccionadas.includes(id) ? seleccionadas.filter(actual => actual !== id) : [...seleccionadas, id]);else {
      alCambiar([id]);
      establecerVisible(false);
    }
  };
  return <View style={[estilos.grupoCampo, compacto && estilos.columnaCampo]}>
      <Text style={estilosGlobales.etiqueta}>{etiquetaCorta || etiqueta}</Text>
      <Pressable android_ripple={RETROALIMENTACION_PULSACION} ref={control} collapsable={false} accessibilityLabel={etiqueta} accessibilityValue={{
      text: nombres || resumen
    }} accessibilityRole="button" accessibilityState={{
      expanded: visible
    }} onPress={conRespuestaVisual(abrir)} style={desplegable ? [estilos.selectorDesplegable, visible && estilos.selectorDesplegableAbierto] : [estilosMovimiento.botonDeposito, compacto && estilos.selectorCompacto, visible && estilosMovimiento.botonDepositoEnfocado]}>
        {!desplegable ? <Ionicons color={tema.foco} name="people-outline" size={compacto ? 18 : 24} /> : null}
        <View style={estilos.textoFlexible}><Text numberOfLines={compacto ? 1 : undefined} style={desplegable ? estilos.textoDesplegable : estilosGlobales.texto}>{resumen}</Text>{multiple && elegidas.length && !compacto ? <Text style={estilosGlobales.textoAyuda}>{elegidas.length} seleccionadas</Text> : null}</View>
        <Ionicons color={tema.textoSecundario} name={visible ? 'chevron-up' : 'chevron-down'} size={desplegable ? 14 : compacto ? 16 : 22} />
      </Pressable>
      {desplegable ? <Modal statusBarTranslucent navigationBarTranslucent transparent visible={visible} animationType="none" onShow={posicionar} onRequestClose={() => establecerVisible(false)}>
        <View ref={capaDesplegable} collapsable={false} onLayout={posicionar} style={estilos.capaDesplegable}>
          <Pressable accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={() => establecerVisible(false)} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={[estilos.menuDesplegable, ancla, !posicionado && estilos.desplegableSinPosicion]}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: ancla.maxHeight - (multiple ? 36 : 0) }}>
              {alternarArchivadas}
              {visibles.map(persona => {
                const elegida = seleccionadas.includes(persona.id);
                return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={persona.id} accessibilityLabel={persona.nombre} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: elegida }} onPress={conRespuestaVisual(() => elegir(persona.id))} style={[estilos.opcionDesplegable, elegida && estilos.opcionDesplegableActiva]}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoOpcionDesplegable}>{persona.nombre}</Text>
                  <Ionicons color={tema.foco} name={multiple ? elegida ? 'checkbox' : 'square-outline' : 'checkmark'} size={16} style={{ opacity: multiple || elegida ? 1 : 0 }} />
                </Pressable>;
              })}
              {!visibles.length ? <Text style={estilos.textoOpcionDesplegable}>No hay personas disponibles.</Text> : null}
            </ScrollView>
            {multiple ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Listo" onPress={conRespuestaVisual(() => establecerVisible(false))} style={estilos.confirmarDesplegable}><Text style={estilos.textoConfirmar}>Listo · {elegidas.length}</Text></Pressable> : null}
          </View>
        </View>
      </Modal> : (
      <Modal statusBarTranslucent navigationBarTranslucent animationType="fade" transparent visible={visible} onRequestClose={() => establecerVisible(false)}>
        <View style={estilos.fondoModal}>
          <Pressable accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={() => establecerVisible(false)} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}><Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{etiqueta}</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={conRespuestaVisual(() => establecerVisible(false))} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable></View>
            <ScrollView style={estilos.desplazamientoModal} keyboardShouldPersistTaps="handled">
              {alternarArchivadas}
              {visibles.length ? visibles.map(persona => <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={persona.id} accessibilityLabel={persona.nombre} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{
              checked: seleccionadas.includes(persona.id)
            }} onPress={conRespuestaVisual(() => elegir(persona.id))} style={estilos.opcionPersona}>
                  <Ionicons color={tema.foco} name={multiple ? seleccionadas.includes(persona.id) ? 'checkbox' : 'square-outline' : seleccionadas.includes(persona.id) ? 'radio-button-on' : 'radio-button-off'} size={24} />
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{persona.nombre}</Text>
                </Pressable>) : <Text style={estilosGlobales.textoSecundario}>No hay más personas disponibles en este listado.</Text>}
            </ScrollView>
            {alRegistrar ? <BotonSocial texto="Registrar una persona" secundario alPresionar={() => {
            establecerVisible(false);
            alRegistrar();
          }} {...aspecto} /> : null}
            {multiple ? <BotonSocial texto="Listo" alPresionar={() => establecerVisible(false)} {...aspecto} /> : null}
          </View>
        </View>
      </Modal>)}
    </View>;
}
