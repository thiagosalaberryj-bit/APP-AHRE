import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { COLORES_ESTADO } from '../styles/colors';
import {crearEstilosTarjetaMovimiento} from '../styles/MovementCardStyles';

function formatearMontoLista(monto: number, tipo: string) {
  if (typeof monto !== 'number') return '—';
  const valor = `$${monto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  return tipo === 'ingreso' || tipo === 'transferencia_entrada' ? `+${valor}` : `-${valor}`;
}

function formatearFechaLista(fechaISO: string|number|Date, soloHora = false) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  const hora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  if (soloHora) return hora;
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dias = Math.round((inicioHoy.getTime() - inicioFecha.getTime()) / 86400000);
  const dia = dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  return `${dia} · ${hora}`;
}

export default function TarjetaMovimiento({ tema, movimiento, alPresionar, soloHora = false }: import('../types/ui').TarjetaMovimientoProps) {
  const estilos = crearEstilosTarjetaMovimiento(tema);
  const esIngreso = movimiento.tipo === 'ingreso' || movimiento.tipo === 'transferencia_entrada';
  const esTransferencia = movimiento.tipo.startsWith('transferencia_');
  const catalogo = esIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoria: Partial<(typeof CATEGORIAS_EGRESO)[number]> = catalogo.find(item => item.id === movimiento.categoria) || {};
  const nombreCategoria = esTransferencia ? 'Transferencia' : categoria.nombre || movimiento.categoria;
  const tipo = esTransferencia ? esIngreso ? 'Transferencia recibida' : 'Transferencia enviada' : esIngreso ? 'Ingreso' : 'Egreso';
  const fecha = formatearFechaLista(movimiento.fecha_hora, soloHora);
  const deposito = movimiento.deposito_nombre || movimiento.deposito;
  const metadatos = [nombreCategoria, deposito, fecha].filter(Boolean).join(' · ');
  const importe = formatearMontoLista(movimiento.monto, movimiento.tipo);
  const contenido = <>
    <View style={[estilos.icono, {backgroundColor:esIngreso?COLORES_ESTADO.ingreso:COLORES_ESTADO.egreso}]}>
      <Ionicons color={tema.encabezado} name={esTransferencia?'swap-horizontal-outline':categoria.icono || (esIngreso?'arrow-down-outline':'arrow-up-outline')} size={18}/>
    </View>
    <View style={estilos.contenido}>
      <View style={estilos.filaTitulo}>
        <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.titulo}>{movimiento.descripcion || nombreCategoria}</Text>
        <Text style={estilos.importe}>{importe}</Text>
      </View>
      <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.metadatos}>{metadatos}</Text>
      <Text style={estilos.tipo}>{tipo}</Text>
    </View>
  </>;
  const etiqueta = tipo+': '+movimiento.descripcion+'. '+importe+'. '+metadatos;
  return alPresionar ? <Pressable accessibilityLabel={etiqueta} accessibilityRole="button" onPress={()=>alPresionar(movimiento,categoria)}
    style={({pressed:presionado})=>[estilos.tarjeta,presionado&&estilos.presionada]}>{contenido}</Pressable>
    : <View accessible accessibilityLabel={etiqueta} style={estilos.tarjeta}>{contenido}</View>;
}
