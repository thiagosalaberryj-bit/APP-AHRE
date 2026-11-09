import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';
import type { Tema } from './colors';

export function crearEstilosMesesMovimientos(tema: Tema) {
  return StyleSheet.create({
    lista: { gap: ESPACIADO.medio }, grupo: { gap: ESPACIADO.pequeno }, movimientos: { gap: ESPACIADO.pequeno },
    boton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.pequeno },
    textoBoton: { color: tema.foco, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.secundario },
    error: { color: tema.error, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.secundario },
    cargaInicial: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.pequeno },
    filaSubir: { alignItems: 'flex-end', paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.minimo, backgroundColor: tema.fondo },
    botonSubir: { width: 44, height: 44, borderRadius: BORDES.radios.circular, alignItems: 'center', justifyContent: 'center', backgroundColor: tema.superficie },
  });
}
