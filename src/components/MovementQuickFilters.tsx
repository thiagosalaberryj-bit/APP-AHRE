import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import type { Dispatch, SetStateAction } from 'react';
import { Pressable, Text } from 'react-native';
import { OPCIONES_TIPO } from '../constants/movementFilters';
import type { crearEstilosBusquedaFiltros } from '../styles/MovementSearchFiltersStyles';
import { PREAJUSTES_MONTOS, alternarGrupoCategorias, type obtenerPreajustesMovimientos } from '../utils/statisticsFilters';

export default function FiltrosRapidosMovimientos({
  estilosAccesos, tipoFiltro, cambiarTipoFiltro, establecerTipoFiltro,
  preajustesCategorias, categoriaFiltroIds, establecerCategoriaFiltroIds,
  montoMinimoNumerico, montoMaximoNumerico, errorMontoFiltro, establecerMontoMinimo, establecerMontoMaximo,
}: {
  estilosAccesos: ReturnType<typeof crearEstilosBusquedaFiltros>;
  tipoFiltro: string;
  cambiarTipoFiltro: (tipo: string) => void;
  establecerTipoFiltro: (tipo: string) => void;
  preajustesCategorias: ReturnType<typeof obtenerPreajustesMovimientos>;
  categoriaFiltroIds: string[];
  establecerCategoriaFiltroIds: Dispatch<SetStateAction<string[]>>;
  montoMinimoNumerico: number | null;
  montoMaximoNumerico: number | null;
  errorMontoFiltro: string | null;
  establecerMontoMinimo: (texto: string) => void;
  establecerMontoMaximo: (texto: string) => void;
}) {
  return (<>
      {OPCIONES_TIPO.map(opcion => <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={opcion.id} accessibilityRole="button" accessibilityState={{ selected: tipoFiltro === opcion.id }} onPress={conRespuestaVisual(() => cambiarTipoFiltro(opcion.id))} style={[estilosAccesos.filtro, tipoFiltro === opcion.id && estilosAccesos.filtroActivo]}>
        <Text style={[estilosAccesos.textoFiltro, tipoFiltro === opcion.id && estilosAccesos.textoActivo]}>{opcion.nombre}</Text>
      </Pressable>)}
      {preajustesCategorias.map(opcion => {
        const disponible = opcion.categorias.length > 0;
        const activo = disponible && tipoFiltro === opcion.tipo && opcion.categorias.every(id => categoriaFiltroIds.includes(id));
        return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={opcion.tipo + ':' + opcion.id} accessibilityRole="button" accessibilityState={{ selected: activo, disabled: !disponible }} disabled={!disponible} accessibilityHint={disponible ? undefined : 'No hay movimientos de estas categorías.'}
          onPress={conRespuestaVisual(() => {
            establecerTipoFiltro(opcion.tipo);
            establecerCategoriaFiltroIds(actuales => alternarGrupoCategorias(tipoFiltro === opcion.tipo || tipoFiltro === 'todos' ? actuales : [], opcion.categorias));
          })}
          style={[estilosAccesos.filtro, activo && estilosAccesos.filtroActivo, !disponible && { opacity: 0.5 }]}>
          <Text style={[estilosAccesos.textoFiltro, activo && estilosAccesos.textoActivo]}>{opcion.nombre}</Text>
        </Pressable>;
      })}
      {PREAJUSTES_MONTOS.filter(opcion => opcion.id !== 'todos').map(opcion => {
        const activo = !errorMontoFiltro && (montoMinimoNumerico ?? undefined) === opcion.rango.minimo && (montoMaximoNumerico ?? undefined) === opcion.rango.maximo;
        return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={'monto:' + opcion.id} accessibilityRole="button" accessibilityState={{ selected: activo }}
          onPress={conRespuestaVisual(() => { establecerMontoMinimo(activo || opcion.rango.minimo === undefined ? '' : String(opcion.rango.minimo).replace('.', ',')); establecerMontoMaximo(activo || opcion.rango.maximo === undefined ? '' : String(opcion.rango.maximo).replace('.', ',')); })}
          style={[estilosAccesos.filtro, activo && estilosAccesos.filtroActivo]}>
          <Text style={[estilosAccesos.textoFiltro, activo && estilosAccesos.textoActivo]}>{opcion.nombre}</Text>
        </Pressable>;
      })}
  </>);
}
