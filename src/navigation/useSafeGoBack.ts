import { BackHandler, Platform } from 'react-native';
import { controlRegresoAndroid } from './androidBackController';
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NavegacionRaiz } from './types';

type NavegacionRegreso = Pick<NavegacionRaiz, 'goBack' | 'isFocused' | 'canGoBack'>;

export function useRegresoProtegido(navegacion: NavegacionRegreso, estaBloqueado?: () => boolean) {
  const regresando = useRef(false);
  const bloqueo = useRef(estaBloqueado);
  bloqueo.current = estaBloqueado;
  const volver = useCallback(() => {
    if (regresando.current || bloqueo.current?.() || !navegacion.isFocused() || !navegacion.canGoBack()) return;
    regresando.current = true;
    if (Platform.OS === 'android') controlRegresoAndroid.registrarRegreso();
    navegacion.goBack();
  }, [navegacion]);
  useFocusEffect(useCallback(() => {
    regresando.current = false;
    if (Platform.OS !== 'android') return;
    const escucha = BackHandler.addEventListener('hardwareBackPress', () => controlRegresoAndroid.manejar({
      enfocada: navegacion.isFocused(),
      bloqueada: regresando.current || !!bloqueo.current?.(),
      puedeVolver: navegacion.canGoBack(),
      volver,
    }));
    return () => escucha.remove();
  }, [navegacion, volver]));
  return volver;
}
