import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosTarjetaRegistroFinanciero(tema: Tema) {
  return StyleSheet.create({
    tarjeta: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.pequeno, backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo },
    presionada: { opacity: 0.85 },
    icono: { width: ESPACIADO.enorme, height: ESPACIADO.enorme, borderRadius: BORDES.radios.campo / 2, alignItems: 'center', justifyContent: 'center' },
    contenido: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo },
    fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.minimo },
    titulo: { minWidth: 0, color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita, lineHeight: 20 },
    metadatos: { flex: 1, minWidth: 0, color: tema.textoSecundario, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.regular, lineHeight: 18 },
    fecha: { flexShrink: 0, color: tema.textoSecundario, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.regular, lineHeight: 18 },
    franjaImporte: { width: 112, flexShrink: 0, alignSelf: 'stretch', justifyContent: 'center', gap: ESPACIADO.minimo, backgroundColor: tema.fondo, borderRadius: BORDES.radios.campo / 2, paddingHorizontal: ESPACIADO.pequeno, paddingVertical: ESPACIADO.minimo },
    filaTipo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.minimo },
    tipo: { flex: 1, minWidth: 0, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.seminegrita, lineHeight: 20 },
    importe: { minWidth: 0, color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.negrita, lineHeight: 20 },
  });
}
