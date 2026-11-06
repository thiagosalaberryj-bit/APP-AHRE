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
    importe: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.monto, fontWeight: TIPOGRAFIA.pesos.seminegrita },
  });
}
