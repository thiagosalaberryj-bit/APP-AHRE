import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export function crearEstilosEditorGastos(tema: Tema) {
  return StyleSheet.create({
    teclado: { flex: 1 },
    fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
    fondoAnimado: { flex: 1, justifyContent: 'flex-end' },
    overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
    zonaManija: { height: 24, alignItems: 'center', justifyContent: 'center' },
    manija: { width: 44, height: 4, borderRadius: BORDES.radios.circular, backgroundColor: tema.borde },
    cierre: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    panel: { width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '92%', backgroundColor: tema.superficie, borderTopLeftRadius: BORDES.radios.tarjeta, borderTopRightRadius: BORDES.radios.tarjeta, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, padding: ESPACIADO.grande, gap: ESPACIADO.medio },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    datosCabecera: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo },
    titulo: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    ayuda: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    cerrar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scroll: { flexGrow: 0, flexShrink: 1 },
    contenido: { gap: ESPACIADO.medio, paddingBottom: ESPACIADO.pequeno },
    seccion: { backgroundColor: tema.fondo, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio, gap: ESPACIADO.pequeno, borderWidth: BORDES.anchos.fino, borderColor: tema.borde },
    seccionActiva: { borderColor: tema.foco },
    activar: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 36 },
    nombreCampo: { flex: 1, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    estadoCampo: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    pie: { gap: ESPACIADO.pequeno, paddingTop: ESPACIADO.medio, paddingBottom: ESPACIADO.pequeno, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
    acciones: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    aplicar: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.pequeno, backgroundColor: tema.botonPrincipal, borderRadius: BORDES.radios.campo },
    textoAplicar: { color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    deshabilitado: { opacity: 0.45 },
  });
}
