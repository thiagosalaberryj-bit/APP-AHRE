import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import {crearEstilosTarjetaMovimiento} from '../styles/MovementCardStyles';

function formatearMontoLista(monto: number, tipo: string) {
  if (!Number.isFinite(monto)) return '—';
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
  const metadatos = [nombreCategoria, deposito].filter(Boolean).join(' · ');
  const colorTipo = esIngreso ? tema.exito : tema.error;
  const importe = formatearMontoLista(movimiento.monto, movimiento.tipo);
  const contenido = <>
    <View style={[estilos.icono,{backgroundColor:colorTipo+'18'}]}>
      <Ionicons color={colorTipo} name={esTransferencia?'swap-horizontal-outline':categoria.icono || (esIngreso?'arrow-down-outline':'arrow-up-outline')} size={18}/>
    </View>
    <View style={estilos.contenido}>
      <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.titulo}>{movimiento.descripcion || nombreCategoria}</Text>
      <View style={estilos.filaMetadatos}>
        <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.metadatos}>{metadatos}</Text>
        <Text numberOfLines={1} style={estilos.fecha}>{fecha}</Text>
      </View>
    </View>
    <View style={estilos.franjaImporte}>
      <View style={estilos.filaTipo}>
        <Text ellipsizeMode="tail" numberOfLines={1} style={[estilos.tipo,{color:colorTipo}]}>{esTransferencia?esIngreso?'Recibida':'Enviada':tipo}</Text>
        {alPresionar?<Ionicons color={tema.textoSecundario} name="chevron-forward" size={16}/>:null}
      </View>
      <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.importe}>{importe}</Text>
    </View>
  </>;
  const etiqueta = tipo+': '+movimiento.descripcion+'. '+importe+'. '+metadatos+'. '+fecha;
  return alPresionar ? <Pressable accessibilityLabel={etiqueta} accessibilityRole="button" onPress={()=>alPresionar(movimiento,categoria)}
    style={({pressed:presionado})=>[estilos.tarjeta,presionado&&estilos.presionada]}>{contenido}</Pressable>
    : <View accessible accessibilityLabel={etiqueta} style={estilos.tarjeta}>{contenido}</View>;
}
