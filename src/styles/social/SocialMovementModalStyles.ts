import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilosConfirmacion(tema: Tema) {
  return StyleSheet.create({
    tarjetaModal: { width: '100%', maxWidth: 480, maxHeight: '88%', backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.boton, padding: ESPACIADO.grande, gap: ESPACIADO.medio },
    tituloConfirmacion: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    ayudaConfirmacion: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    contenidoConfirmacion: { gap: ESPACIADO.medio, paddingBottom: ESPACIADO.pequeno },
    resumenOperacion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, backgroundColor: tema.fondo, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio },
    iconoOperacion: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: BORDES.radios.campo / 2 },
    descripcionOperacion: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.medio },
    importeOperacion: { flex: 1, minWidth: 0, textAlign: 'right', fontSize: TIPOGRAFIA.tamanos.monto, fontWeight: TIPOGRAFIA.pesos.negrita },
    fechaHora: { gap: ESPACIADO.pequeno },
    columnaFecha: { minWidth: 0 },
    movimientoDisponible: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.medio, minHeight: 56, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo },
    movimientoSeleccionado: { backgroundColor: tema.fondo, borderColor: tema.foco },
    pieConfirmacion: { paddingTop: ESPACIADO.medio, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
    confirmarMovimiento: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: tema.botonPrincipal, borderRadius: BORDES.radios.campo, padding: ESPACIADO.pequeno },
    textoConfirmarMovimiento: { color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    confirmacionDeshabilitada: { opacity: 0.45 },
  });
}
