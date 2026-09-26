import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import EncabezadoPrincipal from '../components/MainHeader';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  DEPOSITOS_SIMULADOS,
} from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { COLORES_GRAFICOS, TEMAS } from '../styles/colors';
import { crearEstilosGlobales, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';

const PERIODOS_RESUMEN = Object.freeze([
  { id: 'dia', nombre: 'Día' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'mes', nombre: 'Mes' },
  { id: 'anio', nombre: 'Año' },
]);

const MODOS_COLUMNAS = Object.freeze([
  { id: 'semana', nombre: 'Semana' },
  { id: 'anio', nombre: 'Año' },
]);

const DIAS_SEMANA = Object.freeze(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
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
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES = Object.freeze(Array.from({ length: 6 }, (_, indice) => ANIO_ACTUAL - indice));

function normalizarFecha(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function obtenerInicioSemana(fecha) {
  const inicio = normalizarFecha(fecha);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

function formatearFecha(fecha, opciones) {
  return fecha.toLocaleDateString('es-AR', opciones);
}

function formatearRangoSemana(fecha) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const mesInicio = MESES[inicio.getMonth()].nombre.toLowerCase();
  const mesFin = MESES[fin.getMonth()].nombre.toLowerCase();
  const anioInicio = inicio.getFullYear();
  const anioFin = fin.getFullYear();

  if (inicio.getMonth() === fin.getMonth() && anioInicio === anioFin) {
    return `${inicio.getDate()}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  if (anioInicio === anioFin) {
    return `${inicio.getDate()} de ${mesInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  return `${inicio.getDate()} de ${mesInicio} ${anioInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
}

function formatearDiaSeleccionado(fecha) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);
  const fechaVisible = formatearFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fechaVisible}`
    : fechaVisible;
}

function formatearDiaSelector(fecha) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fecha.getFullYear()}`
    : `${fecha.getDate()} ${MESES[fecha.getMonth()].corto.toLowerCase()} ${fecha.getFullYear()}`;
}

function formatearSemanaSelector(fecha) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);

  if (inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  if (inicio.getFullYear() === fin.getFullYear()) {
    return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()} ${inicio.getFullYear()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
}

function obtenerCategorias(tipoMovimiento) {
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  return catalogo.map((categoria, indice) => ({
    ...categoria,
    indiceCategoria: indice,
    color: COLORES_GRAFICOS[indice % COLORES_GRAFICOS.length],
  }));
}

function formatearMonto(monto) {
  const texto = String(Math.round(monto)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${texto}`;
}

function crearRutaSector(inicio, fin, radio = 140) {
  const centro = 180;
  const punto = (angulo) => ({
    x: centro + radio * Math.cos((angulo * Math.PI) / 180),
    y: centro + radio * Math.sin((angulo * Math.PI) / 180),
  });
  const primero = punto(inicio);
  const segundo = punto(fin);
  const arcoGrande = fin - inicio > 180 ? 1 : 0;

  return `M ${centro} ${centro} L ${primero.x} ${primero.y} A ${radio} ${radio} 0 ${arcoGrande} 1 ${segundo.x} ${segundo.y} Z`;
}

function crearMovimientosMuestra(catalogo, tipo, anio) {
  const movimientos = [];

  catalogo.forEach((categoria, indiceCategoria) => {
    MESES.forEach((mes) => {
      const cantidadDias = new Date(anio, mes.id + 1, 0).getDate();

      for (let dia = 1; dia <= cantidadDias; dia += 1) {
        const fecha = new Date(
          anio,
          mes.id,
          dia,
          8 + ((indiceCategoria + dia) % 12),
          (indiceCategoria * 7 + dia * 11) % 60,
        );
        const fechaISO = fecha.toISOString();
        const montoBase = tipo === 'ingreso' ? 5000 : 700;
        const variacion = (indiceCategoria * 2311) + (mes.id * 1777) + (dia * 421);

        movimientos.push({
          id: `muestra-${tipo}-${anio}-${mes.id + 1}-${dia}-${categoria.id}`,
          deposito_id: DEPOSITOS_SIMULADOS[(indiceCategoria + mes.id + dia) % DEPOSITOS_SIMULADOS.length].id,
          categoria: categoria.id,
          recurrencia_id: null,
          transferencia_id: null,
          tipo,
          monto: montoBase + (variacion % (tipo === 'ingreso' ? 26000 : 11500)),
          descripcion: `${categoria.nombre} · Movimiento de muestra`,
          fecha_hora: fechaISO,
          anulado: 0,
          fecha_creacion: fechaISO,
          fecha_actualizacion: fechaISO,
        });
      }
    });
  });

  return movimientos;
}

function crearMovimientosSemanaMuestra(catalogo, tipo, fecha) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const anios = new Set([inicio.getFullYear(), fin.getFullYear()]);

  return [...anios].flatMap((anio) => crearMovimientosMuestra(catalogo, tipo, anio));
}

function obtenerRangoPeriodo(periodo, fechaDia, fechaSemana, mes, anio) {
  if (periodo === 'dia') {
    const inicio = normalizarFecha(fechaDia);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }
  if (periodo === 'semana') {
    const inicio = obtenerInicioSemana(fechaSemana);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return { inicio, fin };
  }
  if (periodo === 'mes') {
    return { inicio: new Date(anio, mes, 1), fin: new Date(anio, mes + 1, 1) };
  }
  return { inicio: new Date(anio, 0, 1), fin: new Date(anio + 1, 0, 1) };
}

function sumarMovimientosPorCategoria(categorias, movimientos, inicio, fin) {
  const idsCategorias = new Set(categorias.map((categoria) => categoria.id));
  const montos = new Map(categorias.map((categoria) => [categoria.id, 0]));

  movimientos.forEach((movimiento) => {
    if (movimiento.anulado || !idsCategorias.has(movimiento.categoria)) return;
    const fechaMovimiento = new Date(movimiento.fecha_hora);
    if (fechaMovimiento < inicio || fechaMovimiento >= fin) return;
    montos.set(movimiento.categoria, montos.get(movimiento.categoria) + movimiento.monto);
  });

  return categorias.map((categoria) => ({ ...categoria, monto: montos.get(categoria.id) || 0 }));
}

function crearDatosResumen(categorias, periodo, movimientos, fechaDia, fechaSemana, mes, anio) {
  const rango = obtenerRangoPeriodo(periodo, fechaDia, fechaSemana, mes, anio);
  return sumarMovimientosPorCategoria(categorias, movimientos, rango.inicio, rango.fin);
}

function crearDatosColumnas(categorias, modo, movimientos, fechaSemana, anio) {
  const periodos = modo === 'semana'
    ? DIAS_SEMANA.map((etiqueta, indice) => {
      const inicio = obtenerInicioSemana(fechaSemana);
      inicio.setDate(inicio.getDate() + indice);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 1);
      return { id: `dia-${indice}`, etiqueta, inicio, fin };
    })
    : MESES.map((mes) => ({
      id: `mes-${mes.id}`,
      etiqueta: mes.corto,
      inicio: new Date(anio, mes.id, 1),
      fin: new Date(anio, mes.id + 1, 1),
    }));

  return periodos.map((periodo) => ({
    id: periodo.id,
    etiqueta: periodo.etiqueta,
    segmentos: sumarMovimientosPorCategoria(
      categorias,
      movimientos,
      periodo.inicio,
      periodo.fin,
    ),
  }));
}

function ModalSelector({
  visible,
  titulo,
  opciones,
  valorSeleccionado,
  tema,
  estilos,
  alCerrar,
  alSeleccionar,
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={alCerrar}
      transparent
      visible={visible}
    >
      <View style={estilos.fondoModal}>
        <Pressable
          accessibilityLabel="Cerrar selector"
          onPress={alCerrar}
          style={estilos.fondoTocable}
        />
        <View style={[estilos.tarjetaModal, { backgroundColor: tema.superficie }]}>
          <View style={estilos.encabezadoModal}>
            <Text style={[estilos.tituloModal, { color: tema.textoPrincipal }]}>{titulo}</Text>
            <Pressable
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
              onPress={alCerrar}
              style={estilos.botonCerrarModal}
            >
              <Ionicons color={tema.textoPrincipal} name="close" size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={estilos.opcionesModal} showsVerticalScrollIndicator={false}>
            {opciones.map((opcion) => {
              const seleccionada = opcion.id === valorSeleccionado;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionada }}
                  key={opcion.id}
                  onPress={() => alSeleccionar(opcion.id)}
                  style={[
                    estilos.opcionModal,
                    { borderColor: seleccionada ? tema.foco : tema.borde },
                    seleccionada && { backgroundColor: tema.nombre === 'oscuro' ? '#1B443C' : '#EDF5E8' },
                  ]}
                >
                  <Text style={[estilos.textoOpcionModal, { color: tema.textoPrincipal }]}>
                    {opcion.nombre}
                  </Text>
                  <Ionicons
                    color={seleccionada ? tema.foco : tema.borde}
                    name={seleccionada ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalCalendario({ visible, fecha, tema, estilos, alCerrar, alSeleccionar }) {
  const [mesVisible, establecerMesVisible] = useState(
    () => new Date(fecha.getFullYear(), fecha.getMonth(), 1),
  );
  const primerDia = (new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay() + 6) % 7;
  const cantidadDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
  const diasCalendario = Array.from({ length: 42 }, (_, indice) => {
    const dia = indice - primerDia + 1;
    return dia > 0 && dia <= cantidadDias ? dia : null;
  });

  useEffect(() => {
    if (visible) establecerMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
  }, [fecha, visible]);

  const cambiarMes = (desplazamiento) => {
    establecerMesVisible((mesActual) => new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + desplazamiento,
      1,
    ));
  };

  return (
    <Modal animationType="fade" onRequestClose={alCerrar} transparent visible={visible}>
      <View style={estilos.fondoModal}>
        <Pressable accessibilityLabel="Cerrar calendario" onPress={alCerrar} style={estilos.fondoTocable} />
        <View style={[estilos.tarjetaModal, { backgroundColor: tema.superficie }]}>
          <View style={estilos.encabezadoModal}>
            <Text style={[estilos.tituloModal, { color: tema.textoPrincipal }]}>Elegí una fecha</Text>
            <Pressable accessibilityLabel="Cerrar calendario" accessibilityRole="button" onPress={alCerrar} style={estilos.botonCerrarModal}>
              <Ionicons color={tema.textoPrincipal} name="close" size={22} />
            </Pressable>
          </View>
          <View style={estilos.encabezadoCalendario}>
            <Pressable accessibilityLabel="Mes anterior" accessibilityRole="button" onPress={() => cambiarMes(-1)} style={estilos.botonMesCalendario}>
              <Ionicons color={tema.textoPrincipal} name="chevron-back" size={20} />
            </Pressable>
            <Text style={[estilos.mesCalendario, { color: tema.textoPrincipal }]}>
              {MESES[mesVisible.getMonth()].nombre} {mesVisible.getFullYear()}
            </Text>
            <Pressable accessibilityLabel="Mes siguiente" accessibilityRole="button" onPress={() => cambiarMes(1)} style={estilos.botonMesCalendario}>
              <Ionicons color={tema.textoPrincipal} name="chevron-forward" size={20} />
            </Pressable>
          </View>
          <View style={estilos.cuadriculaCalendario}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia, indice) => (
              <Text key={`${dia}-${indice}`} style={[estilos.nombreDiaCalendario, { color: tema.textoSecundario }]}>
                {dia}
              </Text>
            ))}
            {diasCalendario.map((dia, indice) => {
              if (!dia) return <View key={`vacio-${indice}`} style={estilos.celdaCalendario} />;

              const fechaDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia);
              const seleccionada = fechaDia.getTime() === normalizarFecha(fecha).getTime();
              const esHoy = fechaDia.getTime() === normalizarFecha(new Date()).getTime();
              return (
                <View key={dia} style={estilos.celdaCalendario}>
                  <Pressable
                    accessibilityLabel={formatearFecha(fechaDia, { day: 'numeric', month: 'long', year: 'numeric' })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionada }}
                    onPress={() => alSeleccionar(fechaDia)}
                    style={[
                      estilos.diaCalendario,
                      esHoy && estilos.diaCalendarioHoy,
                      seleccionada && estilos.diaCalendarioSeleccionado,
                    ]}
                  >
                    <Text style={[
                      estilos.textoDiaCalendario,
                      { color: tema.textoPrincipal },
                      seleccionada && { color: tema.nombre === 'oscuro' ? tema.encabezado : tema.encabezadoTexto },
                      seleccionada && estilos.textoDiaCalendarioSeleccionado,
                    ]}>
                      {dia}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => alSeleccionar(normalizarFecha(new Date()))}
            style={estilos.botonHoyCalendario}
          >
            <Text style={[estilos.textoBotonHoyCalendario, { color: tema.foco }]}>Ir a hoy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ModalCategorias({
  visible,
  categorias,
  categoriasSeleccionadas,
  tema,
  estilos,
  alCerrar,
  alAlternar,
  alSeleccionarTodas,
  alLimpiar,
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={alCerrar}
      transparent
      visible={visible}
    >
      <View style={estilos.fondoModal}>
        <Pressable
          accessibilityLabel="Cerrar filtro de categorías"
          onPress={alCerrar}
          style={estilos.fondoTocable}
        />
        <View style={[estilos.tarjetaModal, { backgroundColor: tema.superficie }]}>
          <View style={estilos.encabezadoModal}>
            <Text style={[estilos.tituloModal, { color: tema.textoPrincipal }]}>Filtrar categorías</Text>
            <Pressable
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
              onPress={alCerrar}
              style={estilos.botonCerrarModal}
            >
              <Ionicons color={tema.textoPrincipal} name="close" size={22} />
            </Pressable>
          </View>
          <View style={estilos.accionesCategorias}>
            <Pressable accessibilityRole="button" onPress={alSeleccionarTodas}>
              <Text style={[estilos.textoAccionCategorias, { color: tema.foco }]}>Todas</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={alLimpiar}>
              <Text style={[estilos.textoAccionCategorias, { color: tema.foco }]}>Limpiar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={estilos.opcionesModal} showsVerticalScrollIndicator={false}>
            {categorias.map((categoria) => {
              const seleccionada = categoriasSeleccionadas.includes(categoria.id);

              return (
                <Pressable
                  accessibilityLabel={categoria.nombre}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: seleccionada }}
                  key={categoria.id}
                  onPress={() => alAlternar(categoria.id)}
                  style={[estilos.opcionCategoria, { borderColor: tema.borde }]}
                >
                  <Ionicons color={categoria.color} name={categoria.icono} size={22} />
                  <Text numberOfLines={1} style={[estilos.textoOpcionModal, { color: tema.textoPrincipal }]}>
                    {categoria.nombre}
                  </Text>
                  <Ionicons
                    color={seleccionada ? tema.foco : tema.borde}
                    name={seleccionada ? 'checkbox' : 'square-outline'}
                    size={22}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function GraficoCircular({ categorias, tamano, tema, seleccionadaId, alSeleccionar }) {
  const total = categorias.reduce((suma, categoria) => suma + categoria.monto, 0);
  let angulo = -90;
  const sectores = categorias.map((categoria) => {
    const amplitud = total ? (categoria.monto / total) * 360 : 0;
    const sector = {
      ...categoria,
      ruta: crearRutaSector(angulo, angulo + amplitud),
    };
    angulo += amplitud;
    return sector;
  });
  const sectoresDibujados = [
    ...sectores.filter((sector) => sector.id !== seleccionadaId),
    ...sectores.filter((sector) => sector.id === seleccionadaId),
  ];

  return (
    <View style={[estilosGraficoCircular.contenedor, { height: tamano, width: tamano }]}>
      <Svg height={tamano} width={tamano} viewBox="0 0 360 360">
        {sectores.length === 1 ? (
          <Circle
            accessibilityLabel={`${sectores[0].nombre}, ${formatearMonto(sectores[0].monto)}`}
            accessibilityRole="button"
            cx={180}
            cy={180}
            fill={sectores[0].color}
            onPress={() => alSeleccionar(sectores[0].id)}
            r={140}
            stroke={seleccionadaId === sectores[0].id ? tema.foco : tema.superficie}
            strokeWidth={seleccionadaId === sectores[0].id ? 4 : 2}
          />
        ) : sectoresDibujados.map((sector) => (
          <Path
            accessibilityLabel={`${sector.nombre}, ${Math.round((sector.monto / (total || 1)) * 100)}%`}
            accessibilityRole="button"
            d={sector.ruta}
            fill={sector.color}
            key={sector.id}
            onPress={() => alSeleccionar(sector.id)}
            stroke={seleccionadaId === sector.id ? tema.foco : tema.superficie}
            strokeLinejoin="round"
            strokeWidth={seleccionadaId === sector.id ? 4 : 2}
          />
        ))}
        <Circle cx={180} cy={180} fill={tema.superficie} r={70} />
      </Svg>
      <View pointerEvents="none" style={estilosGraficoCircular.centro}>
        <Text style={[estilosGraficoCircular.etiquetaCentro, { color: tema.textoSecundario }]}>Total</Text>
        <Text numberOfLines={1} style={[estilosGraficoCircular.totalCentro, { color: tema.textoPrincipal }]}>
          {formatearMonto(total)}
        </Text>
      </View>
    </View>
  );
}

const estilosGraficoCircular = {
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centro: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  etiquetaCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.auxiliar,
  },
  totalCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.secundario,
    fontWeight: TIPOGRAFIA.pesos.negrita,
    maxWidth: 128,
  },
};

function GraficoColumnas({
  barras,
  tema,
  estilos,
  tamano,
  graficoActivo,
  indiceSeleccionado,
  alSeleccionar,
  alIniciarSeleccion,
  alFinalizarSeleccion,
}) {
  const referenciaGrafico = useRef(null);
  const medidasGrafico = useRef({ x: 0, ancho: 0 });
  const inicioToqueX = useRef(null);
  const arrastreIniciado = useRef(false);
  const montoMaximo = Math.max(0, ...barras.map((barra) => (
    barra.segmentos.reduce((suma, segmento) => suma + segmento.monto, 0)
  )));
  const altoContenedor = Math.max(288, tamano + (ESPACIADO.pequeno * 2));
  const altoMaximoBarra = altoContenedor - ESPACIADO.grande - ESPACIADO.minimo - 20;

  const medirGrafico = useCallback(() => {
    referenciaGrafico.current?.measureInWindow((x, y, ancho) => {
      medidasGrafico.current = { x, ancho };
    });
  }, []);

  useEffect(() => {
    if (!graficoActivo) return undefined;

    const marco = requestAnimationFrame(medirGrafico);
    return () => cancelAnimationFrame(marco);
  }, [graficoActivo, medirGrafico]);

  const seleccionarDesdeToque = (evento) => {
    const { pageX } = evento.nativeEvent;
    const { x, ancho } = medidasGrafico.current;
    if (!ancho || !barras.length) return;
    const indice = Math.min(
      barras.length - 1,
      Math.max(0, Math.floor(((pageX - x) / ancho) * barras.length)),
    );
    alSeleccionar(indice);
  };

  const actualizarSeleccionDuranteArrastre = (evento) => {
    const { pageX } = evento.nativeEvent;
    if (!arrastreIniciado.current) {
      if (Math.abs(pageX - inicioToqueX.current) < 8) return;
      arrastreIniciado.current = true;
    }

    seleccionarDesdeToque(evento);
  };

  const terminarSeleccion = () => {
    alFinalizarSeleccion();
  };

  return (
    <View
      ref={referenciaGrafico}
      onLayout={(evento) => {
        medidasGrafico.current.ancho = evento.nativeEvent.layout.width;
        medirGrafico();
      }}
      onTouchCancel={terminarSeleccion}
      onTouchEnd={terminarSeleccion}
      onTouchMove={actualizarSeleccionDuranteArrastre}
      onTouchStart={(evento) => {
        alIniciarSeleccion();
        medirGrafico();
        inicioToqueX.current = evento.nativeEvent.pageX;
        arrastreIniciado.current = false;
      }}
      style={[estilos.contenedorColumnas, { height: altoContenedor }]}
    >
      {barras.map((barra, indice) => {
        const total = barra.segmentos.reduce((suma, segmento) => suma + segmento.monto, 0);
        const altura = montoMaximo ? Math.max(2, (total / montoMaximo) * altoMaximoBarra) : 2;

        return (
          <Pressable
            accessibilityLabel={`${barra.etiqueta}, ${formatearMonto(total)}`}
            accessibilityRole="button"
            accessibilityState={{ selected: indice === indiceSeleccionado }}
            key={barra.id}
            onPress={() => {
              if (arrastreIniciado.current) {
                arrastreIniciado.current = false;
                return;
              }
              alSeleccionar(indice);
            }}
            style={estilos.columna}
          >
            <View
              style={[
                estilos.barra,
                {
                  height: altura,
                  borderColor: indice === indiceSeleccionado ? tema.foco : 'transparent',
                },
              ]}
            >
              {barra.segmentos.map((segmento) => (
                <View
                  key={`${barra.id}-${segmento.id}`}
                  style={[estilos.segmentoBarra, { backgroundColor: segmento.color, flex: segmento.monto || 0.01 }]}
                />
              ))}
            </View>
            <Text numberOfLines={1} style={estilos.etiquetaColumna}>{barra.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PantallaEstadisticas({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const anchoPantalla = useWindowDimensions().width;
  const tamanoGrafico = Math.min(320, Math.max(248, anchoPantalla - 64));
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosEstadisticas(tema);
  const [anchoSlider, establecerAnchoSlider] = useState(0);
  const [indiceGrafico, establecerIndiceGrafico] = useState(0);
  const [barraEnInteraccion, establecerBarraEnInteraccion] = useState(false);
  const [tipoMovimiento, establecerTipoMovimiento] = useState('egreso');
  const [categoriasSeleccionadas, establecerCategoriasSeleccionadas] = useState(
    CATEGORIAS_EGRESO.map((categoria) => categoria.id),
  );
  const [periodoResumen, establecerPeriodoResumen] = useState('semana');
  const [diaResumen, establecerDiaResumen] = useState(() => normalizarFecha(new Date()));
  const [semanaResumen, establecerSemanaResumen] = useState(() => normalizarFecha(new Date()));
  const [mesResumen, establecerMesResumen] = useState(new Date().getMonth());
  const [anioResumen, establecerAnioResumen] = useState(ANIO_ACTUAL);
  const [modoColumnas, establecerModoColumnas] = useState('semana');
  const [semanaColumnas, establecerSemanaColumnas] = useState(() => normalizarFecha(new Date()));
  const [anioColumnas, establecerAnioColumnas] = useState(ANIO_ACTUAL);
  const [selectorActual, establecerSelectorActual] = useState(null);
  const [selectorFechaActual, establecerSelectorFechaActual] = useState(null);
  const [filtroCategoriasAbierto, establecerFiltroCategoriasAbierto] = useState(false);
  const [categoriaSeleccionada, establecerCategoriaSeleccionada] = useState(null);
  const [indiceColumnaSeleccionada, establecerIndiceColumnaSeleccionada] = useState(0);

  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categorias = useMemo(() => obtenerCategorias(tipoMovimiento), [tipoMovimiento]);
  const categoriasVisibles = useMemo(
    () => categorias.filter((categoria) => categoriasSeleccionadas.includes(categoria.id)),
    [categorias, categoriasSeleccionadas],
  );
  const anioDatosResumen = periodoResumen === 'dia'
    ? diaResumen.getFullYear()
    : periodoResumen === 'semana'
      ? semanaResumen.getFullYear()
      : anioResumen;
  const movimientosResumenMuestra = useMemo(
    () => (periodoResumen === 'semana'
      ? crearMovimientosSemanaMuestra(catalogo, tipoMovimiento, semanaResumen)
      : crearMovimientosMuestra(catalogo, tipoMovimiento, anioDatosResumen)),
    [catalogo, tipoMovimiento, anioDatosResumen, periodoResumen, semanaResumen],
  );
  const datosResumen = useMemo(
    () => crearDatosResumen(
      categoriasVisibles,
      periodoResumen,
      movimientosResumenMuestra,
      diaResumen,
      semanaResumen,
      mesResumen,
      anioResumen,
    ),
    [
      categoriasVisibles,
      periodoResumen,
      movimientosResumenMuestra,
      diaResumen,
      semanaResumen,
      mesResumen,
      anioResumen,
    ],
  );
  const anioDatosColumnas = modoColumnas === 'semana'
    ? semanaColumnas.getFullYear()
    : anioColumnas;
  const movimientosColumnasMuestra = useMemo(
    () => (modoColumnas === 'semana'
      ? crearMovimientosSemanaMuestra(catalogo, tipoMovimiento, semanaColumnas)
      : crearMovimientosMuestra(catalogo, tipoMovimiento, anioDatosColumnas)),
    [catalogo, tipoMovimiento, anioDatosColumnas, modoColumnas, semanaColumnas],
  );
  const datosColumnas = useMemo(
    () => crearDatosColumnas(
      categoriasVisibles,
      modoColumnas,
      movimientosColumnasMuestra,
      semanaColumnas,
      anioColumnas,
    ),
    [categoriasVisibles, modoColumnas, movimientosColumnasMuestra, semanaColumnas, anioColumnas],
  );
  const periodoResumenSeleccionado = PERIODOS_RESUMEN.find((periodo) => periodo.id === periodoResumen);
  const categoriaActiva = datosResumen.find((categoria) => categoria.id === categoriaSeleccionada);
  const barraSeleccionada = datosColumnas[Math.min(indiceColumnaSeleccionada, datosColumnas.length - 1)];
  const totalBarraSeleccionada = barraSeleccionada?.segmentos.reduce((suma, segmento) => suma + segmento.monto, 0) || 0;

  const abrirPantallaRaiz = (ruta, parametros) => {
    const navegadorSuperior = navegacion.getParent();
    const navegadorRaiz = navegadorSuperior?.getParent() || navegadorSuperior;
    navegadorRaiz?.navigate(ruta, parametros);
  };

  const abrirDetalleCategoria = (categoria) => {
    const fechaReferencia = periodoResumen === 'dia'
      ? diaResumen
      : periodoResumen === 'semana'
        ? semanaResumen
        : new Date(anioResumen, mesResumen, 1);
    const anioDetalle = periodoResumen === 'anio' || periodoResumen === 'mes'
      ? anioResumen
      : fechaReferencia.getFullYear();
    const mesDetalle = periodoResumen === 'mes'
      ? mesResumen
      : periodoResumen === 'anio'
        ? (anioResumen === ANIO_ACTUAL ? new Date().getMonth() : 0)
        : fechaReferencia.getMonth();
    const categoriaDetalle = {
      id: categoria.id,
      nombre: categoria.nombre,
      icono: categoria.icono,
      color: categoria.color,
    };
    abrirPantallaRaiz(RUTAS.DETALLE_CATEGORIA, {
      categoria: categoriaDetalle,
      tipoMovimiento,
      anio: anioDetalle,
      mes: mesDetalle,
      movimientos: movimientosResumenMuestra.filter((movimiento) => movimiento.categoria === categoria.id),
    });
  };

  const cambiarTipoMovimiento = (nuevoTipo) => {
    const nuevoCatalogo = nuevoTipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
    establecerTipoMovimiento(nuevoTipo);
    establecerCategoriasSeleccionadas(nuevoCatalogo.map((categoria) => categoria.id));
    establecerCategoriaSeleccionada(null);
    establecerIndiceColumnaSeleccionada(0);
  };

  const alternarCategoria = (categoriaId) => {
    establecerCategoriasSeleccionadas((seleccionadas) => (
      seleccionadas.includes(categoriaId)
        ? seleccionadas.filter((id) => id !== categoriaId)
        : [...seleccionadas, categoriaId]
    ));
  };

  const obtenerOpcionesSelector = () => {
    if (selectorActual === 'periodoResumen') return PERIODOS_RESUMEN;
    if (selectorActual === 'modoColumnas') return MODOS_COLUMNAS;
    if (selectorActual === 'mesResumen') {
      return MESES.map((mes) => ({ id: mes.id, nombre: mes.nombre }));
    }
    if (selectorActual === 'anioResumen' || selectorActual === 'anioColumnas') {
      return ANIOS_DISPONIBLES.map((anio) => ({ id: anio, nombre: String(anio) }));
    }
    return [];
  };

  const obtenerValorSelector = () => {
    if (selectorActual === 'periodoResumen') return periodoResumen;
    if (selectorActual === 'modoColumnas') return modoColumnas;
    if (selectorActual === 'mesResumen') return mesResumen;
    if (selectorActual === 'anioResumen') return anioResumen;
    if (selectorActual === 'anioColumnas') return anioColumnas;
    return null;
  };

  const aplicarOpcionSelector = (valor) => {
    if (selectorActual === 'periodoResumen') establecerPeriodoResumen(valor);
    else if (selectorActual === 'modoColumnas') establecerModoColumnas(valor);
    else if (selectorActual === 'mesResumen') establecerMesResumen(valor);
    else if (selectorActual === 'anioResumen') establecerAnioResumen(valor);
    else if (selectorActual === 'anioColumnas') establecerAnioColumnas(valor);

    establecerSelectorActual(null);
  };

  const obtenerEtiquetaRangoResumen = () => {
    if (periodoResumen === 'dia') return formatearDiaSeleccionado(diaResumen);
    if (periodoResumen === 'semana') return formatearRangoSemana(semanaResumen);
    if (periodoResumen === 'mes') return `${MESES[mesResumen].nombre} ${anioResumen}`;
    return String(anioResumen);
  };

  const obtenerEtiquetaRangoColumnas = () => (
    modoColumnas === 'semana'
      ? formatearRangoSemana(semanaColumnas)
      : String(anioColumnas)
  );

  const obtenerTituloSelector = () => {
    if (selectorActual === 'periodoResumen') return 'Período del resumen';
    if (selectorActual === 'modoColumnas') return 'Período de columnas';
    if (selectorActual === 'mesResumen') return 'Elegir mes';
    return 'Elegir año';
  };

  const opcionesSelector = obtenerOpcionesSelector();
  const fechaCalendario = selectorFechaActual === 'diaResumen'
    ? diaResumen
    : selectorFechaActual === 'semanaResumen'
      ? semanaResumen
      : semanaColumnas;

  const seleccionarFechaCalendario = (fecha) => {
    if (selectorFechaActual === 'diaResumen') establecerDiaResumen(fecha);
    else if (selectorFechaActual === 'semanaResumen') establecerSemanaResumen(fecha);
    else if (selectorFechaActual === 'semanaColumnas') establecerSemanaColumnas(fecha);
    establecerSelectorFechaActual(null);
  };

  const seccionesGrafico = [
    { id: 0, titulo: 'Distribución por categoría' },
    { id: 1, titulo: `${tipoMovimiento === 'ingreso' ? 'Ingresos' : 'Egresos'} por período` },
  ];

  const tituloResumen = obtenerEtiquetaRangoResumen();
  const tituloColumnas = obtenerEtiquetaRangoColumnas();
  const selectoresResumen = [
    { id: 'periodoResumen', texto: periodoResumenSeleccionado?.nombre, etiqueta: periodoResumenSeleccionado?.nombre, calendario: false },
    ...(periodoResumen === 'dia'
      ? [{ id: 'diaResumen', texto: formatearDiaSelector(diaResumen), etiqueta: `Seleccionar día: ${formatearDiaSeleccionado(diaResumen)}`, calendario: true }]
      : periodoResumen === 'semana'
        ? [{ id: 'semanaResumen', texto: formatearSemanaSelector(semanaResumen), etiqueta: `Seleccionar semana: ${tituloResumen}`, calendario: true }]
        : periodoResumen === 'mes'
          ? [
            { id: 'mesResumen', texto: MESES[mesResumen].corto, etiqueta: MESES[mesResumen].nombre, calendario: false },
            { id: 'anioResumen', texto: String(anioResumen), etiqueta: `Año ${anioResumen}`, calendario: false },
          ]
          : [{ id: 'anioResumen', texto: String(anioResumen), etiqueta: `Año ${anioResumen}`, calendario: false }]),
  ];
  const selectoresColumnas = [
    { id: 'modoColumnas', texto: modoColumnas === 'semana' ? 'Semana' : 'Año', etiqueta: modoColumnas === 'semana' ? 'Semana' : 'Año', calendario: false },
    ...(modoColumnas === 'semana'
      ? [{ id: 'semanaColumnas', texto: formatearSemanaSelector(semanaColumnas), etiqueta: `Seleccionar semana: ${tituloColumnas}`, calendario: true }]
      : [{ id: 'anioColumnas', texto: String(anioColumnas), etiqueta: `Año ${anioColumnas}`, calendario: false }]),
  ];
  const selectoresActuales = indiceGrafico === 0 ? selectoresResumen : selectoresColumnas;
  const filasDetalleColumna = barraSeleccionada?.segmentos || [];
  const totalResumen = datosResumen.reduce((suma, categoria) => suma + categoria.monto, 0);

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoPrincipal
          alAbrirNotificaciones={() => abrirPantallaRaiz(RUTAS.NOTIFICACIONES)}
          alAbrirPerfil={() => abrirPantallaRaiz(RUTAS.PERFIL)}
          descripcion="Analiza tus ingresos y gastos."
          tema={tema}
          titulo="Estadísticas"
        />

        <ScrollView
          contentContainerStyle={estilos.contenidoDesplazable}
          showsVerticalScrollIndicator={false}
          style={estilos.desplazamiento}
        >
          <View style={estilos.controles}>
            <View style={estilos.filaTipoMovimiento}>
              {[
                { id: 'egreso', nombre: 'Egresos' },
                { id: 'ingreso', nombre: 'Ingresos' },
              ].map((opcion) => {
                const activa = tipoMovimiento === opcion.id;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    key={opcion.id}
                    onPress={() => cambiarTipoMovimiento(opcion.id)}
                    style={[estilos.botonTipoMovimiento, activa && estilos.botonTipoMovimientoActivo]}
                  >
                    <Text style={[estilos.textoBotonTipo, activa && estilos.textoBotonTipoActivo]}>
                      {opcion.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              contentContainerStyle={estilos.filaSelectores}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={estilos.desplazamientoSelectores}
            >
              {selectoresActuales.map((selector) => (
                <Pressable
                  accessibilityLabel={selector.etiqueta || selector.texto}
                  accessibilityRole="button"
                  key={selector.id}
                  onPress={() => (
                    selector.calendario
                      ? establecerSelectorFechaActual(selector.id)
                      : establecerSelectorActual(selector.id)
                  )}
                  style={estilos.botonSelector}
                >
                  <Text numberOfLines={1} style={estilos.textoSelector}>{selector.texto}</Text>
                  <Ionicons color={tema.textoPrincipal} name={selector.calendario ? 'calendar-outline' : 'chevron-down'} size={16} />
                </Pressable>
              ))}
              <Pressable
                accessibilityLabel={`Filtrar categorías, ${categoriasSeleccionadas.length} seleccionadas`}
                accessibilityRole="button"
                onPress={() => establecerFiltroCategoriasAbierto(true)}
                style={estilos.botonSelectorCategoria}
              >
                <Ionicons color={tema.textoPrincipal} name="options-outline" size={18} />
                <Text numberOfLines={1} style={estilos.textoSelector}>
                  Categorías {categoriasSeleccionadas.length}/{catalogo.length}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <View
            onLayout={(evento) => establecerAnchoSlider(evento.nativeEvent.layout.width)}
            style={estilos.contenedorCarrusel}
          >
            <ScrollView
              contentContainerStyle={estilos.contenidoCarrusel}
              horizontal
              onMomentumScrollEnd={(evento) => {
                const anchoPagina = evento.nativeEvent.layoutMeasurement.width;
                if (!anchoPagina) return;
                establecerIndiceGrafico(Math.min(1, Math.round(evento.nativeEvent.contentOffset.x / anchoPagina)));
              }}
              pagingEnabled
              scrollEnabled={!barraEnInteraccion}
              showsHorizontalScrollIndicator={false}
              style={estilos.carrusel}
            >
              <View style={[estilos.paginaGrafico, { width: anchoSlider || Math.max(0, anchoPantalla - (ESPACIADO.pantalla * 2)) }]}>
                <View style={estilos.cabeceraGrafico}>
                  <Text style={estilos.tituloGrafico}>{seccionesGrafico[0].titulo}</Text>
                  <Text style={estilos.subtituloGrafico}>{tituloResumen}</Text>
                </View>
                <View style={estilos.contenedorGraficoCircular}>
                  {datosResumen.length ? (
                    <GraficoCircular
                      alSeleccionar={establecerCategoriaSeleccionada}
                      categorias={datosResumen}
                      seleccionadaId={categoriaSeleccionada}
                      tamano={tamanoGrafico}
                      tema={tema}
                    />
                  ) : (
                    <Text style={estilos.textoSinCategorias}>Seleccioná categorías para ver el resumen.</Text>
                  )}
                </View>
              </View>
              <View style={[estilos.paginaGrafico, { width: anchoSlider || Math.max(0, anchoPantalla - (ESPACIADO.pantalla * 2)) }]}>
                <View style={estilos.cabeceraGrafico}>
                  <Text style={estilos.tituloGrafico}>{seccionesGrafico[1].titulo}</Text>
                  <Text style={estilos.subtituloGrafico}>{tituloColumnas}</Text>
                </View>
                <GraficoColumnas
                  alFinalizarSeleccion={() => establecerBarraEnInteraccion(false)}
                  alIniciarSeleccion={() => establecerBarraEnInteraccion(true)}
                  alSeleccionar={establecerIndiceColumnaSeleccionada}
                  barras={datosColumnas}
                  estilos={estilos}
                  graficoActivo={indiceGrafico === 1}
                  indiceSeleccionado={indiceColumnaSeleccionada}
                  tamano={tamanoGrafico}
                  tema={tema}
                />
              </View>
            </ScrollView>
            <View
              accessibilityLabel={`Gráfico ${indiceGrafico + 1} de 2`}
              accessible
              accessibilityRole="text"
              style={estilos.indicadoresCarrusel}
            >
              {seccionesGrafico.map((seccion) => (
                <View
                  accessibilityElementsHidden
                  key={seccion.id}
                  style={[estilos.indicadorCarrusel, indiceGrafico === seccion.id && estilos.indicadorCarruselActivo]}
                />
              ))}
            </View>
            {indiceGrafico === 0 ? (
              <>
                <View style={estilos.detalleSeleccion}>
                  {categoriaActiva ? (
                    <>
                      <View style={estilos.filaDetalleSeleccion}>
                        <View style={[estilos.muestraColor, { backgroundColor: categoriaActiva.color }]} />
                        <Text style={estilos.tituloDetalleSeleccion}>{categoriaActiva.nombre}</Text>
                      </View>
                      <Text style={estilos.textoDetalleSeleccion}>
                        {formatearMonto(categoriaActiva.monto)} · {Math.round((categoriaActiva.monto / (totalResumen || 1)) * 100)}%
                      </Text>
                    </>
                  ) : (
                    <Text style={estilos.textoDetalleSeleccion}>Toca un segmento para ver su importe.</Text>
                  )}
                </View>
                <View style={estilos.listaCategorias}>
                  {datosResumen.map((categoria) => {
                    const porcentaje = Math.round((categoria.monto / (totalResumen || 1)) * 100);
                    const activa = categoria.id === categoriaSeleccionada;

                    return (
                      <Pressable
                        accessibilityLabel={`Ver detalle de ${categoria.nombre}, ${formatearMonto(categoria.monto)}, ${porcentaje}%`}
                        accessibilityRole="button"
                        key={categoria.id}
                        onPress={() => abrirDetalleCategoria(categoria)}
                        style={[estilos.filaCategoria, activa && estilos.filaCategoriaActiva]}
                      >
                        <View style={[estilos.muestraColor, { backgroundColor: categoria.color }]} />
                        <Ionicons color={categoria.color} name={categoria.icono} size={20} />
                        <Text numberOfLines={1} style={estilos.nombreCategoria}>{categoria.nombre}</Text>
                        <Text style={estilos.porcentajeCategoria}>{porcentaje}%</Text>
                        <Text style={estilos.montoCategoria}>{formatearMonto(categoria.monto)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={estilos.detalleColumna}>
                {barraSeleccionada ? (
                  <>
                    <View style={estilos.resumenColumna}>
                      <Text style={estilos.tituloDetalleSeleccion}>{barraSeleccionada.etiqueta}</Text>
                      <Text style={estilos.totalColumna}>{formatearMonto(totalBarraSeleccionada)}</Text>
                    </View>
                    {filasDetalleColumna.length ? (
                      <View style={estilos.listaDetalleColumna}>
                        {filasDetalleColumna.map((segmento) => (
                          <View key={segmento.id} style={estilos.filaDetalleColumna}>
                            <View style={[estilos.muestraColor, { backgroundColor: segmento.color }]} />
                            <Text numberOfLines={1} style={estilos.nombreCategoria}>{segmento.nombre}</Text>
                            <Text style={estilos.montoCategoria}>{formatearMonto(segmento.monto)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={estilos.textoDetalleSeleccion}>Seleccioná categorías para ver el detalle.</Text>
                    )}
                  </>
                ) : (
                  <Text style={estilos.textoDetalleSeleccion}>No hay datos para este período.</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <ModalSelector
          alCerrar={() => establecerSelectorActual(null)}
          alSeleccionar={aplicarOpcionSelector}
          estilos={estilos}
          opciones={opcionesSelector}
          tema={tema}
          titulo={obtenerTituloSelector()}
          valorSeleccionado={obtenerValorSelector()}
          visible={Boolean(selectorActual)}
        />
        <ModalCategorias
          alAlternar={alternarCategoria}
          alCerrar={() => establecerFiltroCategoriasAbierto(false)}
          alLimpiar={() => establecerCategoriasSeleccionadas([])}
          alSeleccionarTodas={() => establecerCategoriasSeleccionadas(catalogo.map((categoria) => categoria.id))}
          categorias={categorias}
          categoriasSeleccionadas={categoriasSeleccionadas}
          estilos={estilos}
          tema={tema}
          visible={filtroCategoriasAbierto}
        />
        <ModalCalendario
          alCerrar={() => establecerSelectorFechaActual(null)}
          alSeleccionar={seleccionarFechaCalendario}
          estilos={estilos}
          fecha={fechaCalendario}
          tema={tema}
          visible={Boolean(selectorFechaActual)}
        />
      </View>
    </SafeAreaView>
  );
}
