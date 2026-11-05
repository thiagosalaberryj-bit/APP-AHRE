import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosBarra(tema: Tema) {
  return StyleSheet.create({
    fila: { flexDirection: 'row', gap: ESPACIADO.pequeno },
    boton: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.minimo, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo / 2, backgroundColor: tema.superficie },
    texto: { color: tema.foco, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
  });
}
