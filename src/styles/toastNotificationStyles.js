import { StyleSheet } from 'react-native';

import { TIPOGRAFIA } from './globalStyles';
import { COLORES_NOTIFICACIONES } from './colors';

export function crearEstilosNotificacion() {
  return StyleSheet.create({
    contenedor: {
      position: 'absolute',
      right: 16,
      left: 16,
      zIndex: 1000,
      alignSelf: 'center',
      maxWidth: 560,
      overflow: 'hidden',
      borderRadius: 14,
      backgroundColor: COLORES_NOTIFICACIONES.fondo,
      elevation: 14,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    contenido: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 16,
      paddingRight: 8,
      paddingVertical: 10,
    },
    mensaje: {
      flex: 1,
      color: COLORES_NOTIFICACIONES.texto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      lineHeight: 20,
    },
    botonCerrar: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fondoBarra: {
      height: 4,
      backgroundColor: COLORES_NOTIFICACIONES.fondoBarraProgreso,
    },
    barraTiempo: {
      height: '100%',
      backgroundColor: COLORES_NOTIFICACIONES.barraProgreso,
    },
  });
}
