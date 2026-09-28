import { useContext, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
    mensaje: 'No te olvides de registrar tus gastos de hoy.',
    fechaHora: '2026-09-27T20:00:00',
    icono: 'receipt-outline',
    tipo: 'recordatorios',
  }),
  Object.freeze({
    id: 'deuda-pendiente',
    titulo: 'Deuda pendiente',
    mensaje: 'Recordá que tenés una deuda pendiente de $ 100.',
    fechaHora: '2026-09-26T09:00:00',
    icono: 'people-outline',
    tipo: 'vencimientos',
  }),
  Object.freeze({
    id: 'movimientos-recurrentes',
    titulo: 'Movimientos recurrentes',
    mensaje: 'Tenés un ingreso recurrente de sueldo y un egreso recurrente de YouTube Music.',
    fechaHora: '2026-09-24T09:40:00',
    icono: 'repeat-outline',
    tipo: 'movimientos',
  }),
]);

const TIPOS_ALERTA = Object.freeze([
  Object.freeze({ id: 'recordatorios', nombre: 'Recordatorios de registro' }),
  Object.freeze({ id: 'vencimientos', nombre: 'Vencimientos y deudas' }),
  Object.freeze({ id: 'movimientos', nombre: 'Movimientos registrados' }),
  Object.freeze({ id: 'resumenes', nombre: 'Resúmenes y novedades' }),
]);

function crearFechaSinHora(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaDia(fecha) {
  const hoy = new Date();
  const fechaNormalizada = crearFechaSinHora(fecha);
  const hoyNormalizado = crearFechaSinHora(hoy);
  const diferenciaDias = Math.round((hoyNormalizado - fechaNormalizada) / 86400000);

  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  });
}

function agruparNotificacionesPorDia(notificaciones) {
  return notificaciones
    .slice()
    .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
    .reduce((grupos, notificacion) => {
      const fecha = new Date(notificacion.fechaHora);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
      let grupo = grupos[grupos.length - 1];

      if (!grupo || grupo.clave !== clave) {
        grupo = { clave, fecha, notificaciones: [] };
        grupos.push(grupo);
      }

      grupo.notificaciones.push(notificacion);
      return grupos;
    }, []);
}

export default function PantallaNotificaciones({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const { bottom: insetInferior } = useSafeAreaInsets();
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosNotificaciones(tema, insetInferior);
  const [cargando, establecerCargando] = useState(true);
  const [leidas, establecerLeidas] = useState(['deuda-pendiente']);
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
  const gruposNotificaciones = useMemo(
    () => agruparNotificacionesPorDia(NOTIFICACIONES_SIMULADAS),
    [],
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
                {gruposNotificaciones.map((grupo) => (
                  <View key={grupo.clave} style={estilos.grupoDia}>
                    <Text accessibilityRole="header" style={estilos.tituloDia}>
                      {formatearFechaDia(grupo.fecha)}
                    </Text>
                    <View style={estilos.notificacionesDia}>
                      {grupo.notificaciones.map((notificacion) => (
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
                  </View>
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
