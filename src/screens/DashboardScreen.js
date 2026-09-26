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
  { id: 'youtube-music', descripcion: 'YouTube Music', categoria: 'Suscripciones', fecha: 'Hoy', tipo: 'egreso', monto: '− $ 4.130', icono: 'arrow-up-outline' },
  { id: 'supermercado', descripcion: 'Supermercado', categoria: 'Alimentación', fecha: 'Ayer', tipo: 'egreso', monto: '− $ 48.500', icono: 'arrow-up-outline' },
  { id: 'sueldo', descripcion: 'Sueldo', categoria: 'Sueldo', fecha: '22 sep', tipo: 'ingreso', monto: '+ $ 1.250.000', icono: 'arrow-down-outline' },
  { id: 'farmacia', descripcion: 'Farmacia', categoria: 'Salud', fecha: '21 sep', tipo: 'egreso', monto: '− $ 7.250', icono: 'arrow-up-outline' },
  { id: 'venta', descripcion: 'Venta de bicicleta', categoria: 'Ventas', fecha: '20 sep', tipo: 'ingreso', monto: '+ $ 85.000', icono: 'arrow-down-outline' },
]);

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
                        <Ionicons color={tema.encabezado} name={deposito.icono} size={20} />
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
                  {MOVIMIENTOS_SIMULADOS.slice(0, 5).map((movimiento) => {
                    const colorMovimiento = movimiento.tipo === 'ingreso'
                      ? COLORES_ESTADO.ingreso
                      : COLORES_ESTADO.egreso;

                    return (
                      <View key={movimiento.id} style={estilos.filaMovimiento}>
                        <View style={[estilos.iconoMovimiento, { backgroundColor: colorMovimiento }]}>
                          <Ionicons color={tema.encabezado} name={movimiento.icono} size={18} />
                        </View>
                        <View style={estilos.detalleElemento}>
                          <Text style={[estilosGlobales.texto, estilos.nombreElemento]}>{movimiento.descripcion}</Text>
                          <Text style={estilosGlobales.textoAyuda}>
                            {movimiento.categoria} · {movimiento.fecha}
                          </Text>
                        </View>
                        <Text style={[estilosGlobales.etiqueta, estilos.montoMovimiento]}>
                          {movimiento.monto}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
