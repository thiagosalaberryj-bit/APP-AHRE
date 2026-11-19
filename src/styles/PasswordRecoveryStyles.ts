import {StyleSheet} from 'react-native';
import type {Tema} from './colors';
import {BORDES, ESPACIADO, TIPOGRAFIA} from './globalStyles';

export function crearEstilosRecuperacion(tema: Tema) {
  return StyleSheet.create({
    digitos: {
      flexDirection: 'row',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 332,
      gap: ESPACIADO.minimo,
    },
    digito: {
      flex: 1,
      minWidth: 0,
      minHeight: 62,
      borderWidth: BORDES.anchos.fino,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      fontVariant: ['tabular-nums'],
    },
    inicioSegundoGrupo: {
      marginLeft: ESPACIADO.pequeno,
    },
    digitoEnfocado: {
      backgroundColor: tema.campoFondoActivo,
      borderColor: tema.foco,
      borderWidth: 2,
    },
    correo: {
      color: tema.textoPrincipal,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    volver: {
      width: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
