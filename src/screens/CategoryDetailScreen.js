import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoCompacto from '../components/CompactHeader';
import { RUTAS } from '../constants/routes';
import { COLORES_GRAFICOS, TEMAS } from '../styles/colors';
import { ESPACIADO, crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleCategoria } from '../styles/CategoryDetailScreenStyles';

const MESES = Object.freeze(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']);
const MES_INICIAL = 'Mar';
const ANCHO_BOTON_MES = 40;
const DISTANCIA_MESES = ANCHO_BOTON_MES + ESPACIADO.minimo;

const MONTOS_MENSUALES = Object.freeze({
  Ene: '$ 3.850',
  Feb: '$ 2.990',
  Mar: '$ 4.130',
  Abr: '$ 3.240',
  May: '$ 2.760',
  Jun: '$ 4.580',
  Jul: '$ 3.320',
  Ago: '$ 2.410',
  Sep: '$ 5.120',
  Oct: '$ 3.670',
  Nov: '$ 4.890',
  Dic: '$ 3.950',
});

const CATEGORIAS = Object.freeze({
  comida: { id: 'comida', nombre: 'Comida', icono: 'restaurant-outline', color: COLORES_GRAFICOS[0] },
  transporte: { id: 'transporte', nombre: 'Transporte', icono: 'car-outline', color: COLORES_GRAFICOS[4] },
  servicios: { id: 'servicios', nombre: 'Servicios', icono: 'flash-outline', color: COLORES_GRAFICOS[3] },
  salud: { id: 'salud', nombre: 'Salud', icono: 'medkit-outline', color: COLORES_GRAFICOS[2] },
  entretenimiento: {
    id: 'entretenimiento',
    nombre: 'Entretenimiento',
    icono: 'game-controller-outline',
    color: COLORES_GRAFICOS[1],
  },
});

const NOMBRES_MOVIMIENTOS = Object.freeze({
  comida: 'Supermercado',
  transporte: 'Viaje',
  servicios: 'Servicio de internet',
  salud: 'Farmacia',
  entretenimiento: 'Youtube Music',
});

const MOVIMIENTOS_POR_MES = Object.freeze({
  Ene: { comida: 'Supermercado', transporte: 'SUBE', servicios: 'Internet', salud: 'Farmacia', entretenimiento: 'Netflix' },
  Feb: { comida: 'Almacén', transporte: 'Taxi', servicios: 'Spotify', salud: 'Consulta médica', entretenimiento: 'Disney+' },
  Mar: { comida: 'Supermercado', transporte: 'Colectivo', servicios: 'Internet', salud: 'Farmacia', entretenimiento: 'Youtube Music' },
  Abr: { comida: 'Verdulería', transporte: 'SUBE', servicios: 'Electricidad', salud: 'Farmacia', entretenimiento: 'Netflix' },
  May: { comida: 'Supermercado', transporte: 'Taxi', servicios: 'Spotify', salud: 'Consulta médica', entretenimiento: 'Youtube Music' },
  Jun: { comida: 'Almacén', transporte: 'Colectivo', servicios: 'Internet', salud: 'Farmacia', entretenimiento: 'Disney+' },
  Jul: { comida: 'Supermercado', transporte: 'SUBE', servicios: 'Electricidad', salud: 'Consulta médica', entretenimiento: 'Netflix' },
  Ago: { comida: 'Verdulería', transporte: 'Taxi', servicios: 'Internet', salud: 'Farmacia', entretenimiento: 'Youtube Music' },
  Sep: { comida: 'Almacén', transporte: 'Colectivo', servicios: 'Spotify', salud: 'Consulta médica', entretenimiento: 'Disney+' },
  Oct: { comida: 'Supermercado', transporte: 'SUBE', servicios: 'Electricidad', salud: 'Farmacia', entretenimiento: 'Youtube Music' },
  Nov: { comida: 'Verdulería', transporte: 'Taxi', servicios: 'Internet', salud: 'Consulta médica', entretenimiento: 'Netflix' },
  Dic: { comida: 'Almacén', transporte: 'Colectivo', servicios: 'Spotify', salud: 'Farmacia', entretenimiento: 'Youtube Music' },
});

function crearMovimientosSimulados(categoria, mes) {
  const nombre = MOVIMIENTOS_POR_MES[mes]?.[categoria.id]
    || NOMBRES_MOVIMIENTOS[categoria.id]
    || categoria.nombre;
  const cantidad = categoria.id === 'entretenimiento' && mes === 'Mar' ? 5 : 1;

  return Array.from({ length: cantidad }, (_, indice) => ({
    id: `${mes}-${categoria.id}-${indice + 1}`,
    categoriaId: categoria.id,
    nombre,
    fecha: mes === 'Mar' ? 'Ayer · 9:40' : `${mes} · 9:40`,
    metodoPago: 'Mercado pago',
    destinatario: nombre,
    descripcion: `${nombre} · ${mes}`,
    monto: '−$4130',
    montoDetalle: '$ 4130',
  }));
}

export default function PantallaDetalleCategoria({ navigation: navegacion, route: ruta }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleCategoria(tema);
  const movimiento = ruta.params?.movimiento;
  const categoriaRecibida = ruta.params?.categoria;
  const categoriaId = categoriaRecibida?.id || movimiento?.categoriaId || 'entretenimiento';
  const categoria = {
    ...(CATEGORIAS[categoriaId] || CATEGORIAS.entretenimiento),
    ...categoriaRecibida,
  };
  const selectorMeses = useRef(null);
  const [anchoSelectorMeses, establecerAnchoSelectorMeses] = useState(0);
  const [mesSeleccionado, establecerMesSeleccionado] = useState(MES_INICIAL);
  const paddingSelectorMeses = Math.max(
    ESPACIADO.minimo,
    (anchoSelectorMeses - ANCHO_BOTON_MES) / 2,
  );
  const movimientos = crearMovimientosSimulados(categoria, mesSeleccionado);
  const montoCategoria = categoria.monto || MONTOS_MENSUALES[mesSeleccionado];
  const montoMes = mesSeleccionado === 'Mar' ? montoCategoria : MONTOS_MENSUALES[mesSeleccionado];

  const abrirDetalleMovimiento = (movimientoSeleccionado) => {
    navegacion.push(RUTAS.DETALLE_CATEGORIA, {
      categoria,
      movimiento: movimientoSeleccionado,
    });
  };

  const centrarMes = (mes, animado = true) => {
    const indice = MESES.indexOf(mes);
    if (indice >= 0) {
      selectorMeses.current?.scrollTo({
        animated: animado,
        x: indice * DISTANCIA_MESES,
      });
    }
  };

  const seleccionarMesVisible = (evento) => {
    const indice = Math.round(evento.nativeEvent.contentOffset.x / DISTANCIA_MESES);
    const mes = MESES[Math.min(Math.max(indice, 0), MESES.length - 1)];
    establecerMesSeleccionado(mes);
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoCompacto
          alVolver={() => navegacion.goBack()}
          tema={tema}
          titulo="Detalle Categoría"
        />

        {movimiento ? (
          <ScrollView contentContainerStyle={estilos.contenidoMovimiento} showsVerticalScrollIndicator={false}>
            <View style={estilos.encabezadoMovimiento}>
              <View style={estilos.iconoCategoriaGrande}>
                <Ionicons color={tema.botonPrincipal} name={categoria.icono} size={52} />
              </View>
              <Text style={estilos.nombreMovimientoDetalle}>{movimiento.nombre}</Text>
              <Text style={estilos.nombreCategoriaDetalle}>{categoria.nombre}</Text>
              <Text style={estilos.montoMovimientoDetalle}>{movimiento.montoDetalle || '$ 4130'}</Text>
            </View>

            <View style={estilos.tarjetaDatosMovimiento}>
              <View style={estilos.datoMovimiento}>
                <Text style={estilos.etiquetaDato}>Destinatario</Text>
                <Text style={estilos.valorDato}>{movimiento.destinatario || '—'}</Text>
              </View>
              <View style={estilos.datoMovimiento}>
                <Text style={estilos.etiquetaDato}>Método de pago</Text>
                <Text style={estilos.valorDato}>{movimiento.metodoPago || '—'}</Text>
              </View>
              <View style={estilos.datoMovimiento}>
                <Text style={estilos.etiquetaDato}>Descripción</Text>
                <Text style={estilos.valorDato}>{movimiento.descripcion || '—'}</Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={estilos.contenidoCategoria} showsVerticalScrollIndicator={false}>
            <View style={estilos.encabezadoCategoria}>
              <View style={estilos.iconoCategoriaGrande}>
                <Ionicons color={tema.botonPrincipal} name={categoria.icono} size={52} />
              </View>
              <Text style={estilos.nombreCategoriaResumen}>{categoria.nombre}</Text>
              <Text style={estilos.anioCategoria}>2026</Text>
            </View>

            <ScrollView
              ref={selectorMeses}
              contentContainerStyle={[
                estilos.contenedorMeses,
                { paddingHorizontal: paddingSelectorMeses },
              ]}
              decelerationRate="fast"
              onLayout={(evento) => {
                establecerAnchoSelectorMeses(evento.nativeEvent.layout.width);
                requestAnimationFrame(() => centrarMes(mesSeleccionado, false));
              }}
              onMomentumScrollEnd={seleccionarMesVisible}
              onScrollEndDrag={seleccionarMesVisible}
              horizontal
              nestedScrollEnabled
              snapToInterval={DISTANCIA_MESES}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              style={estilos.selectorMeses}
            >
              {MESES.map((mes) => (
                <Pressable
                  accessibilityLabel={`${mes} 2026`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mesSeleccionado === mes }}
                  key={mes}
                  onPress={() => {
                    establecerMesSeleccionado(mes);
                    centrarMes(mes);
                  }}
                  style={estilos.botonMes}
                >
                  <View
                    style={[
                      estilos.marcaMes,
                      mesSeleccionado === mes && estilos.marcaMesActiva,
                    ]}
                  />
                  <Text style={estilos.etiquetaMes}>{mes.toUpperCase()}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text accessibilityLiveRegion="polite" style={estilos.montoCategoria}>{montoMes}</Text>
            <View style={estilos.separadorCategoria} />

            <View style={estilos.listaMovimientosCategoria}>
              {movimientos.map((movimientoCategoria) => (
                <Pressable
                  accessibilityLabel={`Ver detalle de ${movimientoCategoria.nombre}`}
                  accessibilityRole="button"
                  key={movimientoCategoria.id}
                  onPress={() => abrirDetalleMovimiento(movimientoCategoria)}
                  style={estilos.filaMovimiento}
                >
                  <View style={estilos.iconoMovimiento}>
                    <Ionicons color={tema.botonPrincipal} name="card-outline" size={21} />
                  </View>
                  <View style={estilos.detalleFilaMovimiento}>
                    <Text numberOfLines={1} style={estilos.nombreFilaMovimiento}>{movimientoCategoria.nombre}</Text>
                    <Text numberOfLines={1} style={estilos.subtituloFilaMovimiento}>
                      {movimientoCategoria.fecha} · {movimientoCategoria.metodoPago}
                    </Text>
                  </View>
                  <Text style={estilos.montoFilaMovimiento}>{movimientoCategoria.monto}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
