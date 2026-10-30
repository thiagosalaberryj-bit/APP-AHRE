import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosCompartidos(tema) {
  return StyleSheet.create({
    deudaHistorial: {
      paddingHorizontal: ESPACIADO.medio,
      paddingVertical: ESPACIADO.pequeno
    },
    iconoHistorialDeuda: {
      width: 28,
      height: 28,
      borderRadius: BORDES.radios.campo,
      alignItems: 'center',
      justifyContent: 'center'
    },
    fechaResumenDeuda: {
      flexShrink: 0,
      textAlign: 'right'
    },
    franjaImporteHistorial: {
      width: 108,
      alignSelf: 'stretch',
      gap: ESPACIADO.minimo,
      backgroundColor: tema.fondo,
      borderRadius: BORDES.radios.campo,
      padding: ESPACIADO.pequeno
    },
    estadoHistorialDeuda: {
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita
    },
    deudaHistorialPresionada: {
      opacity: 0.85
    },
    agregarPersonaAgenda: {
      width: 52,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.boton,
      backgroundColor: tema.botonPrincipal
    },
    busquedaAgenda: {
      height: 52,
      minHeight: 52,
      paddingVertical: 0,
      paddingHorizontal: ESPACIADO.pequeno,
      gap: ESPACIADO.pequeno
    },
    entradaBusquedaAgenda: {
      paddingVertical: 0,
      minHeight: 48
    },
    editarPersona: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center'
    },
    perfilCompacto: {
      padding: ESPACIADO.medio,
      gap: ESPACIADO.medio
    },
    resumenImportesPersona: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIADO.medio,
      paddingVertical: ESPACIADO.pequeno,
      borderTopWidth: BORDES.anchos.fino,
      borderBottomWidth: BORDES.anchos.fino,
      borderColor: tema.borde
    },
    importePersona: {
      flex: 1,
      minWidth: 100,
      gap: ESPACIADO.minimo
    },
    etiquetaImportePersona: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.minimo
    },
    personaAgenda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      minHeight: 60,
      paddingVertical: ESPACIADO.pequeno,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    },
    avatarAgenda: {
      width: 36,
      height: 36,
      borderRadius: BORDES.radios.circular,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.contenedorVerde
    },
    resumenPrincipal: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino,
      borderRadius: BORDES.radios.contenedor,
      padding: ESPACIADO.grande,
      gap: ESPACIADO.grande
    },
    accionPanelDeshabilitada: {
      opacity: 0.5
    },
    totalesPanel: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIADO.pequeno,
      paddingBottom: ESPACIADO.pequeno
    },
    totalPanel: {
      flex: 1,
      minWidth: 110,
      gap: ESPACIADO.minimo
    },
    columnaCampo: {
      flex: 1,
      minWidth: 0
    },
    repartoEnLinea: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: ESPACIADO.minimo
    },
    opcionReparto: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino,
      borderRadius: BORDES.radios.campo
    },
    ticket: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino,
      borderRadius: BORDES.radios.campo,
      padding: ESPACIADO.medio,
      gap: ESPACIADO.minimo
    },
    accionIcono: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48
    },
    filaTitulo: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIADO.medio,
      justifyContent: 'space-between'
    },
    textoFlexible: {
      flex: 1,
      minWidth: 0,
      gap: ESPACIADO.minimo
    },
    iconoLista: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.boton,
      height: 48,
      justifyContent: 'center',
      width: 48
    },
    textoCentrado: {
      textAlign: 'center'
    },
    pestanaActiva: {
      backgroundColor: tema.botonPrincipal,
      borderColor: tema.botonPrincipal
    },
    textoPestana: {
      color: tema.textoSecundario,
      flexShrink: 1,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.seminegrita
    },
    textoPestanaActiva: {
      color: tema.botonPrincipalTexto
    },
    opcionPersona: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.medio,
      minHeight: 48,
      paddingVertical: ESPACIADO.pequeno
    },
    textoAvatar: {
      color: tema.contenedorVerdeTexto,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.negrita
    },
    fondoModal: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      flex: 1,
      justifyContent: 'center',
      padding: ESPACIADO.grande
    },
    cierreFondo: {
      ...StyleSheet.absoluteFillObject
    },
    tarjetaModal: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      gap: ESPACIADO.formulario,
      maxHeight: '85%',
      maxWidth: 480,
      padding: ESPACIADO.extraGrande,
      width: '100%'
    },
    filaModal: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      justifyContent: 'space-between'
    },
    botonCerrar: {
      alignItems: 'center',
      height: 48,
      justifyContent: 'center',
      width: 48
    },
    desplazamientoModal: {
      flexGrow: 0
    },
    grupoCampo: {
      gap: ESPACIADO.pequeno
    },
    tarjetaCompacta: {
      padding: ESPACIADO.medio,
      gap: ESPACIADO.pequeno
    },
    grupo: {
      gap: ESPACIADO.medio
    },
    filaTactil: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      minHeight: 48
    },
    opciones: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIADO.pequeno
    },
    filaSimple: {
      flexDirection: 'row',
      gap: ESPACIADO.pequeno
    },
    filaCampos: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno
    }
  });
}
