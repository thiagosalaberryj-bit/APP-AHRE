import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';

export default function crearEstilosCierreSala(tema: Tema) {
  return StyleSheet.create({
    separadorPersona:{borderTopWidth:BORDES.anchos.fino,borderTopColor:tema.borde},
    accesoPendiente:{minHeight:44,flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno},
    textoPendiente:{flex:1,minWidth:0},
    encabezadoPendientes:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno,paddingTop:ESPACIADO.medio},
    iconoSala: { width: 44, height: 44, borderRadius: BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    resumenCierre: { paddingVertical: ESPACIADO.pequeno, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde, gap: ESPACIADO.minimo },
    estadoCierre: { flex: 1, minWidth: 0, padding: ESPACIADO.pequeno, borderRadius: BORDES.radios.campo, backgroundColor: tema.fondo, gap: ESPACIADO.minimo },
    listaPendientes: { borderRadius: BORDES.radios.tarjeta, backgroundColor: tema.superficie, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, paddingHorizontal: ESPACIADO.medio },
    pendienteCierre: { paddingVertical: ESPACIADO.medio },
    avisoCierre: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, padding: ESPACIADO.medio, backgroundColor: tema.superficie, borderRadius: BORDES.radios.tarjeta }
  });
}
