import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoPrincipal from '../components/MainHeader';
import { RUTAS } from '../constants/routes';
import {
  COLOR_DEPOSITO_PREDETERMINADO,
  COLOR_ICONO_DEPOSITO,
  COLORES_DEPOSITOS,
  COLORES_ESTADO,
  TEMAS,
} from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDashboard } from '../styles/DashboardScreenStyles';

const DEPOSITOS_SIMULADOS = Object.freeze([
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    tipo: 'Efectivo',
    descripcion: 'Para gastos diarios',
    color: COLOR_DEPOSITO_PREDETERMINADO,
    saldo: '$ 354.000',
    icono: 'cash-outline',
  },
  {
    id: 'mercado-pago',
    nombre: 'Mercado Pago',
    tipo: 'Billetera virtual',
    descripcion: 'Pagos y transferencias',
    color: COLORES_DEPOSITOS[1],
    saldo: '$ 132.342',
    icono: 'phone-portrait-outline',
  },
  {
    id: 'banco',
    nombre: 'Banco',
    tipo: 'Cuenta bancaria',
    descripcion: 'Cuenta para ahorro y gastos',
    color: COLORES_DEPOSITOS[2],
    saldo: '$ 239.023',
    icono: 'business-outline',
  },
]);

const MOVIMIENTOS_SIMULADOS = Object.freeze([
  { id: 'youtube-music', descripcion: 'YouTube Music', categoria: 'Suscripciones', fecha_hora: '2026-09-26T09:40:00', deposito: 'Mercado Pago', tipo: 'egreso', monto: 4130, icono: 'repeat-outline' },
  { id: 'supermercado', descripcion: 'Supermercado', categoria: 'Alimentación', fecha_hora: '2026-09-25T18:45:00', deposito: 'Mercado Pago', tipo: 'egreso', monto: 48500, icono: 'restaurant-outline' },
  { id: 'sueldo', descripcion: 'Sueldo', categoria: 'Sueldo', fecha_hora: '2026-09-22T09:00:00', deposito: 'Efectivo', tipo: 'ingreso', monto: 1250000, icono: 'cash-outline' },
  { id: 'farmacia', descripcion: 'Farmacia', categoria: 'Salud', fecha_hora: '2026-09-21T19:15:00', deposito: 'Cuenta bancaria', tipo: 'egreso', monto: 7250, icono: 'medkit-outline' },
  { id: 'venta', descripcion: 'Venta de bicicleta', categoria: 'Ventas', fecha_hora: '2026-09-20T16:30:00', deposito: 'Efectivo', tipo: 'ingreso', monto: 85000, icono: 'storefront-outline' },
]);

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

const ESTA_CARGANDO = false;

export default function PantallaPanel({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDashboard(tema);
  const [saldoVisible, establecerSaldoVisible] = useState(true);
  const abrirPantalla = (ruta) => navegacion.getParent()?.navigate(ruta);
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
            descripcion="Thiago"
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
                      <Text style={[estilosGlobales.monto, estilos.montoBalance]}>
                        {saldoVisible ? '$ 2.000.000' : '$ •••••••'}
                      </Text>
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

            <View style={estilos.seccion}>
              <View style={estilos.encabezadoSeccion}>
                <Text style={estilosGlobales.encabezadoSeccion}>Tus depósitos</Text>
                <Pressable
                  accessibilityLabel="Agregar depósito"
                  accessibilityRole="button"
                  onPress={() => abrirPantalla(RUTAS.DEPOSITO)}
                  style={({ pressed }) => [
                    estilos.accionSeccion,
                    pressed && estilos.accionSeccionPresionada,
                  ]}
                >
                  <Ionicons color={tema.foco} name="add-circle-outline" size={19} />
                  <Text style={estilos.textoAgregarDeposito}>Agregar depósito</Text>
                </Pressable>
              </View>

              {ESTA_CARGANDO ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoCarga]}>
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                </View>
              ) : DEPOSITOS_SIMULADOS.length === 0 ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
                  <Text style={[estilosGlobales.textoSecundario, estilos.textoEstado]}>
                    Todavía no hay depósitos. Crea uno para empezar a organizar tu dinero.
                  </Text>
                </View>
              ) : (
                <View style={estilos.listaDepositos}>
                  {DEPOSITOS_SIMULADOS.map((deposito) => (
                    <Pressable
                      accessibilityRole="button"
                      key={deposito.id}
                      onPress={() => abrirPantalla(RUTAS.DETALLE_DEPOSITO)}
                      style={({ pressed }) => [
                        estilos.filaDeposito,
                        pressed && estilos.elementoPresionado,
                      ]}
                    >
                      <View style={[estilos.iconoDeposito, { backgroundColor: deposito.color }]}>
                        <Ionicons color={COLOR_ICONO_DEPOSITO} name={deposito.icono} size={20} />
                      </View>
                      <View style={estilos.detalleElemento}>
                        <Text style={[estilosGlobales.texto, estilos.nombreElemento]}>{deposito.nombre}</Text>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={estilos.descripcionDeposito}
                        >
                          {deposito.tipo} · {deposito.descripcion}
                        </Text>
                      </View>
                      <View style={estilos.finalDeposito}>
                        <Text style={[estilosGlobales.etiqueta, estilos.saldoDeposito]}>{deposito.saldo}</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={17} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={estilos.seccion}>
              <View style={estilos.encabezadoSeccion}>
                <Text style={estilosGlobales.encabezadoSeccion}>Movimientos recientes</Text>
                <Pressable
                  accessibilityLabel="Ver todos los movimientos"
                  accessibilityRole="button"
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

              {ESTA_CARGANDO ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoCarga]}>
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                </View>
              ) : MOVIMIENTOS_SIMULADOS.length === 0 ? (
                <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}>
                  <Text style={[estilosGlobales.textoSecundario, estilos.textoEstado]}>
                    Todavía no hay movimientos para mostrar.
                  </Text>
                </View>
              ) : (
                <View style={estilos.listaMovimientos}>
                  {agruparMovimientosPorDia(MOVIMIENTOS_SIMULADOS.slice(0, 5)).map((grupo) => (
                    <View key={grupo.clave} style={estilos.grupoDia}>
                      <Text accessibilityRole="header" style={estilos.tituloDia}>
                        {formatearFechaDia(grupo.fecha)}
                      </Text>
                      <View style={estilos.movimientosDia}>
                        {grupo.movimientos.map((movimiento) => {
                          const colorMovimiento = movimiento.tipo === 'ingreso'
                            ? COLORES_ESTADO.ingreso
                            : COLORES_ESTADO.egreso;
                          const textoMonto = `${movimiento.tipo === 'ingreso' ? '+' : '-'}$${Math.round(movimiento.monto).toLocaleString('es-AR')}`;

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
                                  {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
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
