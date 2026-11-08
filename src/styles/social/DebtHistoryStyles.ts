import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilosHistorial(tema: Tema) {
  return StyleSheet.create({
    historial: { gap: ESPACIADO.pequeno },
    grupo: { gap: ESPACIADO.pequeno },
    buscador: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 44, paddingLeft: ESPACIADO.medio, backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo },
    buscadorEnfocado: { borderColor: tema.foco },
    entradaBusqueda: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: ESPACIADO.pequeno, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario },
    accionBusqueda: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    agregarDeuda: { width: 44, height: 44, backgroundColor: tema.botonPrincipal, borderRadius: BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    filaFiltros:{flexDirection:'row',gap:ESPACIADO.pequeno},
    resultado: { lineHeight: 16, color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
  });
}
