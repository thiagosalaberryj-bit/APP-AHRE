import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleMovimiento } from '../styles/MovementDetailScreenStyles';

function formatearMonto(monto, tipo) {
  if (typeof monto !== 'number') return '—';
  const valor = `$ ${Math.round(monto).toLocaleString('es-AR')}`;

  if (tipo === 'ingreso' || tipo === 'transferencia_entrada') return `+ ${valor}`;
  return `− ${valor}`;
}

function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '—';
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';

  return fecha.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obtenerNombreTipo(tipo) {
  if (tipo === 'ingreso') return 'Ingreso';
  if (tipo === 'egreso') return 'Egreso';
  if (tipo === 'transferencia_entrada') return 'Transferencia recibida';
  if (tipo === 'transferencia_salida') return 'Transferencia enviada';
  return '—';
}

export default function PantallaDetalleMovimiento({ navigation: navegacion, route: ruta }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleMovimiento(tema);
  const movimiento = ruta.params?.movimiento || {};
  const categoriaRecibida = ruta.params?.categoria || {};
  const catalogo = movimiento.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoriaCatalogo = catalogo.find((item) => item.id === movimiento.categoria);
  const categoria = {
    ...(categoriaCatalogo || {}),
    ...categoriaRecibida,
  };
  const deposito = DEPOSITOS_SIMULADOS.find((item) => item.id === movimiento.deposito_id);
  const esAnulado = Boolean(movimiento.anulado);
  const esRecurrente = Boolean(movimiento.recurrente);
  const nombresFrecuencia = Object.freeze({ diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', anual: 'Anual' });
  const datosMovimiento = [
    { etiqueta: 'Tipo', valor: obtenerNombreTipo(movimiento.tipo) },
    { etiqueta: 'Categoría', valor: categoria.nombre || movimiento.categoria || '—' },
    { etiqueta: 'Fecha y hora', valor: formatearFechaHora(movimiento.fecha_hora) },
    { etiqueta: 'Depósito', valor: deposito?.nombre || '—' },
    ...(esRecurrente ? [{ etiqueta: 'Recurrente', valor: `Sí · ${nombresFrecuencia[movimiento.frecuencia] || 'Mensual'}` }] : []),
    { etiqueta: 'Estado', valor: esAnulado ? 'Anulado' : 'Vigente' },
  ];

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          alVolver={() => navegacion.goBack()}
          descripcion="Consultá el depósito, la fecha y el importe."
          tema={tema}
          titulo="Detalle de movimiento"
        />

        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <View style={estilos.encabezado}>
            <View style={[estilos.iconoCategoria, { backgroundColor: tema.superficie, borderColor: categoria.color || tema.borde }]}>
              <Ionicons color={categoria.color || tema.foco} name={categoria.icono || 'swap-horizontal-outline'} size={48} />
            </View>
            <Text style={estilos.etiquetaDescripcion}>Descripción</Text>
            <Text style={estilos.nombreMovimiento}>{movimiento.descripcion || 'Movimiento'}</Text>
            <Text style={estilos.nombreCategoria}>{categoria.nombre || movimiento.categoria || 'Sin categoría'}</Text>
            <Text style={estilos.montoMovimiento}>{formatearMonto(movimiento.monto, movimiento.tipo)}</Text>
          </View>

          <View style={estilos.tarjetaDatos}>
            {datosMovimiento.map((dato) => (
              <View key={dato.etiqueta} style={estilos.dato}>
                <Text style={estilos.etiquetaDato}>{dato.etiqueta}</Text>
                <Text style={estilos.valorDato}>{dato.valor}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
