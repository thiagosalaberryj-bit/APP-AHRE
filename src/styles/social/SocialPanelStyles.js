import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    accionesPanel: {
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      borderTopWidth: BORDES.anchos.fino,
      borderTopColor: tema.borde,
      paddingTop: ESPACIADO.grande
    },
    accionPanel: {
      flex: 1,
      minWidth: 0,
      minHeight: 78,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.medio,
      paddingHorizontal: ESPACIADO.minimo,
      borderRadius: BORDES.radios.boton,
      backgroundColor: tema.botonPrincipal
    },
    textoAccionPanel: {
      color: tema.botonPrincipalTexto,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'center'
    },
    detalleAccionPanel: {
      color: tema.botonPrincipalTexto,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      textAlign: 'center'
    },
    montoResumen: {
      fontSize: TIPOGRAFIA.tamanos.titulo
    },
    vacioDeudasPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.grande,
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.tarjeta
    },
    importePrincipalPanel: {
      backgroundColor: tema.fondo,
      borderRadius: BORDES.radios.campo,
      padding: ESPACIADO.medio
    }
  });
}
