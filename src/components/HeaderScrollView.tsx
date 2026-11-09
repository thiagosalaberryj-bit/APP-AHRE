import { useCallback, useContext, useEffect, useRef, type Ref } from 'react';
import { ScrollView, SectionList, type ScrollViewProps, type SectionListProps } from 'react-native';
import { ContextoEncabezado } from './ScreenHeaderFrame';

function asignarReferencia<T>(referencia: Ref<T> | undefined, nodo: T | null) {
  if (typeof referencia === 'function') referencia(nodo);
  else if (referencia) referencia.current = nodo;
}

function useDesplazamientoEncabezado(propiedades: ScrollViewProps, subir: (animado: boolean) => void) {
  const contexto = useContext(ContextoEncabezado);
  useEffect(() => contexto?.registrar(subir), [contexto?.registrar, subir]);
  return {
    onScroll: (evento: Parameters<NonNullable<ScrollViewProps['onScroll']>>[0]) => { contexto?.alDesplazar(evento); propiedades.onScroll?.(evento); },
    onScrollBeginDrag: (evento: Parameters<NonNullable<ScrollViewProps['onScrollBeginDrag']>>[0]) => { contexto?.alIniciarArrastre(evento); propiedades.onScrollBeginDrag?.(evento); },
    onScrollEndDrag: (evento: Parameters<NonNullable<ScrollViewProps['onScrollEndDrag']>>[0]) => { contexto?.alTerminarArrastre(); propiedades.onScrollEndDrag?.(evento); },
    onMomentumScrollBegin: (evento: Parameters<NonNullable<ScrollViewProps['onMomentumScrollBegin']>>[0]) => { contexto?.alIniciarInercia(); propiedades.onMomentumScrollBegin?.(evento); },
    onMomentumScrollEnd: (evento: Parameters<NonNullable<ScrollViewProps['onMomentumScrollEnd']>>[0]) => { contexto?.alTerminarMovimiento(); propiedades.onMomentumScrollEnd?.(evento); },
    scrollEventThrottle: propiedades.scrollEventThrottle ?? 16,
  };
}

export function DesplazamientoEncabezado({ ref, alVolverAlInicio, ...propiedades }: ScrollViewProps & { ref?: Ref<ScrollView>; alVolverAlInicio?: () => void }) {
  const nativo = useRef<ScrollView | null>(null);
  const antesDeSubir = useRef(alVolverAlInicio); antesDeSubir.current = alVolverAlInicio;
  const asignar = useCallback((nodo: ScrollView | null) => { nativo.current = nodo; asignarReferencia(ref, nodo); }, [ref]);
  const subir = useCallback((animated: boolean) => { antesDeSubir.current?.(); nativo.current?.scrollTo({ y: 0, animated }); }, []);
  const eventos = useDesplazamientoEncabezado(propiedades, subir);
  return <ScrollView {...propiedades} {...eventos} ref={asignar}/>;
}

export function SeccionesEncabezado<Registro, Seccion>({ ref, ...propiedades }: SectionListProps<Registro, Seccion> & { ref?: Ref<SectionList<Registro, Seccion>> }) {
  const nativo = useRef<SectionList<Registro, Seccion> | null>(null);
  const asignar = useCallback((nodo: SectionList<Registro, Seccion> | null) => { nativo.current = nodo; asignarReferencia(ref, nodo); }, [ref]);
  const subir = useCallback((animated: boolean) => nativo.current?.getScrollResponder()?.scrollTo({ y: 0, animated }), []);
  const eventos = useDesplazamientoEncabezado(propiedades, subir);
  return <SectionList {...propiedades} {...eventos} ref={asignar}/>;
}
