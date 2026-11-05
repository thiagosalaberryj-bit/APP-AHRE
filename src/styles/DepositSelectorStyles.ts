import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosSelectorDeposito(tema: Tema) {
  return StyleSheet.create({
    grupo: { gap: ESPACIADO.pequeno },
    etiqueta: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.etiqueta, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    control: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.medio, minHeight: 64, paddingHorizontal: ESPACIADO.grande, paddingVertical: ESPACIADO.medio, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, backgroundColor: tema.superficie },
    controlAbierto: { borderColor: tema.foco },
    controlError: { borderColor: tema.error },
    icono: { width: 28, height: 28, borderRadius: BORDES.radios.campo / 2, alignItems: 'center', justifyContent: 'center' },
    iconoCampo: { width: 36, height: 36, borderRadius: BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    nombreCampo: { color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    detalleCampo: { color: tema.textoSecundario, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.secundario },
    textos: { flex: 1, minWidth: 0, gap: 2 },
    nombre: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.medio },
    detalle: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    error: { color: tema.error, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    capa: { flex: 1 },
    cierre: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    menu: { position: 'absolute', backgroundColor: tema.superficie, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, overflow: 'hidden', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
    sinPosicion: { opacity: 0 },
    opcion: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.pequeno },
    opcionActiva: { backgroundColor: tema.fondo },
    cabeceraLista: { height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: ESPACIADO.medio, borderBottomWidth: BORDES.anchos.fino, borderBottomColor: tema.borde },
    accion: { minHeight: 40, paddingHorizontal: ESPACIADO.medio, justifyContent: 'center' },
    textoAccion: { color: tema.foco, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    confirmar: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
  });
}
