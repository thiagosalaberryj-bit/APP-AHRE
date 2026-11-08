import {useFocusEffect} from '@react-navigation/native';
import { useCallback,useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { ErrorBaseDatos } from '../database/errors';
import { RUTAS } from '../constants/routes';
import { ErrorMovimiento, consultarDetalleHistorialMovimiento, eliminarMovimiento } from '../movements/movementService';
import { ContextoAvisos } from '../contexts/ToastContext';
import { obtenerColorIconoCategoria, obtenerColorCategoria } from '../styles/categoryColors';
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

  const dia = fecha.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const hora = fecha.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false});
  return dia+' · '+hora;
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
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [confirmandoEliminacion, establecerConfirmandoEliminacion] = useState(false);
  const [eliminando, establecerEliminando] = useState(false);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleMovimiento(tema);
  const movimientoId = ruta.params?.movimientoId || ruta.params?.movimiento?.id;
  const [movimientoHistorial, establecerMovimientoHistorial] = useState<import('../database/types').MovimientoHistorial | null>(null);
  const [cargandoHistorial, establecerCargandoHistorial] = useState(Boolean(movimientoId));
  const [errorHistorial, establecerErrorHistorial] = useState<string | null>(null);
  const [intentoConsulta, establecerIntentoConsulta] = useState(0);
  const [importeVisible, establecerImporteVisible] = useState(false);

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

  useFocusEffect(useCallback(()=>{establecerIntentoConsulta(v=>v+1);},[]));
  const movimiento: Partial<import('../types/forms').MovimientoVisible> & {recurrente?:boolean|number;frecuencia?:string|null} = movimientoId
    ? (movimientoHistorial || {})
    : (ruta.params?.movimiento || {});
  const categoriaRecibida = ruta.params?.categoria || {};
  const esIngreso = movimiento.tipo === 'ingreso' || movimiento.tipo === 'transferencia_entrada';
  const catalogo = esIngreso ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categoriaCatalogo = catalogo.find((item) => item.id === movimiento.categoria);
  const categoria = {
    ...(categoriaCatalogo || {}),
    ...categoriaRecibida,
    color: obtenerColorCategoria(movimiento.categoria || '', tema, esIngreso ? 'ingreso' : 'egreso'),
  };
  const deposito = movimiento.deposito_nombre
    ? { nombre: movimiento.deposito_nombre }
    : ruta.params?.deposito_nombre
    ? { nombre: ruta.params.deposito_nombre }
    : DEPOSITOS_SIMULADOS.find((item) => item.id === movimiento.deposito_id);
  const esAnulado = Boolean(movimiento.anulado||movimiento.fecha_eliminacion);
  const confirmarEliminacion = async (desactivar = false) => {
    if (!movimientoId || eliminando) return;
    establecerEliminando(true);
    try {
      await eliminarMovimiento(movimientoId, desactivar);
      establecerConfirmandoEliminacion(false);
      establecerIntentoConsulta(valor => valor + 1);
      mostrarAviso('Movimiento eliminado. Se conserva en el historial.');
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.', {tipo:'error'}); }
    finally { establecerEliminando(false); }
  };
  const esRecurrente = Boolean(movimiento.recurrente);
  const nombresFrecuencia = Object.freeze({ diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual', anual: 'Anual' });
  const importeFormateado = formatearMonto(movimiento.monto,movimiento.tipo);
  const importeLargo = importeFormateado.length>12;
  const datosMovimiento = [
    { etiqueta: 'Fecha y hora', valor: formatearFechaHora(movimiento.fecha_hora), icono:'calendar-outline' as const },
    { etiqueta: 'Depósito', valor: deposito?.nombre || '—', icono:'wallet-outline' as const },
    ...(esRecurrente ? [{ etiqueta: 'Recurrente', icono:'repeat-outline' as const, valor: `Sí · ${nombresFrecuencia[movimiento.frecuencia as keyof typeof nombresFrecuencia] || 'Mensual'}` }] : []),
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
          <View style={estilos.resumen}>
            <View style={estilos.filaResumen}>
              <View style={estilos.identidad}>
                <View style={[estilos.iconoCategoria,{backgroundColor:(categoria.color || tema.foco)+'24'}]}>
                  <Ionicons color={obtenerColorIconoCategoria(movimiento.categoria || '', tema, esIngreso ? 'ingreso' : 'egreso')} name={categoria.icono || 'swap-horizontal-outline'} size={30}/>
                </View>
                <View style={estilos.textoIdentidad}>
                  <Text style={estilos.nombreCategoria}>{categoria.nombre || movimiento.categoria || 'Sin categoría'}</Text>
                  <Text style={[estilos.tipoMovimiento,{color:esIngreso?tema.exito:tema.error}]}>{obtenerNombreTipo(movimiento.tipo)}</Text>
                </View>
              </View>
              <Pressable style={estilos.resumenImporte} disabled={!importeLargo}
                accessibilityRole={importeLargo?'button':undefined} accessibilityLabel={'Importe: '+importeFormateado}
                accessibilityHint={importeLargo?'Abre el importe completo.':undefined}
                onPress={()=>establecerImporteVisible(true)}>
                <View style={estilos.encabezadoImporte}>
                  <Text style={estilos.etiquetaImporte}>Importe</Text>
                  {importeLargo?<Ionicons name="expand-outline" size={16} color={tema.foco} accessible={false}/>:null}
                </View>
                <Text selectable={!importeLargo} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit={!importeLargo} style={estilos.montoMovimiento}>{importeFormateado}</Text>
              </Pressable>
            </View>
            <View style={estilos.descripcion}>
              <View style={[estilos.filaDescripcion,esAnulado&&{flexDirection:'column',alignItems:'flex-start'}]}>
                <Text style={estilos.etiquetaDato}>Descripción</Text>
                {esAnulado?<View style={estilos.estadoMovimiento}>
                  <Ionicons color={tema.error} name="close-circle-outline" size={14}/>
                  <Text style={[estilos.textoEstadoMovimiento,{color:tema.error}]}>Eliminado · No afecta saldos ni estadísticas</Text>
                </View>:null}
              </View>
              <Text selectable style={estilos.nombreMovimiento}>{movimiento.descripcion || 'Movimiento'}</Text>
            </View>
            <View style={estilos.tarjetaDatos}>
              {datosMovimiento.map((dato,indice)=><View key={dato.etiqueta} style={[estilos.dato,indice>0&&estilos.datoSeparado]}>
                <Ionicons color={tema.foco} name={dato.icono} size={20}/>
                <View style={estilos.detalleDato}>
                  <Text numberOfLines={1} style={estilos.etiquetaDato}>{dato.etiqueta}</Text>
                  <Text selectable numberOfLines={1} adjustsFontSizeToFit style={estilos.valorDato}>{dato.valor}</Text>
                </View>
              </View>)}
            </View>
          </View>
          {movimientoId && !esAnulado && !movimiento.transferencia_id && !movimiento.reversion_de_id ? <View style={estilos.accionesMovimiento}>
            <Pressable accessibilityRole="button" onPress={()=>navegacion.push(movimiento.tipo==='ingreso'?RUTAS.INGRESO:RUTAS.EGRESO,{movimientoId})} style={estilos.botonEstadoHistorial}><Text style={estilos.textoBotonEstadoHistorial}>Editar movimiento</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>establecerConfirmandoEliminacion(true)} style={estilos.botonEliminar}><Ionicons name="trash-outline" size={21} color="#FFFFFF"/><Text style={estilos.textoEliminar}>Eliminar movimiento</Text></Pressable>
          </View>:null}
          {movimiento.reversion_de_id?<Pressable accessibilityRole="button" onPress={()=>navegacion.push(RUTAS.DETALLE_MOVIMIENTO,{movimientoId:movimiento.reversion_de_id!})} style={[estilos.botonCancelar,estilos.enlaceOriginal]}><Text style={estilos.textoCancelar}>Ver movimiento original</Text></Pressable>:null}
        </ScrollView>
        <Modal transparent animationType="fade" visible={confirmandoEliminacion} onRequestClose={()=>!eliminando&&establecerConfirmandoEliminacion(false)}>
          <SafeAreaView style={estilos.fondoModalImporte}>
            <View accessibilityViewIsModal style={estilos.tarjetaConfirmacion}>
              <Ionicons color={tema.error} name="trash-outline" size={30}/>
              <Text accessibilityRole="header" style={estilos.tituloConfirmacion}>¿Eliminar este movimiento?</Text>
              <Text style={estilos.nombreMovimiento}>{movimiento.descripcion}</Text>
              <Text style={estilos.ayudaModalImporte}>Se conservará el original como eliminado y se registrará una corrección vinculada. El saldo se ajustará una sola vez y ambos quedarán fuera de las estadísticas. Los acuerdos de Social conservarán su estado.</Text>
              <Pressable accessibilityRole="button" disabled={eliminando} onPress={()=>confirmarEliminacion()} style={estilos.botonEliminar}><Ionicons name="trash-outline" size={20} color="#FFFFFF"/><Text style={estilos.textoEliminar}>{eliminando?'Eliminando…':'Eliminar movimiento'}</Text></Pressable>
              {movimiento.recurrencia_id?<Pressable accessibilityRole="button" disabled={eliminando} onPress={()=>confirmarEliminacion(true)} style={estilos.botonCancelar}><Text style={[estilos.textoCancelar,{color:tema.error}]}>Eliminar y desactivar recurrencia</Text></Pressable>:null}
              <Pressable accessibilityRole="button" disabled={eliminando} onPress={()=>establecerConfirmandoEliminacion(false)} style={estilos.botonCancelar}><Text style={estilos.textoCancelar}>Cancelar</Text></Pressable>
            </View>
          </SafeAreaView>
        </Modal>
        <Modal transparent animationType="fade" visible={importeVisible} onRequestClose={()=>establecerImporteVisible(false)}>
          <SafeAreaView style={estilos.fondoModalImporte}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar importe completo" onPress={()=>establecerImporteVisible(false)} style={estilos.cierreModalImporte}/>
            <View accessibilityViewIsModal style={estilos.modalImporte}>
              <View style={estilos.cabeceraModalImporte}>
                <Text accessibilityRole="header" style={estilos.tituloModalImporte}>Importe completo</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={()=>establecerImporteVisible(false)} style={estilos.botonCerrarImporte}>
                  <Ionicons name="close" size={24} color={tema.textoSecundario}/>
                </Pressable>
              </View>
              <Text style={[estilos.tipoMovimiento,{color:esIngreso?tema.exito:tema.error}]}>{obtenerNombreTipo(movimiento.tipo)}</Text>
              <View style={estilos.valorModalImporte}>
                <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={estilos.contenidoImporteCompleto}>
                  <Text selectable style={estilos.importeCompleto}>{importeFormateado}</Text>
                </ScrollView>
              </View>
              <Text style={estilos.ayudaModalImporte}>Podés deslizar el importe para verlo completo y mantenerlo presionado para copiarlo.</Text>
              <Pressable accessibilityRole="button" onPress={()=>establecerImporteVisible(false)} style={estilos.botonEstadoHistorial}>
                <Text style={estilos.textoBotonEstadoHistorial}>Cerrar</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
