import { useContext, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import TarjetaNotificacion from '../components/NotificationCard';
import EncabezadoSeccion from '../components/SectionHeader';
import Conmutador from '../components/Toggle';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

const NOTIFICACIONES_SIMULADAS = Object.freeze([
  Object.freeze({
    id: 'recordatorio-gastos',
    titulo: 'Recordatorio',
    mensaje: 'No olvides registrar tus gastos de hoy. Llevás 3 movimientos esta semana.',
    fecha: 'Hoy · 20:00',
    icono: 'receipt-outline',
    tipo: 'recordatorios',
  }),
  Object.freeze({
    id: 'vencimiento-tarjeta',
    titulo: 'Vencimiento próximo',
    mensaje: 'El resumen de tu cuenta cierra en 3 días. Revisá tus egresos del mes.',
    fecha: 'Ayer · 09:00',
    icono: 'card-outline',
    tipo: 'vencimientos',
  }),
  Object.freeze({
    id: 'dinero-recibido',
    titulo: 'Recibiste $ 11.000',
    mensaje: 'Camila te envió dinero a Mercado Pago. Ya está disponible en tu depósito.',
    fecha: '25/09 · 14:20',
    icono: 'cash-outline',
    tipo: 'movimientos',
  }),
  Object.freeze({
    id: 'resumen-semanal',
    titulo: 'Tu resumen semanal',
    mensaje: 'Gastaste $ 48.500 esta semana: 60 % en Comida y 25 % en Transporte.',
    fecha: '20/09 · 08:00',
    icono: 'bar-chart-outline',
    tipo: 'resumenes',
  }),
  Object.freeze({
    id: 'deuda-pendiente',
    titulo: 'Deuda pendiente',
    mensaje: 'Juan todavía te debe $ 100 del gasto compartido del fin de semana.',
    fecha: '18/09 · 19:30',
    icono: 'people-outline',
    tipo: 'vencimientos',
  }),
]);

const TIPOS_ALERTA = Object.freeze([
  Object.freeze({ id: 'recordatorios', nombre: 'Recordatorios de registro' }),
  Object.freeze({ id: 'vencimientos', nombre: 'Vencimientos y deudas' }),
  Object.freeze({ id: 'movimientos', nombre: 'Movimientos recibidos' }),
  Object.freeze({ id: 'resumenes', nombre: 'Resúmenes y novedades' }),
]);

export default function PantallaNotificaciones({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosNotificaciones(tema);
  const [cargando, establecerCargando] = useState(true);
  const [leidas, establecerLeidas] = useState(['dinero-recibido', 'resumen-semanal', 'deuda-pendiente']);
  const [expandidaId, establecerExpandidaId] = useState(null);
  const [ajustesVisibles, establecerAjustesVisibles] = useState(false);
  const [alertasActivas, establecerAlertasActivas] = useState(
    Object.freeze({ recordatorios: true, vencimientos: true, movimientos: true, resumenes: false }),
  );

  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargando(false), 1200);
    return () => clearTimeout(temporizador);
  }, []);

  const nuevas = useMemo(
    () => NOTIFICACIONES_SIMULADAS.filter((item) => !leidas.includes(item.id)),
    [leidas],
  );

  const alternarExpandida = (notificacion) => {
    establecerExpandidaId((anterior) => (anterior === notificacion.id ? null : notificacion.id));
    if (!leidas.includes(notificacion.id)) {
      establecerLeidas((anteriores) => [...anteriores, notificacion.id]);
    }
  };

  const alternarAlerta = (tipoId) => {
    establecerAlertasActivas((anteriores) => ({ ...anteriores, [tipoId]: !anteriores[tipoId] }));
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Notificaciones"
          descripcion="Consulta los avisos importantes de AHRE."
          alVolver={() => navegacion.goBack()}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
            <View style={estilos.filaEncabezado}>
              <Text style={estilos.textoNuevas}>
                {cargando
                  ? 'Buscando avisos...'
                  : nuevas.length === 0
                    ? 'Estás al día'
                    : `${nuevas.length} nueva${nuevas.length > 1 ? 's' : ''} sin leer`}
              </Text>
              <Pressable
                accessibilityLabel="Ajustes de notificaciones"
                accessibilityRole="button"
                onPress={() => establecerAjustesVisibles(true)}
                style={estilos.botonAjustes}
              >
                <Ionicons color={tema.textoPrincipal} name="settings-outline" size={22} />
              </Pressable>
            </View>

            {cargando ? (
              <View style={[estilosGlobales.tarjeta, { gap: 12 }]}>
                <View style={estilos.lineaCarga} />
                <View style={estilos.lineaCarga} />
                <View style={estilos.lineaCarga} />
              </View>
            ) : NOTIFICACIONES_SIMULADAS.length === 0 ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.textoSecundario} name="notifications-off-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>No tenés notificaciones.</Text>
              </View>
            ) : (
              <View style={estilos.listaNotificaciones}>
                {NOTIFICACIONES_SIMULADAS.map((notificacion) => (
                  <TarjetaNotificacion
                    key={notificacion.id}
                    tema={tema}
                    estilos={estilos}
                    notificacion={notificacion}
                    nueva={!leidas.includes(notificacion.id)}
                    expandida={expandidaId === notificacion.id}
                    alPresionar={() => alternarExpandida(notificacion)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerAjustesVisibles(false)}
          transparent
          visible={ajustesVisibles}
        >
          <Pressable
            accessibilityLabel="Cerrar ajustes"
            onPress={() => establecerAjustesVisibles(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <Text style={estilos.tituloModal}>Ajustes de notificaciones</Text>
              {TIPOS_ALERTA.map((tipo, indice) => (
                <View key={tipo.id}>
                  {indice > 0 ? <View style={estilos.separadorAjuste} /> : null}
                  <View style={estilos.filaAjuste}>
                    <Text style={estilos.textoAjuste}>{tipo.nombre}</Text>
                    <Conmutador
                      tema={tema}
                      valor={alertasActivas[tipo.id]}
                      alCambiar={() => alternarAlerta(tipo.id)}
                      etiquetaAccesibilidad={tipo.nombre}
                    />
                  </View>
                </View>
              ))}
              <Text style={estilosGlobales.textoAyuda}>
                Seguirás recibiendo avisos importantes de tu cuenta aunque desactives algún tipo.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerAjustesVisibles(false)}
                style={estilosGlobales.botonSecundario}
              >
                <Text style={estilosGlobales.textoBotonSecundario}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
