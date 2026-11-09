import { TIPOGRAFIA } from './globalStyles';

export const estilosGraficoCircular: Record<string, import('react-native').ViewStyle & import('react-native').TextStyle> = {
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centro: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  etiquetaCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.auxiliar,
  },
  totalCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.secundario,
    fontWeight: TIPOGRAFIA.pesos.negrita,
    maxWidth: 128,
  },
};
