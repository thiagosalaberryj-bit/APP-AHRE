import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    grupo: { gap: ESPACIADO.pequeno },
    tarjetaSala: { padding: ESPACIADO.medio, borderRadius: BORDES.radios.campo },
    resumenPrincipal: { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio, gap: ESPACIADO.pequeno },
    iconoSala: { width: 40, height: 40, borderRadius: BORDES.radios.campo / 2, alignItems: 'center', justifyContent: 'center' },
    tituloSala: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    textoSala: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    importeSala: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.monto, fontWeight: TIPOGRAFIA.pesos.negrita },
    tituloFila: { fontSize: TIPOGRAFIA.tamanos.cuerpo, lineHeight: 20 },
    metadatosFila: { fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    franjaImporteHistorial: { width: 108, alignSelf: 'stretch', gap: ESPACIADO.minimo, backgroundColor: tema.fondo, borderRadius: BORDES.radios.campo / 2, paddingHorizontal: ESPACIADO.pequeno, paddingVertical: ESPACIADO.minimo },
    iconoHistorialDeuda: { width: 28, height: 28, borderRadius: BORDES.radios.campo / 2, alignItems: 'center', justifyContent: 'center' },
    accionPanel: { flex: 1, minWidth: 0, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.minimo, padding: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo, backgroundColor: tema.botonPrincipal },
    textoAccionPanel: { color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.seminegrita, textAlign: 'center' },
    resumenGastosSala: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'nowrap', gap: ESPACIADO.pequeno, paddingTop: ESPACIADO.pequeno, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
    cerrarSala: { minHeight: 44, paddingVertical: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo },
  });
}
