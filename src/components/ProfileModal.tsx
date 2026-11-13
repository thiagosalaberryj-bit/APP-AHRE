import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NombreIcono } from '../constants/movimientos';
import type { Tema } from '../styles/colors';
import type { crearEstilosPerfil } from '../styles/ProfileScreenStyles';
import type { StyleProp, ViewStyle } from 'react-native';

type PropiedadesEncabezado = {
  alCerrar: () => void;
  colorIcono?: string;
  descripcion: string;
  etiquetaCerrar: string;
  estilos: ReturnType<typeof crearEstilosPerfil>;
  icono: NombreIcono;
  tema: Tema;
  titulo: string;
};

function EncabezadoModalPerfil({ alCerrar, colorIcono, descripcion, etiquetaCerrar, estilos, icono, tema, titulo }: PropiedadesEncabezado) {
  return (
    <View style={estilos.encabezadoFormularioModal}>
      <View style={estilos.iconoEncabezadoFormularioModal}>
        <Ionicons color={colorIcono ?? tema.foco} name={icono} size={23} />
      </View>
      <View style={estilos.cuerpoEncabezadoFormularioModal}>
        <Text style={estilos.tituloFormularioModal}>{titulo}</Text>
        <Text style={estilos.descripcionFormularioModal}>{descripcion}</Text>
      </View>
      <Pressable
        accessibilityLabel={etiquetaCerrar}
        accessibilityRole="button"
        onPress={alCerrar}
        style={({ pressed: presionado }) => [
          estilos.botonCerrarFormularioModal,
          presionado && estilos.botonCerrarFormularioModalPresionado,
        ]}
      >
        <Ionicons color={tema.textoSecundario} name="close" size={22} />
      </Pressable>
    </View>
  );
}

export default function ModalPerfil({
  visible, alCerrar, estilos, etiquetaCerrar, etiquetaCerrarFondo = etiquetaCerrar,
  desplazable = false, separarFondo = false, estiloTarjeta, estiloDesplazamiento, children, ...encabezado
}: PropiedadesEncabezado & {
  visible: boolean;
  etiquetaCerrarFondo?: string;
  desplazable?: boolean;
  separarFondo?: boolean;
  estiloTarjeta?: StyleProp<ViewStyle>;
  estiloDesplazamiento?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const contenido = <>
    <EncabezadoModalPerfil {...encabezado} alCerrar={alCerrar} estilos={estilos} etiquetaCerrar={etiquetaCerrar} />
    {desplazable ? <View style={estilos.separadorModal} /> : null}
    {children}
  </>;

  if (separarFondo) return <Modal animationType="fade" onRequestClose={alCerrar} transparent visible={visible}>
    <View style={estilos.fondoSuperpuesto}>
      <Pressable accessibilityLabel={etiquetaCerrarFondo} onPress={alCerrar} style={StyleSheet.absoluteFill}/>
      <View style={[estilos.tarjetaSuperpuesta,estiloTarjeta]} accessibilityViewIsModal>
        <EncabezadoModalPerfil {...encabezado} alCerrar={alCerrar} estilos={estilos} etiquetaCerrar={etiquetaCerrar}/>
        <View style={estilos.separadorModal}/>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={[estilos.desplazamientoModal,estiloDesplazamiento]} contentContainerStyle={estilos.contenidoScrollModal}>
          <View style={estilos.formularioModal}>{children}</View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
  return (
    <Modal animationType="fade" onRequestClose={alCerrar} transparent visible={visible}>
      <Pressable accessibilityLabel={etiquetaCerrarFondo} onPress={alCerrar} style={estilos.fondoSuperpuesto}>
        <Pressable style={estilos.tarjetaSuperpuesta}>
          {desplazable ? (
            <ScrollView
              contentContainerStyle={estilos.contenidoScrollModal}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={estilos.desplazamientoModal}
            >
              <View style={estilos.formularioModal}>{contenido}</View>
            </ScrollView>
          ) : contenido}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
