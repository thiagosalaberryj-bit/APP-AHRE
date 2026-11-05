import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilosModal(tema: Tema) {
  const boton = { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: ESPACIADO.minimo, paddingHorizontal: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo };
  return StyleSheet.create({
    tarjetaModal: { width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: tema.superficie, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.boton, padding: ESPACIADO.grande, gap: ESPACIADO.pequeno },
    buscador: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.pequeno, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, backgroundColor: tema.superficie },
    buscadorEnfocado: { borderColor: tema.foco },
    entradaBusqueda: { flex: 1, minWidth: 0, minHeight: 44, color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, paddingVertical: ESPACIADO.pequeno },
    contador: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    personaAgenda: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 52, padding: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo / 2 },
    personaSeleccionada: { backgroundColor: tema.fondo },
    nombrePersona: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.medio },
    apodo: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar },
    acciones: { flexDirection: 'row', gap: ESPACIADO.pequeno, paddingTop: ESPACIADO.medio, borderTopColor: tema.borde, borderTopWidth: BORDES.anchos.fino },
    crear: { ...boton, borderColor: tema.borde, borderWidth: BORDES.anchos.fino },
    agregar: { ...boton, backgroundColor: tema.botonPrincipal },
    textoCrear: { color: tema.foco, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    textoAgregar: { color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    deshabilitado: { opacity: 0.45 },
  });
}
