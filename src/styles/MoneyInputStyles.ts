import { StyleSheet } from 'react-native';
import { ESPACIADO, TIPOGRAFIA } from './globalStyles';
import type { Tema } from './colors';

export function crearEstilosEntradaMonto(tema: Tema) {
  return StyleSheet.create({
    compacto: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.minimo },
    entradaCompacta: {
      flex: 1, minWidth: 0, color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.cuerpo,
      paddingVertical: ESPACIADO.pequeno,
    },
  });
}
