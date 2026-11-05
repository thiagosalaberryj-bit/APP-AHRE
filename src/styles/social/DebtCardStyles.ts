import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    accionesDeuda: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    botonPagoDeuda: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo },
    botonEliminarDeuda: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo },
    textoBotonDeuda: { flexShrink: 1, textAlign: 'center', fontSize: TIPOGRAFIA.tamanos.secundario },
    botonEliminarConTexto: { width: 'auto', flex: 1, flexDirection: 'row', gap: ESPACIADO.minimo, padding: ESPACIADO.pequeno },
    textoEliminar: { flexShrink: 1, color: tema.error, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
  });
}
