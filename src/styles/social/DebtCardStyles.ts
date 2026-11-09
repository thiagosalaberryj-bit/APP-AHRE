import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios() {
  return StyleSheet.create({
    accionesDeuda: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    botonPagoDeuda: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo },
    textoBotonDeuda: { flexShrink: 1, textAlign: 'center', fontSize: TIPOGRAFIA.tamanos.secundario },
  });
}
