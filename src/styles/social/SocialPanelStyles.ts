import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    resumenPrincipal: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino,
      borderRadius: BORDES.radios.boton,
      padding: ESPACIADO.medio,
      gap: ESPACIADO.medio,
    },
    grupo: { gap: ESPACIADO.pequeno },
    tarjetaPanel: { borderRadius: BORDES.radios.campo },
    iconoTarjetaPanel: { borderRadius: BORDES.radios.campo / 2 },
    franjaImportePanel: { borderRadius: BORDES.radios.campo / 2, paddingVertical: ESPACIADO.minimo },
    tituloTarjetaPanel: { fontSize: TIPOGRAFIA.tamanos.cuerpo, lineHeight: 20 },
    textoTarjetaPanel: { fontSize: TIPOGRAFIA.tamanos.secundario, lineHeight: 18 },
    metadatosPanel: { fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    accionPanel: {
      flex: 1,
      minWidth: 0,
      minHeight: 64,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      paddingHorizontal: ESPACIADO.minimo,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.botonPrincipal,
    },
    textoAccionPanel: {
      color: tema.botonPrincipalTexto,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      lineHeight: 16,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'center',
    },
    accionesPanel: {
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      borderTopWidth: BORDES.anchos.fino,
      borderTopColor: tema.borde,
      paddingTop: ESPACIADO.medio
    },
    detalleAccionPanel: {
      color: tema.botonPrincipalTexto,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      lineHeight: 14,
      textAlign: 'center'
    },
    montoResumen: {
      fontSize: TIPOGRAFIA.tamanos.monto
    },
    vacioDeudasPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.medio,
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.campo,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
    },
  });
}
