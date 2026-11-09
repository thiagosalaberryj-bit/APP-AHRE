import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from './globalStyles';
import type { Tema } from './colors';

export function crearEstilosMarcoEncabezado(tema: Tema) {
  return StyleSheet.create({
    raiz: { flex: 1, backgroundColor: tema.fondo },
    recorte: { overflow: 'hidden', flexShrink: 0 },
    unionEncabezado: { backgroundColor: tema.encabezado },
    encabezado: { height: 120, flexShrink: 0 },
    flechas: { height: 44, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.minimo,
      paddingHorizontal: ESPACIADO.medio, backgroundColor: tema.encabezado,
      borderBottomLeftRadius: BORDES.radios.contenedor, borderBottomRightRadius: BORDES.radios.contenedor },
    flecha: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    acciones: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.minimo, marginLeft: 'auto' },
  });
}
