import { useCallback, useContext, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obtenerSesionActual } from '../authentication/sessionService';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import EncabezadoPrincipal from '../components/MainHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { depositosRepositorio, movimientosRepositorio } from '../database/repositories';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO, COLORES_ESTADO } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDashboard } from '../styles/DashboardScreenStyles';

const CANTIDAD_MOVIMIENTOS_RECIENTES = 5;
const CATEGORIAS_POR_ID = new Map(
  [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO].map((categoria) => [categoria.id, categoria]),
);
const TIPOS_DEPOSITO = Object.freeze({
  efectivo: { nombre: 'Efectivo', icono: 'cash-outline' },
  banco: { nombre: 'Cuenta bancaria', icono: 'business-outline' },
  billetera_virtual: { nombre: 'Billetera virtual', icono: 'phone-portrait-outline' },
});

function obtenerNombreTipoMovimiento(tipo) {
  if (tipo === 'ingreso') return 'Ingreso';
  if (tipo === 'egreso') return 'Egreso';
  if (tipo === 'transferencia_entrada') return 'Transferencia recibida';
  if (tipo === 'transferencia_salida') return 'Transferencia enviada';
  return 'Movimiento';
}

function esMovimientoDeIngreso(tipo) {
  return tipo === 'ingreso' || tipo === 'transferencia_entrada';
}

function formatearMonto(monto) {
  const montoRedondeado = Math.round(Number(monto) || 0);
  const signo = montoRedondeado < 0 ? '-$ ' : '$ ';
  return `${signo}${Math.abs(montoRedondeado).toLocaleString('es-AR')}`;
}

function prepararMovimiento(movimiento, depositosPorId) {
  const categoria = CATEGORIAS_POR_ID.get(movimiento.categoria);
  const tipoDeposito = TIPOS_DEPOSITO[depositosPorId.get(movimiento.deposito_id)?.tipo];
  const nombreCategoria = categoria?.nombre
    || String(movimiento.categoria || 'Movimiento').replace(/_/g, ' ');
  const iconoPorTipo = movimiento.tipo.startsWith('transferencia_')
    ? 'swap-horizontal-outline'
    : esMovimientoDeIngreso(movimiento.tipo)
      ? 'cash-outline'
      : 'card-outline';

  return {
    ...movimiento,
    categoria: nombreCategoria,
    descripcion: movimiento.descripcion || nombreCategoria,
    deposito: depositosPorId.get(movimiento.deposito_id)?.nombre || tipoDeposito?.nombre || 'Depósito',
    icono: categoria?.icono || iconoPorTipo,
  };
}

function formatearFechaDia(fecha) {
  const hoy = new Date();
  const fechaNormalizada = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diferenciaDias = Math.round((hoyNormalizado - fechaNormalizada) / 86400000);

  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function formatearHora(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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

const ACCIONES_RAPIDAS = Object.freeze([
  { etiqueta: 'Ingreso', icono: 'add-circle', ruta: RUTAS.INGRESO },
  { etiqueta: 'Egreso', icono: 'remove-circle', ruta: RUTAS.EGRESO },
  { etiqueta: 'OCR', icono: 'scan-sharp', ruta: RUTAS.OCR },
]);

export default function PantallaPanel({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const contextoAvisos = useContext(ContextoAvisos);
  const mostrarAviso = contextoAvisos?.mostrarAviso;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDashboard(tema);
  const [saldoVisible, establecerSaldoVisible] = useState(true);
  const [usuario, establecerUsuario] = useState(null);
  const [depositos, establecerDepositos] = useState([]);
  const [movimientos, establecerMovimientos] = useState([]);
  const [balance, establecerBalance] = useState(0);
  const [cargando, establecerCargando] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState(null);
  const secuenciaCarga = useRef(0);
  const abrirPantalla = (ruta) => navegacion.getParent()?.navigate(ruta);

  const cargarDatos = useCallback(async () => {
    const identificadorCarga = secuenciaCarga.current + 1;
    secuenciaCarga.current = identificadorCarga;
    establecerCargando(true);
    establecerErrorCarga(null);
    establecerUsuario(null);
    let usuarioNoDisponible = false;

    try {
      const sesion = await obtenerSesionActual();
      if (!sesion.usuario) {
        usuarioNoDisponible = true;
        throw new Error('usuario_no_disponible');
      }

      const depositosUsuario = await depositosRepositorio.consultar(
        { usuario_id: sesion.usuario.id },
        { ordenarPor: 'fecha_creacion', direccion: 'ASC' },
      );
      const identificadoresDepositos = depositosUsuario.map(({ id }) => id);
      const filasMovimientos = identificadoresDepositos.length > 0
        ? await movimientosRepositorio.consultar(
          { deposito_id: identificadoresDepositos, anulado: 0 },
          {
            ordenarPor: 'fecha_hora',
            direccion: 'DESC',
            limite: CANTIDAD_MOVIMIENTOS_RECIENTES,
          },
        )
        : [];
      const depositosPorId = new Map(depositosUsuario.map((deposito) => [deposito.id, deposito]));
      const movimientosPreparados = filasMovimientos.map((movimiento) =>
        prepararMovimiento(movimiento, depositosPorId),
      );
      const balanceUsuario = depositosUsuario.reduce(
        (total, deposito) => total + (Number(deposito.saldo_actual) || 0),
        0,
      );

      if (identificadorCarga !== secuenciaCarga.current) return;
      establecerUsuario(sesion.usuario);
      establecerDepositos(depositosUsuario);
      establecerMovimientos(movimientosPreparados);
      establecerBalance(balanceUsuario);
    } catch (_error) {
      if (identificadorCarga !== secuenciaCarga.current) return;
      const mensaje = usuarioNoDisponible
        ? 'No se encontró un usuario activo para esta sesión. Intentá nuevamente.'
        : 'No se pudieron cargar los datos del inicio. Intentá nuevamente.';
      establecerErrorCarga(mensaje);
      mostrarAviso?.(mensaje, { tipo: 'error' });
    } finally {
      if (identificadorCarga === secuenciaCarga.current) {
        establecerCargando(false);
      }
    }
  }, [mostrarAviso]);

  useFocusEffect(useCallback(() => {
    cargarDatos();
    return () => {
      secuenciaCarga.current += 1;
    };
  }, [cargarDatos]));

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <ScrollView
          contentContainerStyle={estilos.contenidoDesplazable}
          showsVerticalScrollIndicator={false}
        >
          <EncabezadoPrincipal
            tema={tema}
            titulo="Bienvenido"
            descripcion={usuario?.nombre}
            alAbrirNotificaciones={() => abrirPantalla(RUTAS.NOTIFICACIONES)}
            alAbrirPerfil={() => abrirPantalla(RUTAS.PERFIL)}
            altura={120}
          />

          <View style={estilos.contenidoDashboard}>
            <View style={estilos.contenedorTarjetaBalance}>
              <View style={[estilosGlobales.tarjeta, estilos.tarjetaBalance]}>
                <View style={estilos.encabezadoBalance}>
                  <Text style={[estilos.textoPestanaBalance, { color: tema.textoPrincipal }]}>Balance</Text>
                </View>
                <View style={estilos.contenidoBalance}>
                  <View style={estilos.filaBalance}>
                    <View style={estilos.filaSaldo}>
                      {cargando ? (
                        <View style={[estilos.lineaCarga, estilos.lineaCargaBalance]} />
                      ) : (
                        <Text style={[estilosGlobales.monto, estilos.montoBalance]}>
                          {errorCarga ? '—' : saldoVisible ? formatearMonto(balance) : '$ •••••••'}
                        </Text>
                      )}
                      <Pressable
                        accessibilityLabel={saldoVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => establecerSaldoVisible((visible) => !visible)}
                        style={estilos.botonVisibilidad}
                      >
                        <Ionicons
                          color={tema.textoSecundario}
                          name={saldoVisible ? 'eye-outline' : 'eye-off-outline'}
                          size={21}
                        />
                      </Pressable>
                    </View>
                    <Pressable
                      accessibilityLabel="Ver movimientos"
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => navegacion.navigate(RUTAS.MOVIMIENTOS)}
                      style={estilos.botonAccesoMovimientos}
                    >
                      <Ionicons color={tema.textoPrincipal} name="chevron-forward" size={21} />
                    </Pressable>
                  </View>

                  <View style={estilos.accionesRapidas}>
                    {ACCIONES_RAPIDAS.map((accion) => (
                      <Pressable
                        accessibilityRole="button"
                        key={accion.ruta}
                        onPress={() => abrirPantalla(accion.ruta)}
                        style={({ pressed }) => [
                          estilos.accionRapida,
                          pressed && estilos.accionRapidaPresionada,
                        ]}
                      >
                        <Ionicons color={tema.encabezado} name={accion.icono} size={27} />
                        <Text style={estilos.textoAccionRapida}>{accion.etiqueta}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {errorCarga ? (
              <View accessibilityRole="alert" style={estilos.estadoError}>
                <Text style={estilos.textoError}>{errorCarga}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={cargarDatos}
                  style={({ pressed }) => [
                    estilos.botonReintentar,
                    pressed && estilos.accionSeccionPresionada,
                  ]}
                >
                  <Text style={estilos.textoReintentar}>Reintentar</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={estilos.seccion}>
              <View style={estilos.encabezadoSeccion}>
                <Text style={estilosGlobales.encabezadoSeccion}>Tus depósitos</Text>
                {depositos.length > 0 || cargando || errorCarga ? (
                  <Pressable
                    accessibilityLabel="Agregar depósito"
                    accessibilityRole="button"
                    hitSlop={4}
                    onPress={() => abrirPantalla(RUTAS.DEPOSITO)}
                    style={({ pressed }) => [
                      estilos.accionSeccion,
                      pressed && estilos.accionSeccionPresionada,
                    ]}
                  >
                    <Ionicons color={tema.foco} name="add-circle-outline" size={19} />
                    <Text style={estilos.textoAgregarDeposito}>Agregar depósito</Text>
                  </Pressable>
                ) : null}
              </View>

              {cargando ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoCarga]}>
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                </View>
              ) : errorCarga ? null : depositos.length === 0 ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
                  <View style={estilos.contenidoEstadoVacio}>
                    <View style={estilos.iconoEstadoVacio}>
                      <Ionicons color={tema.foco} name="wallet-outline" size={25} />
                    </View>
                    <View style={estilos.textoContenidoEstadoVacio}>
                      <Text style={estilos.textoVacioTitulo}>Todavía no tenés depósitos</Text>
                      <Text style={[estilosGlobales.textoSecundario, estilos.textoEstado]}>
                        Creá tu primer depósito para organizar tu dinero y ver el saldo acá.
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel="Crear depósito"
                    accessibilityRole="button"
                    onPress={() => abrirPantalla(RUTAS.DEPOSITO)}
                    style={({ pressed }) => [
                      estilos.botonCrearDeposito,
                      pressed && estilos.accionSeccionPresionada,
                    ]}
                  >
                    <Ionicons color={tema.botonPrincipalTexto} name="add" size={20} />
                    <Text style={estilos.textoBotonCrearDeposito}>Crear depósito</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={estilos.listaDepositos}>
                  {depositos.map((deposito) => {
                    const tipoDeposito = TIPOS_DEPOSITO[deposito.tipo];
                    const iconoDeposito = deposito.icono || tipoDeposito?.icono || 'wallet-outline';
                    const detalleDeposito = [
                      tipoDeposito?.nombre || String(deposito.tipo || '').replace(/_/g, ' '),
                      deposito.descripcion,
                    ].filter(Boolean).join(' · ');

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={deposito.id}
                        onPress={() => navegacion.getParent()?.navigate(RUTAS.DETALLE_DEPOSITO, { deposito })}
                        style={({ pressed }) => [
                          estilos.filaDeposito,
                          pressed && estilos.elementoPresionado,
                        ]}
                      >
                        <View style={[estilos.iconoDeposito, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                          <Ionicons color={COLOR_ICONO_DEPOSITO} name={iconoDeposito} size={20} />
                        </View>
                        <View style={estilos.detalleElemento}>
                          <Text style={[estilosGlobales.texto, estilos.nombreElemento]}>{deposito.nombre}</Text>
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={estilos.descripcionDeposito}
                          >
                            {detalleDeposito}
                          </Text>
                        </View>
                        <View style={estilos.finalDeposito}>
                          <Text style={[estilosGlobales.etiqueta, estilos.saldoDeposito]}>
                            {formatearMonto(deposito.saldo_actual)}
                          </Text>
                          <Ionicons color={tema.textoSecundario} name="chevron-forward" size={17} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={estilos.seccion}>
              <View style={estilos.encabezadoSeccion}>
                <Text style={estilosGlobales.encabezadoSeccion}>Movimientos recientes</Text>
                <Pressable
                  accessibilityLabel="Ver todos los movimientos"
                  accessibilityRole="button"
                  hitSlop={4}
                  onPress={() => navegacion.navigate(RUTAS.MOVIMIENTOS)}
                  style={({ pressed }) => [
                    estilos.accionSeccion,
                    pressed && estilos.accionSeccionPresionada,
                  ]}
                >
                  <Text style={estilos.textoVerTodos}>Ver todos</Text>
                  <Ionicons color={tema.foco} name="chevron-forward" size={17} />
                </Pressable>
              </View>

              {cargando ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoCarga]}>
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                </View>
              ) : errorCarga ? null : movimientos.length === 0 ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
                  <View style={estilos.contenidoEstadoVacio}>
                    <View style={estilos.iconoEstadoVacio}>
                      <Ionicons color={tema.foco} name="swap-horizontal-outline" size={25} />
                    </View>
                    <View style={estilos.textoContenidoEstadoVacio}>
                      <Text style={estilos.textoVacioTitulo}>Todavía no hay movimientos</Text>
                      <Text style={[estilosGlobales.textoSecundario, estilos.textoEstado]}>
                        Cuando registres ingresos o egresos, los vas a ver acá.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={estilos.listaMovimientos}>
                  {agruparMovimientosPorDia(movimientos).map((grupo) => (
                    <View key={grupo.clave} style={estilos.grupoDia}>
                      <Text accessibilityRole="header" style={estilos.tituloDia}>
                        {formatearFechaDia(grupo.fecha)}
                      </Text>
                      <View style={estilos.movimientosDia}>
                        {grupo.movimientos.map((movimiento) => {
                          const esIngreso = esMovimientoDeIngreso(movimiento.tipo);
                          const colorMovimiento = esIngreso
                            ? COLORES_ESTADO.ingreso
                            : COLORES_ESTADO.egreso;
                          const textoMonto = `${esIngreso ? '+' : '-'}${formatearMonto(movimiento.monto)}`;

                          return (
                            <View key={movimiento.id} style={estilos.filaMovimiento}>
                              <View style={[estilos.iconoMovimiento, { backgroundColor: colorMovimiento }]}>
                                <Ionicons color={tema.encabezado} name={movimiento.icono} size={20} />
                              </View>
                              <View style={estilos.detalleElemento}>
                                <View style={estilos.filaCategoriaDescripcion}>
                                  <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.categoriaMovimiento}>
                                    {movimiento.categoria}
                                  </Text>
                                  <Text style={estilos.separadorMetadatos}>·</Text>
                                  <Text
                                    ellipsizeMode="tail"
                                    numberOfLines={1}
                                    style={[estilos.categoriaMovimiento, estilos.descripcionMovimiento]}
                                  >
                                    {movimiento.descripcion}
                                  </Text>
                                </View>
                                <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.metaMovimiento}>
                                  {formatearHora(movimiento.fecha_hora)} · {movimiento.deposito}
                                </Text>
                                <Text style={estilos.tipoMovimiento}>
                                  {obtenerNombreTipoMovimiento(movimiento.tipo)}
                                </Text>
                              </View>
                              <Text style={estilos.montoMovimiento}>{textoMonto}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
