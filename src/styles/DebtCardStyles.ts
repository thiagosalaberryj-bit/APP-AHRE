import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosTarjetaDeuda(tema: Tema, compacta = true) {
  return StyleSheet.create({
    tarjeta: { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: compacta ? BORDES.radios.campo : BORDES.radios.tarjeta, paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.pequeno, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    presionada: { opacity: 0.85 },
    icono: { width: 28, height: 28, borderRadius: compacta ? BORDES.radios.campo / 2 : BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    contenido: { flex: 1, minWidth: 0, alignSelf: 'stretch', paddingVertical: compacta ? ESPACIADO.minimo : ESPACIADO.pequeno, gap: ESPACIADO.minimo },
    fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    titulo: { color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: compacta ? TIPOGRAFIA.tamanos.cuerpo : TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita, ...(compacta ? { lineHeight: 20 } : {}) },
    persona: { flex: 1, minWidth: 0, color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: compacta ? TIPOGRAFIA.tamanos.secundario : TIPOGRAFIA.tamanos.cuerpo, ...(compacta ? { lineHeight: 18 } : {}) },
    fecha: { flexShrink: 0, textAlign: 'right', color: tema.textoSecundario, fontFamily: TIPOGRAFIA.familias.principal, fontSize: compacta ? TIPOGRAFIA.tamanos.auxiliar : TIPOGRAFIA.tamanos.secundario, ...(compacta ? { lineHeight: 18 } : {}) },
    franjaImporte: { width: 108, alignSelf: 'stretch', gap: ESPACIADO.minimo, backgroundColor: tema.fondo, borderRadius: compacta ? BORDES.radios.campo / 2 : BORDES.radios.campo, paddingHorizontal: ESPACIADO.pequeno, paddingVertical: compacta ? ESPACIADO.minimo : ESPACIADO.pequeno },
    estado: { flex: 1, minWidth: 0, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
  });
}
