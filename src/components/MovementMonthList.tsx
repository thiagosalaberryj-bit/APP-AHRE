import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from './LoadingDots';
import { Pressable, Text, View } from 'react-native';
import { memo } from 'react';
import EncabezadoSeccionPlegable from './CollapsibleSectionHeader';
import TarjetaMovimiento from './MovementCard';
import type { useMovimientosPorMes } from '../movements/useMonthlyMovements';
import type { Tema } from '../styles/colors';
import { crearEstilosMesesMovimientos } from '../styles/MovementMonthListStyles';

const TarjetaMovimientoMemorizada = memo(TarjetaMovimiento);

export default function ListaMesesMovimientos({ datos, tema, alPresionar }: {
  datos: ReturnType<typeof useMovimientosPorMes>; tema: Tema;
  alPresionar: Parameters<typeof TarjetaMovimiento>[0]['alPresionar'];
}) {
  const estilos = crearEstilosMesesMovimientos(tema);
  return <View style={estilos.lista}>
    {datos.meses.map(({ mes }) => {
      const [anio, numero] = mes.split('-').map(Number);
      const titulo = new Date(anio, numero - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^./, letra => letra.toUpperCase());
      const pagina = datos.paginas[mes];
      return <View key={mes} style={estilos.grupo}>
        <View collapsable={false} nativeID={`encabezado-mes-${mes}`} ref={nodo => { datos.referenciaEncabezado(mes, nodo); }}>
          <EncabezadoSeccionPlegable tema={tema} titulo={titulo} expandido={!!datos.abiertos[mes]} alAlternar={() => datos.alternarMes(mes)}/>
        </View>
        {datos.abiertos[mes] ? <View style={estilos.movimientos}>
          {!pagina || pagina.preparando ? <View style={estilos.cargaInicial} accessibilityRole="progressbar" accessibilityLabel={`Cargando movimientos de ${titulo}`} accessibilityState={{ busy: true }}>
            <PuntosCarga color={tema.foco} size="small"/>
            <Text style={estilos.textoBoton}>Cargando movimientos…</Text>
          </View> : <>
          {pagina?.movimientos.map(movimiento => <TarjetaMovimientoMemorizada key={movimiento.id} tema={tema} movimiento={movimiento} alPresionar={alPresionar}/>)}

          {pagina.cargando || pagina.hayMas || pagina.error ? <View collapsable={false} nativeID={`cargar-mes-${mes}`} ref={nodo => { datos.referenciaBoton(mes, nodo); }}>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={`Cargar más movimientos de ${titulo}`}
              accessibilityState={{ disabled: !!pagina?.cargando, busy: !!pagina?.cargando }} disabled={!!pagina?.cargando}
              onPress={conRespuestaVisual(() => { void datos.cargarMes(mes); })} style={estilos.boton}>
              {pagina?.cargando ? <PuntosCarga color={tema.foco} size="small" accessibilityLabel="Cargando movimientos"/> : null}
              <Text style={estilos.textoBoton}>{pagina?.cargando ? 'Cargando movimientos…' : pagina?.error ? 'Reintentar cargar movimientos' : 'Cargar más movimientos'}</Text>
            </Pressable>
          </View> : null}
          </>}
        </View> : null}
      </View>;
    })}
  </View>;
}
