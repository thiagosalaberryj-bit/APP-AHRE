import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilosDetalle(tema: Tema) {
  return StyleSheet.create({
    resumenPrincipal: { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, padding: ESPACIADO.medio, gap: ESPACIADO.pequeno },
    perfilCompacto: { padding: ESPACIADO.medio, gap: ESPACIADO.pequeno },
    nombrePersona: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    descripcion: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    detalle: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    filaImportes:{flexDirection:'row',gap:ESPACIADO.pequeno},
    tarjetaImporte:{flex:1,minWidth:0,backgroundColor:tema.fondo,borderRadius:BORDES.radios.campo,padding:ESPACIADO.pequeno,gap:ESPACIADO.minimo},
    metadatos:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:ESPACIADO.pequeno},
    historial:{gap:ESPACIADO.medio},
    registro:{borderWidth:BORDES.anchos.fino,borderColor:tema.borde,padding:ESPACIADO.medio,backgroundColor:tema.superficie,borderRadius:BORDES.radios.campo,gap:ESPACIADO.minimo},
    registroPendiente:{borderWidth:BORDES.anchos.fino,borderColor:tema.foco},
    importe: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
  });
}
