import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';

export default function crearEstilosFila(tema: Tema) {
  return StyleSheet.create({
    campo: { borderColor: tema.borde, borderWidth: BORDES.anchos.fino },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    accion: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: BORDES.radios.campo },
    editar: { backgroundColor: `${tema.foco}18` },
    borrar: { backgroundColor: tema.errorFondo },
    nombre: { flex: 1, minWidth: 0, height: 48, minHeight: 48, paddingVertical: 0, paddingHorizontal: ESPACIADO.pequeno },
    precio: { width: 108, height: 48, minHeight: 48, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.pequeno, gap: ESPACIADO.minimo },
    entradaPrecio: { flex: 1, minWidth: 0, paddingVertical: 0, textAlign: 'right', color: tema.textoPrincipal },
  });
}
