import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { COLORES_ESTADO } from '../styles/colors';

function formatearMontoLista(monto, tipo) {
  if (typeof monto !== 'number') return '—';
  const valor = `$${Math.round(monto).toLocaleString('es-AR')}`;
  return tipo === 'ingreso' ? `+${valor}` : `-${valor}`;
}

function formatearFechaLista(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dias = Math.round((inicioHoy - inicioFecha) / 86400000);
  const dia = dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  const hora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  return `${dia} · ${hora}`;
}

export default function TarjetaMovimiento({ tema, estilos, movimiento, alPresionar }) {
  const esIngreso = movimiento.tipo === 'ingreso';
  const catalogo = esIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoria = catalogo.find((item) => item.id === movimiento.categoria) || {};
  const deposito = DEPOSITOS_SIMULADOS.find((item) => item.id === movimiento.deposito_id) || {};
  const colorTipo = esIngreso ? COLORES_ESTADO.ingreso : COLORES_ESTADO.egreso;

  return (
    <Pressable
      accessibilityLabel={`${esIngreso ? 'Ingreso' : 'Egreso'}: ${movimiento.descripcion}`}
      accessibilityRole="button"
      onPress={() => alPresionar(movimiento, categoria)}
      style={({ pressed: presionado }) => [estilos.filaMovimiento, presionado ? estilos.filaPresionada : null]}
    >
      <View style={[estilos.iconoMovimiento, { backgroundColor: colorTipo }]}>
        <Ionicons color={tema.encabezado} name={categoria.icono || 'swap-horizontal-outline'} size={20} />
      </View>
      <View style={estilos.detalleMovimiento}>
        <Text numberOfLines={1} style={estilos.nombreMovimiento}>{movimiento.descripcion}</Text>
        <Text numberOfLines={1} style={estilos.metaMovimiento}>
          {`${categoria.nombre || movimiento.categoria} · ${formatearFechaLista(movimiento.fecha_hora)} · ${deposito.nombre || ''}`}
        </Text>
        <Text style={estilos.tipoMovimiento}>{esIngreso ? 'Ingreso' : 'Egreso'}</Text>
      </View>
      <Text style={estilos.montoMovimiento}>{formatearMontoLista(movimiento.monto, movimiento.tipo)}</Text>
    </Pressable>
  );
}
