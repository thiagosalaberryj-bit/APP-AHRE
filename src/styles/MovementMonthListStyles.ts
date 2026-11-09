import { StyleSheet } from 'react-native';
import { ESPACIADO, TIPOGRAFIA } from './globalStyles';
import type { Tema } from './colors';

export function crearEstilosMesesMovimientos(tema: Tema) {
  return StyleSheet.create({
    lista: { gap: ESPACIADO.medio }, grupo: { gap: ESPACIADO.pequeno }, movimientos: { gap: ESPACIADO.pequeno },
    boton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.pequeno },
    textoBoton: { color: tema.foco, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.secundario },
    error: { color: tema.error, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.secundario },
  });
}
