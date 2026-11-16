import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export function crearEstilosHistorialSolicitudes(tema: Tema) {
  return StyleSheet.create({
    grupo: { gap: ESPACIADO.pequeno },
    resumen: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.medio, paddingVertical: ESPACIADO.minimo },
    encabezado: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: ESPACIADO.pequeno, justifyContent: 'space-between' },
    tarjeta: { gap: ESPACIADO.pequeno, padding: ESPACIADO.medio, borderRadius: BORDES.radios.campo },
    estado: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    mensaje: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, lineHeight: 20 },
    referencia: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    pie: { gap: ESPACIADO.minimo },
    decisiones: { alignSelf: 'stretch' },
    avisoQuitar: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACIADO.pequeno, padding: ESPACIADO.medio, borderRadius: BORDES.radios.campo, backgroundColor: tema.errorFondo },
  });
}
