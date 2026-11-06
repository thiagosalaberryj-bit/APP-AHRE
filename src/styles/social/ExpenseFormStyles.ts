import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    resumenManual: { padding: ESPACIADO.pequeno },
    filaRepartoManual: { minHeight: 40, paddingVertical: 2 },
    resumenReparto: { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio, gap: ESPACIADO.minimo },
    encabezadoReparto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno },
    tituloReparto: { flex: 1, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    cantidadReparto: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    filaReparto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno, minHeight: 44, paddingVertical: ESPACIADO.minimo },
    nombreReparto: { flex: 1, minWidth: 0, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario },
    importeReparto: { flexShrink: 1, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita, textAlign: 'right' },
    ayudaReparto: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    totalReparto: { gap: ESPACIADO.minimo, paddingTop: ESPACIADO.pequeno },
    estadoReparto: { fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18, textAlign: 'right' },
  });
}
