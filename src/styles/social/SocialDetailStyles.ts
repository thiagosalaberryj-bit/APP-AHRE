import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export function crearEstilosDetalleSocial(tema: Tema) {
  return StyleSheet.create({
    pagina: { gap: ESPACIADO.medio },
    tarjeta: { backgroundColor: tema.superficie, borderWidth: BORDES.anchos.fino, borderColor: tema.borde, borderRadius: BORDES.radios.campo, padding: ESPACIADO.grande, gap: ESPACIADO.medio },
    cabecera: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.medio },
    filaApodoCuenta:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno,minWidth:0},
    apodoCompacto:{flexShrink:1,minWidth:0},
    estadoCuenta:{flexShrink:0,flexDirection:'row',alignItems:'center',gap:ESPACIADO.minimo},
    textoEstadoCuenta:{flexShrink:1,color:tema.textoSecundario,fontSize:TIPOGRAFIA.tamanos.auxiliar},
    identidad: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo },
    nombre: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    secundario: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 },
    cifras: { flexDirection: 'row', gap: ESPACIADO.pequeno },
    valor: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita, textAlign: 'right' },
    seccionDeudas: {gap:ESPACIADO.medio,marginTop:ESPACIADO.pequeno},
    cabeceraDeudas: {flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno,minHeight:48,paddingVertical:ESPACIADO.pequeno,},
    tituloDeudas: {color:tema.textoPrincipal,flex:1,minWidth:0,fontSize:TIPOGRAFIA.tamanos.encabezado,fontWeight:TIPOGRAFIA.pesos.seminegrita},
    cantidadDeudas: {color:tema.textoSecundario,fontSize:TIPOGRAFIA.tamanos.secundario},
    seccion: { gap: ESPACIADO.pequeno },
    encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, justifyContent: 'space-between' },
    tituloSeccion: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    editar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    registrar: { minHeight: 44, borderRadius: BORDES.radios.campo, backgroundColor: tema.botonPrincipal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ESPACIADO.medio },
    textoRegistrar: { color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    deshabilitado: { opacity: 0.45 },
    enlace: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.medio, backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo },
    textoEnlace: { flex: 1, minWidth: 0, color: tema.foco, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.medio },
    vacio: { color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.secundario, paddingVertical: ESPACIADO.pequeno },
  });
}
