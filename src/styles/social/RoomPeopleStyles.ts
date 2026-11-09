import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    grupo: { gap: ESPACIADO.pequeno },
    busquedaAgenda: { flex: 1, minWidth: 0, height: 44, minHeight: 44, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, paddingVertical: 0, paddingHorizontal: ESPACIADO.pequeno, gap: ESPACIADO.pequeno },
    busquedaEnfocada: { borderColor: tema.foco },
    entradaBusquedaAgenda: { minHeight: 44, paddingVertical: 0, fontSize: TIPOGRAFIA.tamanos.secundario },
    agregarPersonaAgenda: { width: 44, height: 44, minHeight: 44, backgroundColor: tema.botonPrincipal, borderRadius: BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    accionIcono: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    personaAgenda: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 52, paddingVertical: ESPACIADO.minimo, borderBottomWidth: BORDES.anchos.fino, borderBottomColor: tema.borde },
    avatarAgenda: { width: 32, height: 32, borderRadius: BORDES.radios.circular, alignItems: 'center', justifyContent: 'center', backgroundColor: tema.contenedorVerde },
    nombrePersona: { fontSize: TIPOGRAFIA.tamanos.secundario },
    detallePersona: { fontSize: TIPOGRAFIA.tamanos.auxiliar },
    iconoConfirmacionEliminar: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.errorFondo
    },
    resumenPersonaEliminar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.medio,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.fondo
    },
    avisoPersonaEliminar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ESPACIADO.pequeno,
      padding: ESPACIADO.medio,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.errorFondo
    },
    confirmarQuitarPersona: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.boton,
      backgroundColor: tema.error,
      padding: ESPACIADO.pequeno
    },
    agenda: {
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.campo,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      padding: ESPACIADO.medio
    }
  });
}
