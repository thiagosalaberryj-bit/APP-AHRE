import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoSeccion from '../components/SectionHeader';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  DEPOSITOS_SIMULADOS,
} from '../constants/movimientos';
import { obtenerColoresGraficos, TEMAS } from '../styles/colors';
import { ESPACIADO, crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleCategoria } from '../styles/CategoryDetailScreenStyles';

const MESES = Object.freeze([
  { id: 0, corto: 'Ene', nombre: 'Enero' },
  { id: 1, corto: 'Feb', nombre: 'Febrero' },
  { id: 2, corto: 'Mar', nombre: 'Marzo' },
  { id: 3, corto: 'Abr', nombre: 'Abril' },
  { id: 4, corto: 'May', nombre: 'Mayo' },
  { id: 5, corto: 'Jun', nombre: 'Junio' },
  { id: 6, corto: 'Jul', nombre: 'Julio' },
  { id: 7, corto: 'Ago', nombre: 'Agosto' },
  { id: 8, corto: 'Sep', nombre: 'Septiembre' },
  { id: 9, corto: 'Oct', nombre: 'Octubre' },
  { id: 10, corto: 'Nov', nombre: 'Noviembre' },
  { id: 11, corto: 'Dic', nombre: 'Diciembre' },
]);
const ANCHO_BOTON_MES = 56;
const DISTANCIA_MESES = ANCHO_BOTON_MES + ESPACIADO.minimo;
function formatearMonto(monto, tipo) {
  const valor = `$ ${Math.round(monto).toLocaleString('es-AR')}`;
  return tipo === 'ingreso' ? `+ ${valor}` : `− ${valor}`;
}

function formatearFechaDia(fecha) {
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  });
}

function formatearHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function obtenerNombreDeposito(depositoId) {
  return DEPOSITOS_SIMULADOS.find((deposito) => deposito.id === depositoId)?.nombre || 'Depósito';
}

function agruparMovimientosPorDia(movimientos) {
  return movimientos.reduce((grupos, movimiento) => {
    const fecha = new Date(movimiento.fecha_hora);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    let grupo = grupos[grupos.length - 1];

    if (!grupo || grupo.clave !== clave) {
      grupo = { clave, fecha, movimientos: [] };
      grupos.push(grupo);
    }

    grupo.movimientos.push(movimiento);
    return grupos;
  }, []);
}

export default function PantallaDetalleCategoria({ navigation: navegacion, route: ruta }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleCategoria(tema);
  const categoriaRecibida = ruta.params?.categoria || {};
  const tipoMovimiento = ruta.params?.tipoMovimiento === 'ingreso' ? 'ingreso' : 'egreso';
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const indiceCategoria = catalogo.findIndex((item) => item.id === categoriaRecibida.id);
  const categoriaCatalogo = catalogo[indiceCategoria] || catalogo[0];
  const coloresGraficos = obtenerColoresGraficos(tema);
  const categoria = {
    ...categoriaCatalogo,
    ...categoriaRecibida,
    color: coloresGraficos[Math.max(0, indiceCategoria) % coloresGraficos.length],
  };
  const anio = ruta.params?.anio || new Date().getFullYear();
  const [mesSeleccionado, establecerMesSeleccionado] = useState(
    () => ruta.params?.mes ?? new Date().getMonth(),
  );
  const selectorMeses = useRef(null);
  const [anchoSelectorMeses, establecerAnchoSelectorMeses] = useState(0);
  const paddingSelectorMeses = Math.max(
    ESPACIADO.minimo,
    (anchoSelectorMeses - ANCHO_BOTON_MES) / 2,
  );
  const movimientos = (Array.isArray(ruta.params?.movimientos) ? ruta.params.movimientos : [])
    .filter((movimiento) => {
      const fecha = new Date(movimiento.fecha_hora);
      return movimiento.categoria === categoria.id
        && movimiento.tipo === tipoMovimiento
        && !movimiento.anulado
        && fecha.getFullYear() === anio
        && fecha.getMonth() === mesSeleccionado;
    })
    .sort((primero, segundo) => segundo.fecha_hora.localeCompare(primero.fecha_hora));
  const gruposMovimientos = agruparMovimientosPorDia(movimientos);
  const montoCategoria = movimientos.reduce((suma, movimiento) => suma + movimiento.monto, 0);

  const centrarMes = (mes, animado = true) => {
    selectorMeses.current?.scrollTo({
      animated: animado,
      x: mes * DISTANCIA_MESES,
    });
  };

  const abrirDetalleMovimiento = (movimiento) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, {
      categoria,
      movimiento,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          alVolver={() => navegacion.goBack()}
          descripcion="Revisá los movimientos y el total de esta categoría."
          tema={tema}
          titulo="Detalle de categoría"
        />

        <ScrollView contentContainerStyle={estilos.contenidoCategoria} showsVerticalScrollIndicator={false}>
          <View style={estilos.encabezadoCategoria}>
            <View style={[estilos.iconoCategoriaGrande, { backgroundColor: tema.superficie, borderColor: categoria.color }]}>
              <Ionicons color={categoria.color} name={categoria.icono} size={48} />
            </View>
            <Text style={estilos.nombreCategoriaResumen}>{categoria.nombre}</Text>
            <Text style={estilos.anioCategoria}>{anio}</Text>
          </View>

          <ScrollView
            ref={selectorMeses}
            contentContainerStyle={[
              estilos.contenedorMeses,
              { paddingHorizontal: paddingSelectorMeses },
            ]}
            horizontal
            onLayout={(evento) => {
              establecerAnchoSelectorMeses(evento.nativeEvent.layout.width);
              requestAnimationFrame(() => centrarMes(mesSeleccionado, false));
            }}
            showsHorizontalScrollIndicator={false}
            style={estilos.selectorMeses}
          >
            {MESES.map((mes) => (
              <Pressable
                accessibilityLabel={`${mes.nombre} ${anio}`}
                accessibilityRole="button"
                accessibilityState={{ selected: mesSeleccionado === mes.id }}
                key={mes.id}
                onPress={() => {
                  establecerMesSeleccionado(mes.id);
                  centrarMes(mes.id);
                }}
                style={[estilos.botonMes, mesSeleccionado === mes.id && estilos.botonMesActivo]}
              >
                <Text style={[estilos.etiquetaMes, mesSeleccionado === mes.id && estilos.etiquetaMesActiva]}>
                  {mes.corto}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={estilos.resumenCategoria}>
            <Text style={estilos.etiquetaMontoCategoria}>{MESES[mesSeleccionado].nombre}</Text>
            <Text accessibilityLiveRegion="polite" style={estilos.montoCategoria}>
              {formatearMonto(montoCategoria, tipoMovimiento)}
            </Text>
          </View>
          <View style={[estilos.separadorCategoria, { backgroundColor: categoria.color }]} />

          <View style={estilos.listaMovimientosCategoria}>
            {gruposMovimientos.length ? gruposMovimientos.map((grupo) => (
              <View key={grupo.clave} style={estilos.grupoDia}>
                <Text accessibilityRole="header" style={estilos.tituloDia}>
                  {formatearFechaDia(grupo.fecha)}
                </Text>
                <View style={estilos.movimientosDia}>
                  {grupo.movimientos.map((movimiento) => (
                    <Pressable
                      accessibilityLabel={`Ver ${movimiento.descripcion}, ${obtenerNombreDeposito(movimiento.deposito_id)}, ${formatearHora(movimiento.fecha_hora)}`}
                      accessibilityRole="button"
                      key={movimiento.id}
                      onPress={() => abrirDetalleMovimiento(movimiento)}
                      style={estilos.filaMovimiento}
                    >
                      <View style={[estilos.iconoMovimiento, { backgroundColor: tema.superficie }]}>
                        <Ionicons color={categoria.color} name={categoria.icono} size={21} />
                      </View>
                      <View style={estilos.detalleFilaMovimiento}>
                        <Text numberOfLines={1} style={estilos.nombreFilaMovimiento}>{movimiento.descripcion}</Text>
                        <Text numberOfLines={1} style={estilos.subtituloFilaMovimiento}>
                          {obtenerNombreDeposito(movimiento.deposito_id)} · {formatearHora(movimiento.fecha_hora)}
                        </Text>
                      </View>
                      <Text style={estilos.montoFilaMovimiento}>
                        {formatearMonto(movimiento.monto, tipoMovimiento)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )) : (
              <Text style={estilos.textoSinMovimientos}>No hay movimientos de esta categoría en el período.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
