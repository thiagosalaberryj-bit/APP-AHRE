import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilosFila(tema: Tema) {
  return StyleSheet.create({
    listaGastos: { gap: ESPACIADO.pequeno },
    resumenLista: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno },
    cantidadItems: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    totalLista: { flex: 1, minWidth: 0, textAlign: 'right', color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    tarjetaItem: { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio, gap: ESPACIADO.pequeno },
    tituloItem: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    resumenItem: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    campo: { borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo / 2 },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    accion: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: BORDES.radios.campo / 2 },
    editar: { backgroundColor: `${tema.foco}18` },
    borrar: { backgroundColor: tema.errorFondo },
    nombre: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, flex: 1, minWidth: 0, height: 38, minHeight: 38, paddingVertical: 0, paddingHorizontal: ESPACIADO.pequeno },
    precio: { width: 108, height: 38, minHeight: 38, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.pequeno, gap: ESPACIADO.minimo },
    entradaPrecio: { fontSize: TIPOGRAFIA.tamanos.secundario, flex: 1, minWidth: 0, paddingVertical: 0, textAlign: 'right', color: tema.textoPrincipal },
  });
}
