import { useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { ErrorBaseDatos } from '../database/errors';
import { ErrorMovimiento, consultarDetalleHistorialMovimiento } from '../movements/movementService';
import { obtenerColoresGraficos } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleMovimiento } from '../styles/MovementDetailScreenStyles';

function formatearMonto(monto: number|null|undefined, tipo: string|undefined) {
  const importe = Number(monto);
  if (monto === null || monto === undefined || !Number.isFinite(importe)) return '—';
  const valor = `$ ${Math.abs(importe).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

  if (tipo === 'ingreso' || tipo === 'transferencia_entrada') return `+ ${valor}`;
  return `− ${valor}`;
}

function formatearFechaHora(fechaISO: string|number|Date|undefined) {
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

function obtenerNombreTipo(tipo: string|undefined) {
  if (tipo === 'ingreso') return 'Ingreso';
  if (tipo === 'egreso') return 'Egreso';
  if (tipo === 'transferencia_entrada') return 'Transferencia recibida';
  if (tipo === 'transferencia_salida') return 'Transferencia enviada';
  return '—';
}

export default function PantallaDetalleMovimiento({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleMovimiento(tema);
  const movimientoId = ruta.params?.movimientoId;
  const [movimientoHistorial, establecerMovimientoHistorial] = useState<import('../database/types').MovimientoHistorial | null>(null);
  const [cargandoHistorial, establecerCargandoHistorial] = useState(Boolean(movimientoId));
  const [errorHistorial, establecerErrorHistorial] = useState<string | null>(null);
  const [intentoConsulta, establecerIntentoConsulta] = useState(0);

  useEffect(() => {
    if (!movimientoId) return undefined;
    let vigente = true;
    establecerCargandoHistorial(true);
    establecerErrorHistorial(null);

    consultarDetalleHistorialMovimiento(movimientoId)
      .then((resultado) => {
        if (vigente) establecerMovimientoHistorial(resultado);
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        const mensaje = error instanceof ErrorBaseDatos || error instanceof ErrorMovimiento
          ? error.message
          : 'No se pudo consultar el detalle del movimiento. Intentá nuevamente.';
        establecerErrorHistorial(mensaje);
      })
      .finally(() => {
        if (vigente) establecerCargandoHistorial(false);
      });

    return () => {
      vigente = false;
    };
  }, [intentoConsulta, movimientoId]);

  const movimiento: Partial<import('../types/forms').MovimientoVisible> & {recurrente?:boolean|number;frecuencia?:string|null} = movimientoId
    ? (movimientoHistorial || {})
    : (ruta.params?.movimiento || {});
  const categoriaRecibida = ruta.params?.categoria || {};
  const catalogo = movimiento.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoriaCatalogo = catalogo.find((item) => item.id === movimiento.categoria);
  const indiceCategoria = catalogo.findIndex((item) => item.id === movimiento.categoria);
  const coloresGraficos = obtenerColoresGraficos(tema);
  const categoria = {
    ...(categoriaCatalogo || {}),
    ...categoriaRecibida,
    color: indiceCategoria >= 0
      ? coloresGraficos[indiceCategoria % coloresGraficos.length]
      : categoriaRecibida.color || tema.foco,
  };
  const deposito = movimiento.deposito_nombre
    ? { nombre: movimiento.deposito_nombre }
    : ruta.params?.deposito_nombre
    ? { nombre: ruta.params.deposito_nombre }
    : DEPOSITOS_SIMULADOS.find((item) => item.id === movimiento.deposito_id);
  const esAnulado = Boolean(movimiento.anulado);
  const esRecurrente = Boolean(movimiento.recurrente);
  const nombresFrecuencia = Object.freeze({ diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', anual: 'Anual' });
  const datosMovimiento = [
    { etiqueta: 'Tipo', valor: obtenerNombreTipo(movimiento.tipo) },
    { etiqueta: 'Categoría', valor: categoria.nombre || movimiento.categoria || '—' },
    { etiqueta: 'Fecha y hora', valor: formatearFechaHora(movimiento.fecha_hora) },
    { etiqueta: 'Depósito', valor: deposito?.nombre || '—' },
    ...(esRecurrente ? [{ etiqueta: 'Recurrente', valor: `Sí · ${nombresFrecuencia[movimiento.frecuencia as keyof typeof nombresFrecuencia] || 'Mensual'}` }] : []),
    { etiqueta: 'Estado', valor: esAnulado ? 'Anulado' : 'Vigente' },
  ];

  if (movimientoId && cargandoHistorial) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
        <View style={estilosGlobales.pantalla}>
          <EncabezadoSeccion
            alVolver={() => navegacion.goBack()}
            descripcion="Consultá la descripción, el depósito, la fecha y el importe."
            tema={tema}
            titulo="Detalle de movimiento"
          />
          <View style={estilos.estadoHistorial}>
            <ActivityIndicator color={tema.foco} size="large" />
            <Text style={estilos.textoEstadoHistorial}>Cargando el movimiento…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (movimientoId && (errorHistorial || !movimientoHistorial)) {
    const noEncontrado = !errorHistorial && !movimientoHistorial;
    return (
      <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
        <View style={estilosGlobales.pantalla}>
          <EncabezadoSeccion
            alVolver={() => navegacion.goBack()}
            descripcion="Consultá la descripción, el depósito, la fecha y el importe."
            tema={tema}
            titulo="Detalle de movimiento"
          />
          <View style={estilos.estadoHistorial}>
            <Ionicons
              color={noEncontrado ? tema.textoSecundario : tema.error}
              name={noEncontrado ? 'search-outline' : 'alert-circle-outline'}
              size={36}
            />
            <Text style={estilos.textoEstadoHistorial}>
              {noEncontrado
                ? 'No se encontró este movimiento. Puede que ya no esté disponible.'
                : errorHistorial}
            </Text>
            {!noEncontrado ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerIntentoConsulta((intento) => intento + 1)}
                style={estilos.botonEstadoHistorial}
              >
                <Text style={estilos.textoBotonEstadoHistorial}>Reintentar</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => navegacion.goBack()}
              style={estilos.botonEstadoHistorial}
            >
              <Text style={estilos.textoBotonEstadoHistorial}>Volver</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          alVolver={() => navegacion.goBack()}
          descripcion="Consultá la descripción, el depósito, la fecha y el importe."
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
