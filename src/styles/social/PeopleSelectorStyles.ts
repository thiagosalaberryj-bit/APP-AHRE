import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    selectorDesplegable: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 38, paddingHorizontal: ESPACIADO.medio, backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo / 2 },
    selectorDesplegableAbierto: { borderColor: tema.foco },
    textoDesplegable: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario },
    capaDesplegable: { flex: 1 },
    desplegableSinPosicion: { opacity: 0 },
    menuDesplegable: { position: 'absolute', backgroundColor: tema.superficie, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, overflow: 'hidden', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
    opcionDesplegable: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 32, paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.minimo },
    opcionDesplegableActiva: { backgroundColor: tema.fondo },
    textoOpcionDesplegable: { flex: 1, minWidth: 0, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario },
    confirmarDesplegable: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
    textoConfirmar: { color: tema.foco, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    selectorCompacto: {
      minHeight: 48,
      paddingHorizontal: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno,
      gap: ESPACIADO.minimo
    }
  });
}
